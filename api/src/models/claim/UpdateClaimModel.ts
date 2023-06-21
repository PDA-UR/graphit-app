import { Pattern, Property, Required } from "@tsed/schema";
import { entityPattern } from "./SetClaimModel";

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
