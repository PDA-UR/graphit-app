import { Property, Required } from "@tsed/schema";

/**
 * A property in wikibase.
 */
export class WikibaseProperty {
	@Required()
	@Property()
	propertyId: string;

	@Required()
	@Property()
	label: string;

	@Required()
	@Property()
	url: string;
}
