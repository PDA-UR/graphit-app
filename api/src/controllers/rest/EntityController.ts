import { Controller, Inject } from "@tsed/di";
import { NotFound, Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, PathParams, Session } from "@tsed/platform-params";
import { Description, Get, Post, Required, Returns } from "@tsed/schema";
import { WikibaseSdkService } from "../../services/WikibaseSdkService";
import { Credentials, UserRightsProperties, isDemo, isValid } from "../../models/CredentialsModel";
import { SparqlResult } from "../../models/SparqlResultModel";
import { EntityId } from "wikibase-sdk";
import { CreateClaim } from "../../models/claim/CreateClaimModel";
import { UpdateClaim } from "../../models/claim/UpdateClaimModel";
import { ActionExecuterService } from "../../services/ActionExecuterService";
import { WikibaseProperty } from "../../models/PropertyModel";
import { WikibaseEditService } from "src/services/WikibaseEditService";
import { isProduction } from "src/Server";

/**
 * Controller for entity related actions.
 */
@Controller("/entity")
export class Entity {
	@Inject()
	logger: Logger;

	@Inject()
	wikibaseSdk: WikibaseSdkService;

	@Inject()
	wikibaseEdit: WikibaseEditService;

	@Inject()
	actionExecutor: ActionExecuterService;

	@Get("/:ids")
	@Description(
		"Retrieve all entities with the given ids. The ids should be separated by a |"
	)
	@Returns(200, SparqlResult).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async entities(
		@Session("user") credentials: Credentials,
		@PathParams("ids") ids: string
	) {
		this.logger.info("Checking credentials", credentials);
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		const decodedIds = decodeURIComponent(ids);
		const entityIds = decodedIds.split("|") as EntityId[];
		const r = await this.wikibaseSdk.getEntities(credentials, entityIds);
		return r;
	}

	@Get("/:id/claims")
	@Description("Retrieve all claims for the given entity")
	@Returns(200, Object).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async claims(
		@Session("user") credentials: Credentials,
		@PathParams("id") id: string
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		try {
			const c = await this.wikibaseSdk.getClaims(credentials, id);
			this.logger.info("c", c);

			if (!c) return new NotFound("Entity does not exist");
			else return c;
		} catch (e) {
			this.logger.error(e);
			return new NotFound("Entity does not exist");
		}
	}

	@Post("/:id/createClaim")
	@Description("Create a claim (fails if it already exists)")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async createClaim(
		@PathParams("id") id: string,
		@Required() @BodyParams() createClaim: CreateClaim,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		if (isDemo(credentials)) return new Unauthorized("Demo User");

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

	@Post("/:id/updateClaim")
	@Description("Update a claim (fails if it doesn't exist)")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async updateClaim(
		@PathParams("id") id: string,
		@Required() @BodyParams() updateData: UpdateClaim,
		@Session("user") credentials: Credentials
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		if (isDemo(credentials)) return new Unauthorized("Demo User");

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

	@Get("/search/:lang/:query")
	@Description("Search for entities")
	@Returns(200, Array).Of(Object).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async search(
		@Session("user") credentials: Credentials,
		@PathParams("lang") lang: string,
		@PathParams("query") query: string
	) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		const r = await this.wikibaseSdk.search(credentials, query, lang);
		return r.data.search;
	}

	@Get("/property/all")
	@Description("Retrieve all properties in the wiki")
	@Returns(200, Array).Of(WikibaseProperty).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async properties(@Session("user") credentials: Credentials) {
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		const r = await this.wikibaseSdk.getProperties();
		return r;
	}

	@Post("/new/:item")
	@Description("Create a new Item and return its new QID")
	@Returns(200, String).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async createNewItem(
		@Session("user") credentials: Credentials,
		@Session("rights") rights: UserRightsProperties,
		@PathParams("item") item: any,
	) {
		if (!isValid(credentials)) throw new Unauthorized("Not logged in");
		if (!rights.isAdmin) throw new Unauthorized("Not enough rights");

		let qID = "Q123" // placeholder
		
		// NOTE: only allow item creation in production or with locally hosted database
		console.log("[INSTANCE]", process.env.DEV_INSTANCE, "[LOKAL]", process.env.DEV_INSTANCE!.includes("localhost"))
		if (isProduction || process.env.DEV_INSTANCE!.includes("localhost")) {
			console.log("[PROD] Create a new Item", JSON.stringify(item));
			const wbEdit = this.wikibaseEdit.createSessionData(credentials);
			const {entity} = await wbEdit.entity.create(JSON.parse(item));
			const qID = entity.id;
		} else {
			console.log("No item creation in [DEV], will return a placeholder")
		}
		return qID
	}
}
