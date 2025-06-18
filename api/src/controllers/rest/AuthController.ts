import { Controller, Inject } from "@tsed/di";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { BodyParams, PathParams, Session } from "@tsed/platform-params";
import { Description, Get, Path, Post, Required, Returns } from "@tsed/schema";
import { Credentials, UserRightsProperties, isValid } from "../../models/CredentialsModel";
import { WikibaseEditService } from "../../services/WikibaseEditService";
import { WikibaseSdkService } from "../../services/WikibaseSdkService";
import { UserSession } from "../../models/UserSessionModel";
import { demoPassword } from "../../config/envs/index" // "../envs/index";
import { SparqlResult } from "src/models/SparqlResultModel";
import { Sparql } from "./SparqlController";

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

	@Inject()
	sparqlService: Sparql;

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

	//NOTE: uses the Mediawiki API to query for Wikibase Usergroups
	// was implemented for rights management, but that is now handled with userRole() using the graph structure
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

	@Get("/userRole")
	@Description("Returns the users role as per graph structure ")
	@Returns(200, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async userRole(
		@Session("rights") rights: UserRightsProperties,
		@Session("user") existingSession: Credentials,
	){
		this.logger.info("Getting ROLE for", rights.userQID, existingSession);
		try {
			const result = await this.wikibaseSdkService.getUserRole(existingSession, rights.userQID)
			const role = parseUserRoles(result);
			if (role === "Admin") rights.isAdmin = true;
			return role;
		} catch(e) {
			this.logger.error("User role error", e.message);
			return new BadRequest("Could not get user role");
		}
	}

	@Get("/checkViewability/:qid")
	@Description("Check if an item is a user-item or if it can be viewed")
	@Returns(200, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
	async checkViewability(
		@Session("rights") rights: UserRightsProperties,
		@Session("user") existingSession: Credentials,
		@PathParams("qid") qid: string,
	){
		
		if (!isValid(existingSession)) return new Unauthorized("Not logged in");
		
		if (!rights.isAdmin) {
			const result = await this.sparqlService.getIsPerson(existingSession, qid);
			if(typeof result !== "boolean") {
				return new Unauthorized("Restricted Access (User item)");
			}
		}
		
		return true;

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
	@Returns(200, String).ContentType("text/plain")
	@Returns(401, String).ContentType("text/plain")
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

/**
 * Parse the SparqlResults to get the current highest role
 * @param result the SparqlResult of the Role query
 * @returns the role as a string
 */
function parseUserRoles(result: SparqlResult): string {
	const roles = result.data.results.bindings;
	let role = "Student"; // default role
	for ( let i = 0; i < roles.length; i++ ) {
		if (role !== undefined || role !== "Admin") {
			role = roles[i].roleLabel.value;
		}
		// NOTE: check could be better, but works for now
	}
	return role;
}