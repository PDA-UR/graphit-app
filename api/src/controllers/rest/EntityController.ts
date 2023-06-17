import { Controller, Inject } from "@tsed/di";
import { Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { PathParams, Session } from "@tsed/platform-params";
import { Description, Get, Returns } from "@tsed/schema";
import { WikibaseSdkService } from "../../services/WikibaseSdkService";
import { Credentials, isValid } from "../../models/CredentialsModel";
import { SparqlResult } from "../../models/SparqlResultModel";
import { EntityId } from "wikibase-sdk";

@Controller("/entity")
export class Entity {
	@Inject()
	logger: Logger;

	@Inject()
	wikibaseSdk: WikibaseSdkService;

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
}
