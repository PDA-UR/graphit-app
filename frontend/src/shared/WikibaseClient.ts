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
}
