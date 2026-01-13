import { ElementDefinition } from "cytoscape";
import { SparqlParser } from "./sparql/SparqlParser";
import { Credentials, wikibaseEditConfig } from "./WikibaseEditConfig";
import { getEnvVar } from "./util/Env";
import {
	ApiClient,
	ConvertClaimModel,
	CreateClaimModel,
	CredentialsModel,
	RemoveClaimModel,
	ServerInfoModel,
	SparqlResultModel,
	UserSessionModel,
	WikibasePropertyModel,
} from "./client/ApiClient";
import { match } from "assert";

export default class WikibaseClient {
	private readonly sparqlParser: SparqlParser;
	private readonly credentials: Credentials;
	private readonly api: ApiClient<unknown>;
	private properties: WikibasePropertyModel[] = [];
	private info: ServerInfoModel | undefined;

	private userSession: UserSessionModel | undefined;

	constructor(credentials: Credentials, api: ApiClient<unknown>) {
		this.credentials = credentials;
		this.sparqlParser = new SparqlParser();
		this.api = api;
	}

	setCredentials(credentials: Credentials) {
		this.credentials.username = credentials.username;
		this.credentials.password = credentials.password;
	}

	async userGroups(credentials: Credentials): Promise<boolean> {
		const adminrights = await this.api.auth.usergroups(credentials.username);
		console.log("user info: Admin =", adminrights);
		return adminrights;
	}

	async checkItemViewability(qid:string): Promise<boolean> {
		const result = await this.api.auth.checkItemViewability(qid);
		return result;
	}

	async login() {
		this.userSession = await this.api.auth.login(this.credentials);
		if (!this.userSession.username) {
			const error = this.userSession as any
			throw new Error("Failed: " + JSON.stringify(error.message));
		}

		const initJobs = [this.loadProperties(), this.loadServerInfo()];
		await Promise.all(initJobs);
		return this.userSession;
	}

	async logout() {
		await this.api.auth.logout();
	}

	async search(search: string, searchLang: string): Promise<any> {
		const results = await this.api.entity.search(search, searchLang);
		return results;
	}

	async getSubClassCourse(): Promise<ElementDefinition[]> {
		const results = await this.api.sparql.subClassCourse();
		const graph = this.sparqlParser.parsePairs(
			["source", "dependency"],
			"depends on",
			results.data
		);

		return graph;
	}

	async getUserInfo(): Promise<any> {
		const info = await this.api.auth.whoAmI();
		return info;
	}

	async getUserRole(): Promise<any> {
		const role = await this.api.auth.userRole();
		return role;
	}

	// To handle cytoscape-parents
	async getCategories(): Promise<ElementDefinition[]> {
		const results = await this.api.sparql.categories();
		const parents = this.sparqlParser.parseParents(results.data);
		return parents;
	}

	async getResource(courseId:string): Promise<ElementDefinition[]> {
		// @ts-ignore
		const results = await this.api.sparql.resources(courseId);
		const resources = this.sparqlParser.parsePairs(
			["resource", "source"],
			"resource",
			results.data
		);
		return resources;
	}

	async getCourseQuery(courseId:string): Promise<ElementDefinition[]> {
		const results = await this.api.sparql.courseQuery(courseId);
		const graph = this.sparqlParser.parsePairs(
			["source", "dependency"],
			"depends on",
			results.data
		);
		return graph;
	}

	async getItemResource(qid: string): Promise<ElementDefinition[]> {
		try {
			const result = await this.api.sparql.itemResource(qid)
			return result.data.results.bindings;
		} catch (err) {
			return [];
		}
	}

	async getCoursesTaken(): Promise<ElementDefinition[]> {
		try {
			const result = await this.api.sparql.coursesTaken();
			return result.data.results.bindings;
		} catch (err) {
			return [];
		}
	}

	/**
	 * Check if an item in "included in" a course the current user "participates in" 
	 * @param qid the QID of the item that is being checked
	 * @returns 
	 */
	async getItemInclusion(qid: string, userQid: string): Promise<any> {
		try {
			const result = await this.api.sparql.itemInclusion(qid, userQid);
			return result;
		} catch (err) {
			return [];
		}
	}

	/**
	 * Check if an item is a person-item (e.g. a Student) 
	 * @param qid of the item to check
	 * @returns the Label of the person-item or false (if not a person)
	 */
	async getIsPerson(qid: string): Promise<any> {
		try {
			const result = await this.api.sparql.isPerson(qid);
			return result;
		} catch(err) {
			return [];
		}
	}

