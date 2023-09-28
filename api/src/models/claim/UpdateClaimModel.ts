import { Pattern, Property, Required } from "@tsed/schema";
import { entityPattern } from "./SetClaimModel";

/**
 * A claim to be updated.
 */
export class UpdateClaim {
	@Required()
	@Pattern(entityPattern)
	property: string;

	@Required()
	@Property()
	oldValue: string;

	@Required()
	@Property()
	newValue: string;
}
