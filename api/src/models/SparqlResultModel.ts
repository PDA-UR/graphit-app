import { Property, Required } from "@tsed/schema";
import { SparqlResults } from "wikibase-sdk";

export class SparqlResult {
	@Required()
	@Property()
	data: SparqlResults;
}
