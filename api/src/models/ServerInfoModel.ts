import { Property, Required } from "@tsed/schema";

export class ServerInfo {
	@Required()
	@Property()
	wikibaseInstance: string;

	@Required()
	@Property()
	isProduction: boolean;

	@Required()
	@Property()
	version: string;
}
