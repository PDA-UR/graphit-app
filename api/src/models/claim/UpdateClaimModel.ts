import { Pattern, Property, Required } from "@tsed/schema";
import { entityPattern } from "./CreateClaimModel";

export class UpdateClaim {
	@Required()
	@Pattern(entityPattern)
	id: string;

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
