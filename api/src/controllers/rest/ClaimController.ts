import { Controller, Inject } from "@tsed/di";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, PathParams, Session } from "@tsed/platform-params";
import { Description, Post, Required, Returns } from "@tsed/schema";
import { ActionExecuterService } from "../../services/ActionExecuterService";
import { Credentials, isValid } from "../../models/CredentialsModel";
import { CreateClaim } from "../../models/claim/CreateClaimModel";
import { UpdateClaim } from "../../models/claim/UpdateClaimModel";
import { RemoveClaim } from "../../models/claim/RemoveClaimModel";
import { ConvertClaim } from "../../models/claim/MoveClaimModel";

@Controller("/claim")
export class Claim {
	@Inject()
	logger: Logger;

	@Inject()
	actionExecutor: ActionExecuterService;

	@Post("/:id/create")
	@Description("Create a claim")
	@Returns(200, String).ContentType("text/plain")
	@Returns(500, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async create(
		@PathParams("id") id: string,
		@Required() @BodyParams() createClaim: CreateClaim,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		const r = await this.actionExecutor.executeClaimAction(
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

	@Post("/:id/remove")
	@Description("Remove a claim")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async remove(
		@PathParams("id") id: string,
		@Required() @BodyParams() removeClaim: RemoveClaim,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		return await this.actionExecutor.executeClaimAction(
			"claim",
			"remove",
			{
				...removeClaim,
				id,
			},
			credentials
		);
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

		return await this.actionExecutor.executeClaimAction(
			"claim",
			"update",
			{
				...updateData,
				id,
			},
			credentials
		);
	}

	@Post("/:id/convertClaim")
	@Description("Convert a claim")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async move(
		@PathParams("id") id: string,
		@Required() @BodyParams() convertData: ConvertClaim,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		const removeResult: any = await this.actionExecutor.executeClaimAction(
			"claim",
			"remove",
			{
				property: convertData.property,
				value: convertData.value,
				id,
			},
			credentials
		);

		if (removeResult instanceof BadRequest) {
			throw new BadRequest("Failed to remove claim from " + id);
		}

		await this.actionExecutor.executeClaimAction(
			"claim",
			"create",
			{
				id: convertData.to,
				...convertData.newClaim,
			},
			credentials
		);

		if (removeResult instanceof BadRequest) {
			// re add old claim

			const r = await this.actionExecutor.executeClaimAction(
				"claim",
				"create",
				{
					id,
					value: convertData.value,
					property: convertData.property,
				},
				credentials
			);
			if (r instanceof BadRequest) {
				throw new BadRequest(
					"Failed to re-add claim to " + id,
					"and failed to revert changes"
				);
			}
			throw new BadRequest(
				"Failed to create claim on " + id,
				"reverted changes"
			);
		}

		return (
			"Successfully moved claim from " +
			convertData.property +
			" to " +
			convertData.to
		);
	}
}
