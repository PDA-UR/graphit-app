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

	@Constant("sparqlEndpoint")
	sparqlEndpoint: string;

	getInfo(): ServerInfo {
		return {
			instance: this.instance,
			sparqlEndpoint: this.sparqlEndpoint,
			isProduction: this.isProduction,
			version: this.version,
		};
	}
}
