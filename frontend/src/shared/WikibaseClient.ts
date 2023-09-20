import { ElementDefinition } from "cytoscape";
import { SparqlParser } from "./sparql/SparqlParser";
import { Credentials, wikibaseEditConfig } from "./WikibaseEditConfig";
import { getEnvVar } from "./util/Env";
import { ApiClient, CredentialsModel } from "./client/ApiClient";

export default class WikibaseClient {
	private readonly sparqlParser: SparqlParser;
	private readonly credentials: Credentials;
	private readonly api: ApiClient<unknown>;

	constructor(credentials: Credentials, api: ApiClient<unknown>) {
		this.credentials = credentials;
		this.sparqlParser = new SparqlParser();
		this.api = api;
	}

	setCredentials(credentials: Credentials) {
		this.credentials.username = credentials.username;
		this.credentials.password = credentials.password;
	}

	async login(): Promise<any> {
		const r = (await this.api.auth.login(this.credentials)) as any;
		if (!r.username) {
			throw new Error("Login failed: " + r.message);
		}
		return r;
	}

	async logout(): Promise<any> {
		await this.api.auth.logout();
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
		}[]
	> {
		if (eintityIds.length === 0) return [];
		const entities = await this.getEntities(eintityIds);
		console.log("got entities", entities, eintityIds);
		const entityInfos = Object.values(entities.data.entities).map(
			(entity: any) => {
				console.log("parsing entity", entity);
				const enLabel = entity.labels.en?.value,
					enDescription = entity.descriptions.en?.value;

				const deLabel = entity.labels.de?.value,
					deDescription = entity.descriptions.de?.value;

				const label = enLabel ?? deLabel ?? entity.id,
					description = enDescription ?? deDescription ?? "";

				return { label, description, id: entity.id };
			}
		);
		return entityInfos;
	}
}
