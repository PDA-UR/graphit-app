import { Property, Required } from "@tsed/schema";

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