	async getExistingCourses(): Promise<any> {
		try {
			const result = await this.api.sparql.existingCourses();
			return result;
		} catch(err) {
			return [];
		}
	}

	async getLabelMatches(label:string, lang:string="en", limit:number=10): Promise<any> {
		// NOTE: SPARQL requires escaped regex -> so replace all "\" with "\\"
		if (label.includes("\\")) { 
			label = label.replaceAll("\\", "\\\\");
		}
		label = encodeURIComponent(label)
		try {
			const matches = await this.api.sparql.labelMatches(label, lang, limit);
			return matches.data.results.bindings;
		} catch(err) {
			return [];
		}
	}

	async getEntities(entityIds: string[]): Promise<any> {
		// if more than 50 entityIds, split into multiple requests
		if (entityIds.length > 50) {
			const idChunks = [];
			for (let i = 0; i < entityIds.length; i += 50) {
				const numberOfIdsToTake = Math.min(50, entityIds.length - i);
				idChunks.push(entityIds.slice(i, i + numberOfIdsToTake));
			}
			const entities = await Promise.all(
				idChunks.map((ids) => this.getEntities(ids))
			);
			// merge on the data.entities level
			const mergedEntities = entities.reduce((acc, val) => {
				return {
					data: {
						entities: {
							...acc.data.entities,
							...val.data.entities,
						},
					},
				};
			});
			return mergedEntities;
		} else {
			return await this.api.entity.entities(entityIds.join("|"));
		}
	}

	async entityDoesExist(entityId: string): Promise<boolean> {
		try {
			const e = await this.getEntities([entityId]);
			return e?.data !== undefined;
		} catch (err) {
			return false;
		}
	}

	/**
	 * Returns label and description of an entity
	 */
	async getEntityInfos(eintityIds: string[]): Promise<
		{
			id: string;
			label: string;
			description: string;
			url: string;
		}[]
	> {
		if (eintityIds.length === 0) return [];
		const entities = await this.getEntities(eintityIds);

		const entityInfos = Object.values(entities.data.entities).map(
			(entity: any) => {
				const enLabel = entity.labels.en?.value,
					enDescription = entity.descriptions.en?.value;

				const deLabel = entity.labels.de?.value,
					deDescription = entity.descriptions.de?.value;

				const label = enLabel ?? deLabel ?? entity.id,
					description = enDescription ?? deDescription ?? "";

				const url = this.getEntityUrl(entity.id);
				return { label, description, id: entity.id, url};
			}
		);
		return entityInfos;
	}

	getEntityUrl(entityId: string): string {
		return `${this.info?.instance}/wiki/Item:${entityId}`;
	}

	async loadProperties() {
		this.properties = await this.api.entity.properties();
	}

	async loadServerInfo() {
		this.info = await this.api.info.info();
	}

	getCachedProperties() {
		return this.properties;
	}

	findCachedPropertyById(id: string) {
		return this.properties.find((p) => p.propertyId === id);
	}

	async convertClaim(fromEntityId: string, convert: ConvertClaimModel) {
		return await this.api.claim.move(fromEntityId, convert);
	}

	async createClaim(entityId: string, create: CreateClaimModel) {
		return await this.api.claim.create(entityId, create);
	}

	async removeClaim(entityId: string, claim: RemoveClaimModel) {
		return await this.api.claim.remove(entityId, claim);
	}

	private async toggleUserProperty(
		propertyLabel: string,
		entityId: string,
		isOn: boolean
	) {
		const userItemId = this.userSession?.userItemId;
		if (userItemId === undefined) {
			throw new Error("User item id not found");
		}

		const propertyId = this.getCachedProperties().find(
			(p) => p.label === propertyLabel
		)?.propertyId;

		if (propertyId === undefined) {
			throw new Error(
				"Property not found: " +
					propertyLabel +
					JSON.stringify(this.getCachedProperties())
			);
		}

		return await this.api.user.toggleProperty(
			userItemId,
			propertyId,
			entityId,
			isOn
		);
	}

	async toggleIsInterested(entityId: string, isInterested: boolean) {
		return await this.toggleUserProperty(
			"interested in",
			entityId,
			isInterested
		);
	}

	async toggleIsCompleted(entityId: string, isCompleted: boolean) {
		return await this.toggleUserProperty(
			"has completed",
			entityId,
			isCompleted
		);
	}

	async createNewItem(item:any) {
		return await this.api.entity.createNewItem(JSON.stringify(item));
	}
}
