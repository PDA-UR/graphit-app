import { Inject, Service } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { Credentials } from "../models/CredentialsModel";
import { WikibaseEditService } from "./WikibaseEditService";

@Service()
export class ActionExecuterService {
	@Inject()
	logger: Logger;

	@Inject()
	wikibaseEditService: WikibaseEditService;

	async execute(
		object: "claim",
		action: "create" | "update",
		data: any,
		credentials: Credentials
	): Promise<string | BadRequest> {
		const wikibaseEdit = this.wikibaseEditService.getSessionData(credentials);
		try {
			const actionFn = wikibaseEdit.claim[action];
			this.logger.info("Executing action:" + actionFn);
			const r = await actionFn(data);
			const message = "Successfully executed action:" + action;
			this.logger.info(message, r);
			return message;
		} catch (e) {
			return new BadRequest(e.message);
		}
	}
}
