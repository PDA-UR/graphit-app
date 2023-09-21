import { Controller, Inject } from "@tsed/di";
import { Description, Get, Returns } from "@tsed/schema";
import { ServerInfo } from "../../models/ServerInfoModel";
import { ServerInfoService } from "../../services/ServerInfoService";

@Controller("/info")
export class Info {
	@Inject()
	serverInfoService: ServerInfoService;

	@Get("/info")
	@Description("Info about the server and env vars")
	@Returns(200, ServerInfo)
	info() {
		return this.serverInfoService.getInfo();
	}
}
