import { Inject, Service } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { Credentials } from "../models/CredentialsModel";
import { WikibaseEditService } from "./WikibaseEditService";
import { WikibasePropertyMap } from "../models/WikibasePropertyMap";

@Service()
export class ActionExecuterService {
	@Inject()
	logger: Logger;

	@Inject()
	wikibaseEditService: WikibaseEditService;

	private propertyMap = new WikibasePropertyMap();

	async execute(
		object: "claim",
		action: "create" | "update" | "remove",
		data: any,
		credentials: Credentials
	): Promise<string | BadRequest> {
		const wikibaseEdit = this.wikibaseEditService.getSessionData(credentials);
		try {
			const actionFn = wikibaseEdit.claim[action];
			this.logger.info("Executing action:" + actionFn);
			const r = await actionFn(data);
			const message = "Successfully executed action:" + action;
			this.logger.info(message);
			this.logger.info(r);
			return message;
		} catch (e) {
			return new BadRequest(e.message);
		}
	}

	async toggleUserProperty(
		property: "completed" | "interested",
		doToggleOn: boolean,
		userId: string,
		targetEntityId: string,
		credentials: Credentials,
		wikibaseSdk: any
	) {
		const propertyId = this.propertyMap[property];
		const actions: any[] = [];
		const existingClaims: any[] =
			(await wikibaseSdk.getClaim(credentials, userId, propertyId)) ?? [];

		// if a claim already exists for this property
		const existingClaim = existingClaims.find((claim) => {
			return claim.mainsnak.datavalue.value.id === targetEntityId;
		});
		if (existingClaim) {
			this.logger.info("existing claim");
			if (doToggleOn) return; // no need to create an new relation since it already exists
			// remove the claim since its marked as incomplete
			const guid = existingClaim.id;
			const action = () =>
				this.execute(
					"claim",
					"remove",
					{
						guid,
					},
					credentials
				);
			actions.push(action);
		} else if (doToggleOn) {
			const action = () =>
				this.execute(
					"claim",
					"create",
					{ id: userId, property: propertyId, value: targetEntityId },
					credentials
				);
			actions.push(action);
		} else {
			this.logger.info(
				"cant remove completion since it does not exist " +
					targetEntityId +
					" " +
					userId
			);
		}

		const runningActions = actions.map(async (a) => await a());
		const r = await Promise.all(runningActions);
		this.logger.info(r);
		return runningActions.length;
	}
}
