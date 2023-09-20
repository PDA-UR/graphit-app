import { Pattern, Required } from "@tsed/schema";
import { SetClaim, entityPattern } from "./SetClaimModel";
import { CreateClaim } from "./CreateClaimModel";

export class ConvertClaim extends SetClaim {
	@Required()
	@Pattern(entityPattern)
	to: string;
	@Required()
	newClaim: CreateClaim;
}
