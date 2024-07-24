import { Controller, Inject } from "@tsed/di";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, Session } from "@tsed/platform-params";
import { Description, Get, Post, Required, Returns } from "@tsed/schema";
import { Credentials, isValid } from "../../models/CredentialsModel";
import { WikibaseEditService } from "../../services/WikibaseEditService";
import { WikibaseSdkService } from "../../services/WikibaseSdkService";
import { UserSession } from "../../models/UserSessionModel";

/**
 * Controller for authentication related actions.
 */
@Controller("/auth")
export class Auth {
	@Inject()
	wikibaseEditService: WikibaseEditService;

	@Inject()
	wikibaseSdkService: WikibaseSdkService;

	@Inject()
	logger: Logger;

	@Get("/whoami")
	@Description("Returns the current session")
	@Returns(200, UserSession).ContentType("application/json")
	@Returns(401, String).ContentType("text/plain")
	whoAmI(@Session("user") credentials: Credentials) {
		console.log("Session =>", credentials);
		if (isValid(credentials)) {
			const userItemId = this.wikibaseSdkService.getUserItemId(credentials);
			return {
				...credentials,
				userItemId,
			};
		} else {
			return new Unauthorized("Not logged in");
		}
	}

	@Post("/login")
	@Description("Login to the API (using Wikibase credentials)")
	@Returns(200, UserSession).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("application/json")
	async login(
		@Required() @BodyParams() credentials: Credentials,
		@Session("user") existingSession: Credentials
	) {
		existingSession.username = credentials.username;
		this.logger.info("!!", existingSession)
		// if (existingSession.username === "Max Mustermann") {
		// 	existingSession.password = demoPassword; // works with npm run dev, but not npm run start 
		// 	this.logger.info("Demo Login", existingSession)
		// } else 
		existingSession.password = credentials.password;

		this.logger.info("Logging in as", existingSession);
		const wbEdit = this.wikibaseEditService.getSessionData(existingSession);
		const getAuthData = wbEdit.getAuthData();
		try {
			await getAuthData();
			this.logger.info("Successfully logged in as", existingSession);
			try {
				const userItemId = await this.wikibaseSdkService.getUserItemId(
					existingSession
				);
				if (userItemId == "")
					return new BadRequest("User item ID is not set in user profile.");
				this.logger.info(
					"Successfully retrieved user info for",
					existingSession
				);
				return {
					...existingSession,
					userItemId,
				};
			} catch (e) {
				this.logger.error("Parse userId error", e.message);
				existingSession.username = "";
				existingSession.password = "";
				return new BadRequest("User item ID is not set in user profile.");
			}
		} catch (e) {
			this.logger.error("Login error", existingSession, e.message);
			existingSession.username = "";
			existingSession.password = "";
			return new Unauthorized("Invalid credentials " + existingSession.password);
		}
	}

	@Post("/logout")
	@Description("Logout from the API (using Wikibase credentials)")
	@Returns(200, String)//.ContentType("text/plain")
	@Returns(401, String)//.ContentType("text/plain")
	logout(@Session("user") session: Credentials) {
		if (isValid(session)) {
			this.logger.info("Successfully logged out from", session);
			this.wikibaseEditService.removeSessionData(session);
			session.username = "";
			session.password = "";
			return "Logged out";
		}
		return new Unauthorized("Not logged in");
	}
}
