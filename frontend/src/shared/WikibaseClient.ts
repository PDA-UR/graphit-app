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

	async login(): Promise<any> {
		return await this.api.auth.login(this.credentials);
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
}
