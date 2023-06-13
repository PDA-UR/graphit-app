import type { EntityId, SparqlResults } from "wikibase-sdk";
import { state } from "../../pages/propertyEditor/global/State";
import QueryDispatcher from "./QueryDispatcher";
import { dependentsAndDependenciesQuery } from "./SparqlQueries";

export class SparqlClient {
	private readonly queryDispatcher: QueryDispatcher;

	constructor() {
		console.log("SparqlClient constructor");
		this.queryDispatcher = new QueryDispatcher();
	}

	async query(query: string): Promise<SparqlResults> {
		return this.queryDispatcher.query(query);
	}

	async getEntities(ids: EntityId[]): Promise<SparqlResults> {
		return this.queryDispatcher.getEntities(ids);
	}

	// ~~~~~~~~~~ Pre built queries: ~~~~~~~~~ //

	async getDependentsAndDependencies(): Promise<SparqlResults> {
		const query = dependentsAndDependenciesQuery(state.username);
		return this.query(query);
	}
}
