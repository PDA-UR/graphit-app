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

	@Post("/:userId/completed/:entityId/set/:isCompleted")
	@Description("Set an item as completed or uncompleted")
	@Returns(200, Object).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async complete(
		@PathParams("userId") userId: string,
		@PathParams("entityId") entityId: string,
		@PathParams("isCompleted") isCompleted: boolean,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		try {
			const numCompleted = await this.actionExecutor.toggleUserProperty(
				"completed",
				isCompleted,
				userId,
				entityId,
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

	@Post("/:userId/interested/:entityId/set/:isInterested")
	@Description("Set an item as interestd or uninterested in")
	@Returns(200, Object).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async interest(
		@PathParams("userId") userId: string,
		@PathParams("entityId") entityId: string,
		@PathParams("isInterested") isInterested: boolean,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		try {
			const numCompleted = await this.actionExecutor.toggleUserProperty(
				"interested",
				isInterested,
				userId,
				entityId,
				credentials,
				this.wikibaseSdk
			);
			return (
				"Sucessfully toggled " +
				numCompleted +
				" items as interested: " +
				isInterested
			);
		} catch (e) {
			this.logger.trace(e);
			return new BadRequest(e);
		}
	}
}
