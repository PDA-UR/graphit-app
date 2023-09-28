import { Pattern, Required } from "@tsed/schema";
import { SetClaim, entityPattern } from "./SetClaimModel";
import { CreateClaim } from "./CreateClaimModel";

/**
 * A claim to be converted (e.g. moved)
 */
export class ConvertClaim extends SetClaim {
	@Required()
	@Pattern(entityPattern)
	to: string;
	@Required()
	newClaim: CreateClaim;
}
