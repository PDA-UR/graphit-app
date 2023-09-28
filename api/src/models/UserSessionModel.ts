import { Property, Required } from "@tsed/schema";
import { Credentials } from "./CredentialsModel";

/**
 * A user session.
 */
export class UserSession extends Credentials {
	@Required()
	@Property()
	userItemId: string;
}
