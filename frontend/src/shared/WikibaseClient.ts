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
	UserSessionModel,
	WikibasePropertyModel,
} from "./client/ApiClient";

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

	async login() {
		this.userSession = await this.api.auth.login(this.credentials);
		if (!this.userSession.username) {
			throw new Error("Login failed: " + JSON.stringify(this.userSession));
		}

		const initJobs = [this.loadProperties(), this.loadServerInfo()];
		await Promise.all(initJobs);
		return this.userSession;
	}

	async logout() {
		await this.api.auth.logout();
	}

	async search(search: string): Promise<any> {
		const results = await this.api.entity.search(search);
		return results;
	}

	async getUserGraph(): Promise<ElementDefinition[]> {
		const results = await this.api.sparql.userGraph();
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

	// To handle cytoscape-parents
	async getCategories(): Promise<ElementDefinition[]> {
		const results = await this.api.sparql.categories();
		const parents = this.sparqlParser.parseParents(results.data);
		return parents;
	}

	async getResource(): Promise<ElementDefinition[]> {
		// @ts-ignore
		const results = await this.api.sparql.resources();
		const resources = this.sparqlParser.parsePairs(
			["dependency", "source"],
			"resource",
			results.data
		);
		return resources;
	}

	// To handle WissGraph
	async getWissGraph(): Promise<ElementDefinition[]> {
		const results = await this.api.sparql.wissArb();
		const graph = this.sparqlParser.parsePairs(
			["item", "source"],
			"includes",
			results.data
		);
		return graph;
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
			console.log("exists?", e);
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
		console.log("got entities", entities, eintityIds);
		const entityInfos = Object.values(entities.data.entities).map(
			(entity: any) => {
				const enLabel = entity.labels.en?.value,
					enDescription = entity.descriptions.en?.value;

				const deLabel = entity.labels.de?.value,
					deDescription = entity.descriptions.de?.value;

				const label = enLabel ?? deLabel ?? entity.id,
					description = enDescription ?? deDescription ?? "";

				const url = this.getEntityUrl(entity.id);
				return { label, description, id: entity.id, url };
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
}
