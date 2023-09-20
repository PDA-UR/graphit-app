import { Pattern, Required } from "@tsed/schema";
import { SetClaim, entityPattern } from "./SetClaimModel";

export class MoveClaim extends SetClaim {
	@Required()
	@Pattern(entityPattern)
	to: string;
}
