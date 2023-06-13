import { Constant, Service } from "@tsed/di";
import { ServerInfo } from "../models/ServerInfoModel";

@Service()
export class ServerInfoService {
	@Constant("isProduction")
	isProduction: boolean;

	@Constant("version")
	version: string;

	@Constant("instance")
	instance: string;

	getInfo(): ServerInfo {
		return {
			wikibaseInstance: this.instance,
			isProduction: this.isProduction,
			version: this.version,
		};
	}
}
