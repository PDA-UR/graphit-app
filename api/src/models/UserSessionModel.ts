import { Property, Required } from "@tsed/schema";
import { Credentials } from "./CredentialsModel";

export class UserSession extends Credentials {
	@Required()
	@Property()
	userItemId: string;
}
