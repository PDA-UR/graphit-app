import { Controller, Inject } from "@tsed/di";
import { Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, PathParams, Session } from "@tsed/platform-params";
import { Description, Post, Required, Returns } from "@tsed/schema";
import { ActionExecuterService } from "../../services/ActionExecuterService";
import { Credentials, isValid } from "../../models/CredentialsModel";
import { CreateClaim } from "../../models/claim/CreateClaimModel";
import { UpdateClaim } from "../../models/claim/UpdateClaimModel";

@Controller("/claim")
export class Claim {
	@Inject()
	logger: Logger;

	@Inject()
	actionExecutor: ActionExecuterService;

	@Post("/:id/create")
	@Description("Create a claim")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async create(
		@PathParams("id") id: string,
		@Required() @BodyParams() createClaim: CreateClaim,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		const r = await this.actionExecutor.execute(
			"claim",
			"create",
			{
				...createClaim,
				id,
			},
			credentials
		);
		this.logger.info("Claim created", r);
		return r;
	}

	@Post("/:id/update")
	@Description("Update a claim")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async update(
		@PathParams("id") id: string,
		@Required() @BodyParams() updateData: UpdateClaim,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		return await this.actionExecutor.execute(
			"claim",
			"update",
			{
				...updateData,
				id,
			},
			credentials
		);
	}
}
