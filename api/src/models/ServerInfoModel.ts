import { Property, Required } from "@tsed/schema";

export class ServerInfo {
	@Required()
	@Property()
	instance: string;

	@Required()
	@Property()
	sparqlEndpoint: string;

	@Required()
	@Property()
	isProduction: boolean;

	@Required()
	@Property()
	version: string;
}
