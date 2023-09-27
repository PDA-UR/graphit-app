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

	@Post("/:userId/:propertyId/:entityId/toggle/:isInterested")
	@Description("Toggle a property on or off for a user")
	@Returns(200, Object).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async toggleProperty(
		@PathParams("userId") userId: string,
		@PathParams("propertyId") propertyId: string,
		@PathParams("entityId") entityId: string,
		@PathParams("isInterested") isInterested: boolean,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		try {
			const r = await this.actionExecutor.toggleUserProperty(
				propertyId,
				isInterested,
				userId,
				entityId,
				credentials,
				this.wikibaseSdk
			);
			return r;
		} catch (e) {
			this.logger.trace(e);
			return new BadRequest(e);
		}
	}
}
