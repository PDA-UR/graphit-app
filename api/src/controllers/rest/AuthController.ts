import { Controller, Inject } from "@tsed/di";
import { Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, Session } from "@tsed/platform-params";
import { Description, Get, Post, Required, Returns } from "@tsed/schema";
import { Credentials, isValid } from "../../models/CredentialsModel";
import { WikibaseEditService } from "../../services/WikibaseEditService";

@Controller("/auth")
export class AuthController {
	@Inject()
	wikibaseEditService: WikibaseEditService;

	@Inject()
	logger: Logger;

	@Get("/whoami")
	@Description("Returns the current session")
	@Returns(200, Credentials)
	@Returns(401, String).ContentType("text/plain")
	whoAmI(@Session("user") session: Credentials) {
		console.log("Session =>", session);
		if (isValid(session)) {
			return session;
		} else {
			return new Unauthorized("Not logged in");
		}
	}

	@Post("/login")
	@Description("Login to the API (using Wikibase credentials)")
	@Returns(200, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async login(
		@Required() @BodyParams() credentials: Credentials,
		@Session("user") session: Credentials
	) {
		session.username = credentials.username;
		session.password = credentials.password;

		const wbEdit = this.wikibaseEditService.getSession(session);
		const getAuthData = wbEdit.getAuthData();
		try {
			await getAuthData();
			this.logger.info("Successfully logged in as", session);
			return "Logged in";
		} catch (e) {
			this.logger.error("Error logging in with credentials", session);
			session.username = "";
			session.password = "";
			return new Unauthorized("Invalid credentials");
		}
	}

	@Post("/logout")
	@Description("Logout from the API (using Wikibase credentials)")
	@Returns(200, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	logout(@Session("user") session: Credentials) {
		if (isValid(session)) {
			this.logger.info("Successfully logged out from", session);
			this.wikibaseEditService.removeSession(session);
			session.username = "";
			session.password = "";
			return "Logged out";
		}
		return new Unauthorized("Not logged in");
	}
}
