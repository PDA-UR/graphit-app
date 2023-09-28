import { Enum, Optional, Property } from "@tsed/schema";
import { Qualifiers, SetClaim } from "./SetClaimModel";

/**
 * A claim to be created.
 */
export class CreateClaim extends SetClaim {
	@Optional()
	@Enum("preferred", "normal", "deprecated")
	rank?: string;

	@Optional()
	@Property()
	qualifiers?: Qualifiers;

	// References are not supported yet
}
