import { Controller, Inject } from "@tsed/di";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, PathParams, Session } from "@tsed/platform-params";
import { Description, Post, Required, Returns } from "@tsed/schema";
import { ActionExecuterService } from "../../services/ActionExecuterService";
import { Credentials, UserRightsProperties, hasEditingPermission, isDemo, isValid } from "../../models/CredentialsModel";
import { CreateClaim } from "../../models/claim/CreateClaimModel";
import { UpdateClaim } from "../../models/claim/UpdateClaimModel";
import { RemoveClaim } from "../../models/claim/RemoveClaimModel";
import { ConvertClaim } from "../../models/claim/MoveClaimModel";
import { Sparql } from "./SparqlController";

/**
 * Controller for claim related actions.
 */
@Controller("/claim")
export class Claim {
	@Inject()
	logger: Logger;

	@Inject()
	actionExecutor: ActionExecuterService;

	@Inject()
	sparqlController: Sparql;

	@Post("/:id/create")
	@Description("Create a claim")
	@Returns(200, String).ContentType("text/plain")
	@Returns(500, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async create(
		@PathParams("id") id: string,
		@Required() @BodyParams() createClaim: CreateClaim,
		@Session("user") credentials: Credentials,
		@Session("rights") rights: UserRightsProperties,
	) {		
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		if (!rights.isAdmin && id !== rights.userQID) { // NO checks for admin and personal user item

			// NOTE: check inclusion using session -> Cached, when they are first added to a column
			const isIncluded = rights.cachedItems.includes(id);
			const flags = hasEditingPermission(rights.isAdmin, rights.userQID, id, isIncluded);

			if (!flags.canEditItem) return new Unauthorized("Not enough rights");

			// If a student edits an item (not their user item), then flag with qualifier
			if (flags.isStudentSuggestion) {
				createClaim = flagClaimAsStudentEdit(createClaim, rights.userQID)
			}
		}

		const r = await this.actionExecutor.executeClaimAction(
			"claim",
			"create",
			{
				...createClaim,
				id,
			},
			credentials
		);
		if (r instanceof BadRequest) {
			throw new BadRequest("Failed to create claim on " + id);
		}
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
		@Session("user") credentials: Credentials,
		@Session("rights") rights: UserRightsProperties,
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		// NOTE: students can delete any items, from items they have editing permission for
		if(!rights.isAdmin && rights.userQID !== id) {
			const isIncluded = rights.cachedItems.includes(id);
			const flags = hasEditingPermission(rights.isAdmin, rights.userQID, id, isIncluded);
			if (!flags.canEditItem) return new Unauthorized("Not enough rights");
		}

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
		@Session("user") credentials: Credentials,
		@Session("rights") rights: UserRightsProperties,
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		if(!rights.isAdmin) {
			const isIncluded = rights.cachedItems.includes(id);
			const flags = hasEditingPermission(rights.isAdmin, rights.userQID, id, isIncluded);
			if (!flags.canEditItem) return new Unauthorized("Not enough rights");
		}
		
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
		@PathParams("id") id: string, // NOTE:  id is of item the Claim is moved FROM
		@Required() @BodyParams() convertData: ConvertClaim,
		@Session("user") credentials: Credentials,
		@Session("rights") rights: UserRightsProperties,
	) {		
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		
		
		if(!rights.isAdmin && convertData.to !== rights.userQID) {
			console.log("move to non user item", convertData.to, "cached:", rights.cachedItems);
			
			const isIncluded = rights.cachedItems.includes(convertData.to);
			if(!isIncluded) return new Unauthorized("Not enough rights");
			
			convertData.newClaim.qualifiers = flagMoveAsStudentEdit(
				rights.userQID, convertData.newClaim.qualifiers
			);
		}
		
		// Force to copy the Claim, if it's originally from an "external" (no editing rights) item
		let copyDueToStudentEdit = false;
		if (id !== rights.userQID) {
			const fromInternal = rights.cachedItems.includes(id);
			if(!fromInternal) copyDueToStudentEdit = true;
		}
		
		const addResult = await this.actionExecutor.executeClaimAction(
			"claim",
			"create",
			{
				id: convertData.to,
				...convertData.newClaim,
			},
			credentials
		);

		if (addResult instanceof BadRequest) {
			throw new BadRequest(
				"Failed to add claim to " + convertData.to + ", reverted changes"
			);
		}

		if(!copyDueToStudentEdit) {
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
				// remove newly created claim
				const r = await this.actionExecutor.executeClaimAction(
					"claim",
					"remove",
					{
						id,
						value: convertData.to,
						property: convertData.newClaim,
					},
					credentials
				);
				if (r instanceof BadRequest) {
					throw new BadRequest("Failed to undo: Create claim on entity " + id);
				}
				throw new BadRequest(
					"Failed to create claim on " + id,
					"reverted changes"
				);
			}
		}

		return (
			"Successfully moved claim from " +
			convertData.property +
			" to " +
			convertData.to
		);
	}
}


/**
 * Update the claim with a qualifier to flag it as a students additions
 * @param createClaim the current claim about to be created
 * @param userQID the current users wikibase-item QID
 * @returns the updated claim
 */
function flagClaimAsStudentEdit(createClaim: CreateClaim, userQID: string): CreateClaim {
	if (createClaim.qualifiers == undefined) {
		createClaim.qualifiers = {
			P39: userQID, // P39 = created by
			// P19: new Date().toISOString().slice(0, 10)
		}
	} else {
		createClaim.qualifiers.P39 = userQID;
	}
	return createClaim;
}

/**
 * Flag a converted Claim as a student edit (and append existing Qualifiers if needed)
 * @param userQID 
 * @param existingQualifiers 
 * @returns the merged & flagged Qualifiers
 */
function flagMoveAsStudentEdit(userQID:string, existingQualifiers: any) {
	return {
		P39: userQID,
		// P19: new Date().toISOString().slice(0, 10),
		...existingQualifiers
	}
}