import { Controller, Inject } from "@tsed/di";
import { QueryParams } from "@tsed/platform-params";
import { Description, Get, Required, Returns } from "@tsed/schema";
import { ServerInfo } from "../../models/ServerInfoModel";
import { ServerInfoService } from "../../services/ServerInfoService";

@Controller("/example")
export class ExampleController {
	@Inject()
	serverInfoService: ServerInfoService;

	@Get("/hello")
	@Description("Greets you with a hello message")
	@Returns(200, String).ContentType("text/plain")
	hello(@Required() @QueryParams("name") name: string) {
		return "hello " + name + "!";
	}

	@Get("/info")
	@Description("Info about the server and env vars")
	@Returns(200, ServerInfo)
	info() {
		return this.serverInfoService.getInfo();
	}
}
