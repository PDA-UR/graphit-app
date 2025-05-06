import { Controller, Inject } from "@tsed/di";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, PathParams, Session } from "@tsed/platform-params";
import { Description, Get, Post, Required, Returns } from "@tsed/schema";
import { Credentials, isValid } from "../../models/CredentialsModel";
import { WikibaseEditService } from "../../services/WikibaseEditService";
import { WikibaseSdkService } from "../../services/WikibaseSdkService";
import { UserSession } from "../../models/UserSessionModel";
import { demoPassword } from "../../config/envs/index" // "../envs/index";

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
	async whoAmI(@Session("user") credentials: Credentials) {
		if (isValid(credentials)) {
			const userItemId = await this.wikibaseSdkService.getUserItemId(credentials);
			this.logger.info("userItemId", userItemId);
			return {
				...credentials,
				userItemId,
			};
		} else {
			return new Unauthorized("Not logged in");
		}
	}

	@Get("/usergroups/:username")
	@Description("Returns info about the current user")
	@Returns(200, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async usergroups(
		@PathParams("username") username: string,
		@Session("rights") rights: any,
	){
		this.logger.info("userinfo-credentials", username)
		try {
			const hasAdminGroups = await this.wikibaseSdkService.getUserGroups(username);
			rights.isAdmin = hasAdminGroups;
			return hasAdminGroups;
		} catch(e) {
			this.logger.error("User info error", e.message);
			return new BadRequest("Could not get user info");
		}
	}

	@Post("/login")
	@Description("Login to the API (using Wikibase credentials)")
	@Returns(200, UserSession).ContentType("text/plain")
	@Returns(400, String).ContentType("text/plain")
	@Returns(401, String).ContentType("application/json")
	async login(
		@Required() @BodyParams() credentials: Credentials,
		@Session("user") existingSession: Credentials,
		@Session("rights") rights: any
	) {
		existingSession.username = credentials.username;
		this.logger.info(credentials);
		if (credentials.username == "Max Mustermann") {
			existingSession.password = demoPassword;
			this.logger.info("Demo login");
		} else existingSession.password = credentials.password;
		
		rights.userQID = await this.wikibaseSdkService.getUserItemId(credentials);

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
	logout(
		@Session("user") session: Credentials,
		@Session("rights") rights: any,
	) {
		if (isValid(session)) {
			this.logger.info("Successfully logged out from", session);
			this.wikibaseEditService.removeSessionData(session);
			session.username = "";
			session.password = "";
			rights.isAdmin = false;
			return "Logged out";
		}
		return new Unauthorized("Not logged in");
	}
}
