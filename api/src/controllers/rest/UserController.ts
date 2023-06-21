import { Controller, Inject } from "@tsed/di";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { PathParams, Session } from "@tsed/platform-params";
import { Description, Post, Returns } from "@tsed/schema";
import { WikibaseSdkService } from "../../services/WikibaseSdkService";
import { Credentials, isValid } from "../../models/CredentialsModel";
import { ActionExecuterService } from "../../services/ActionExecuterService";

@Controller("/user")
export class User {
	@Inject()
	logger: Logger;

	@Inject()
	wikibaseSdk: WikibaseSdkService;

	@Inject()
	actionExecutor: ActionExecuterService;

	@Post("/:userId/completed/:entityIds/set/:isCompleted")
	@Description("Set an item as completed or uncompleted")
	@Returns(200, Object).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async complete(
		@PathParams("userId") userId: string,
		@PathParams("entityIds") entityIds: string[],
		@PathParams("isCompleted") isCompleted: boolean,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		try {
			const rawEntities = entityIds[0];
			const parsedEntities = rawEntities.split(",");
			const numCompleted = await this.actionExecutor.toggleUserProperty(
				"completed",
				isCompleted,
				userId,
				parsedEntities,
				credentials,
				this.wikibaseSdk
			);
			return (
				"Sucessfully toggled " +
				numCompleted +
				" items as completed: " +
				isCompleted
			);
		} catch (e) {
			this.logger.trace(e);
			return new BadRequest(e);
		}
	}
}
