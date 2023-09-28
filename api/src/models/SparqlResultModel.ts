import { Property, Required } from "@tsed/schema";
import { SparqlResults } from "wikibase-sdk";

/**
 * The result of a sparql query.
 */
export class SparqlResult {
	@Required()
	@Property()
	data: SparqlResults;
}
