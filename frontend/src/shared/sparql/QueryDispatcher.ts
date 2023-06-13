import { EntityId, Wbk, WBK } from "wikibase-sdk";
import type { SparqlResults } from "wikibase-sdk";
import { getEnvVar } from "../util/Env";

// Dont use this class directly, use the SparqlClient class instead

const instance = getEnvVar("VITE_WIKIBASE_INSTANCE");

export default class QueryDispatcher {
	private readonly instance = instance;
	// private readonly endpoint = `${instance}/proxy/wdqs/bigdata/namespace/wdq/sparql`;

	private readonly endpoint =
		"https://query.graphit.ur.de/proxy/wdqs/bigdata/namespace/wdq/sparql";

	private readonly wbk: Wbk;

	constructor() {
		console.log("QueryDispatcher constructor");
		this.wbk = WBK({
			sparqlEndpoint: this.endpoint,
			instance: this.instance,
		});
		console.log("QueryDispatcher constructor done");
	}

	async query(sparql: string): Promise<SparqlResults> {
		console.log("QueryDispatcher query");
		const url = this.wbk.sparqlQuery(sparql);
		console.log("QueryDispatcher query url", url);
		const headers = {};

		const response = await fetch(url, { headers });
		console.log("QueryDispatcher query response", response);
		const data = await response.json();
		console.log("QueryDispatcher query data", data);
		return data;
	}

	async getEntities(ids: EntityId[]): Promise<SparqlResults> {
		const url = this.wbk.getEntities({ ids });
		const headers = {};

		const response = await fetch(url, { headers });
		const data = await response.json();
		return data;
	}
}
