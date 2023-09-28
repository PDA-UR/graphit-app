import { Pattern, Property, Required } from "@tsed/schema";

export type Qualifiers = Record<string, string>;

export const entityPattern = /[PQ]\d{1,5}/;

/**
 * A claim to be created.
 */
export class SetClaim {
	@Required()
	@Pattern(entityPattern)
	property: string;

	@Required()
	@Property()
	value: string;
}
