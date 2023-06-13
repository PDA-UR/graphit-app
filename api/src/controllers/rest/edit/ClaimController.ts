import { Controller, Inject } from "@tsed/di";
import { Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, Session } from "@tsed/platform-params";
import { Description, Post, Required, Returns } from "@tsed/schema";
import { ActionExecuterService } from "../../../services/ActionExecuterService";
import { Credentials, isValid } from "../../../models/CredentialsModel";
import { CreateClaim } from "../../../models/claim/CreateClaimModel";
import { UpdateClaim } from "../../../models/claim/UpdateClaimModel";

@Controller("/claim")
export class ClaimController {
	@Inject()
	logger: Logger;

	@Inject()
	actionExecutor: ActionExecuterService;

	@Post("/create")
	@Description("Create a claim")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async create(
		@Required() @BodyParams() claimUpdate: CreateClaim,
		@Session("user") credentials: Credentials
	) {
		this.logger.info("Checking credentials", credentials);
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		this.logger.info("Creating claim", claimUpdate);
		const r = await this.actionExecutor.execute(
			"claim",
			"create",
			claimUpdate,
			credentials
		);
		this.logger.info("Claim created", r);
		return r;
	}

	@Post("/update")
	@Description("Update a claim")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async update(
		@Required() @BodyParams() claimUpdate: UpdateClaim,
		@Session("user") credentials: Credentials
	) {
		return await this.actionExecutor.execute(
			"claim",
			"update",
			claimUpdate,
			credentials
		);
	}
}
