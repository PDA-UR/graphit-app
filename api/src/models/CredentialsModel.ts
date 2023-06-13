import { Property, Required } from "@tsed/schema";

export class Credentials {
	@Required()
	@Property()
	username: string;

	@Required()
	@Property()
	password: string;
}

export const isValid = (credentials: Credentials): boolean => {
	return (
		credentials.username !== undefined &&
		credentials.password !== undefined &&
		credentials.username !== "" &&
		credentials.password !== ""
	);
};
