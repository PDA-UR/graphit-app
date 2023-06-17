import { Controller, Inject } from "@tsed/di";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { PathParams, Session } from "@tsed/platform-params";
import { Description, Post, Returns } from "@tsed/schema";
import { WikibaseSdkService } from "../../services/WikibaseSdkService";
import { Credentials, isValid } from "../../models/CredentialsModel";
import { SparqlResult } from "../../models/SparqlResultModel";

@Controller("/sparql")
export class SparqlController {
	@Inject()
	logger: Logger;

	@Inject()
	wikibaseSdk: WikibaseSdkService;

	@Post("/query/:sparql")
	@Description("Execute a sparql query")
	@Returns(200, SparqlResult).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async query(
		@Session("user") credentials: Credentials,
		@PathParams("sparql") sparql: string
	) {
		this.logger.info("Checking credentials", credentials);
		if (!isValid(credentials)) return new Unauthorized("Not logged in");

		const decodedSparql = decodeURIComponent(sparql);
		const r = await this.wikibaseSdk.query(credentials, decodedSparql);
		return r;
	}

	@Post("/categories")
	@Description("Retrieve all categories in the wiki")
	@Returns(200, SparqlResult).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async categories(@Session("user") credentials: Credentials) {
		this.logger.info("Checking credentials", credentials);
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		const r = await this.wikibaseSdk.getCategories(credentials);
		return r;
	}

	@Post("/userGraph")
	@Description(
		"Retrieve the users graph (learning contents, completions, etc.)"
	)
	@Returns(200, SparqlResult).ContentType("application/json")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async userGraph(@Session("user") credentials: Credentials) {
		this.logger.info("Checking credentials", credentials);
		if (!isValid(credentials)) return new Unauthorized("Not logged in");
		const userId = await this.wikibaseSdk.getUserItemId(credentials);
		if (userId == "")
			return new BadRequest("No user item id found for this user");
		const r = await this.wikibaseSdk.getUserGraph(credentials, userId);
		return r;
	}
}
