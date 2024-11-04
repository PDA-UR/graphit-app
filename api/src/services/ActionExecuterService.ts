import { Inject, Service } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { Logger } from "@tsed/logger";
import { Credentials } from "../models/CredentialsModel";
import { WikibaseEditService } from "./WikibaseEditService";

/**
 * Helper service to execute write actions on wikibase.
 */
@Service()
export class ActionExecuterService {
	@Inject()
	logger: Logger;

	@Inject()
	wikibaseEditService: WikibaseEditService;

	/**
	 * Execute a claim action.
	 * @param object Target of the action (currently only "claim" is supported)
	 * @param action Action to execute
	 * @param data Data to pass to the action
	 * @param credentials User credentials
	 * @returns Result of the action
	 */
	async executeClaimAction(
		object: "claim",
		action: "create" | "update" | "remove",
		data: any,
		credentials: Credentials
	): Promise<string | BadRequest> {
		const wikibaseEdit = this.wikibaseEditService.getSessionData(credentials);
		try {
			const actionFn = wikibaseEdit.claim[action];
			this.logger.info("Executing action: " + "action" + actionFn);
			const r = await actionFn(data);
			const message = "Successfully executed action:" + action;
			this.logger.info(message);
			this.logger.info(r);
			return message;
		} catch (e) {
			return new BadRequest(e.message);
		}
	}

	/**
	 * Toggle a user property (e.g. interested in or has completed)
	 * @param propertyId The property to toggle
	 * @param doToggleOn Whether to toggle on or off
	 * @param userId Id of the user
	 * @param targetEntityId Id of the target entity (e.g. which topic the user is interested in)
	 * @param credentials User credentials
	 * @param wikibaseSdk Wikibase sdk instance
	 * @returns Result of the action
	 */
	async toggleUserProperty(
		propertyId: string,
		doToggleOn: boolean,
		userId: string,
		targetEntityId: string,
		credentials: Credentials,
		wikibaseSdk: any
	) {
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
				this.executeClaimAction(
					"claim",
					"remove",
					{
						guid,
					},
					credentials
				);
			actions.push(action);
		} else if (doToggleOn) {
			// let today = new Date().toLocaleDateString('en-CA'); // works
			const today = new Date().toISOString().slice(0, 10); // NOTE: date format needs to be: "2024-11-04"

			this.logger.info(`date string is: ${today}`);
			const action = () =>
				this.executeClaimAction(
					"claim",
					"create",
					{ id: userId, property: propertyId, value: targetEntityId,
						qualifiers: {
							// P15: "comment", 
							P19: today, // "on date"-Property
						  },
					},
					credentials
				);
			actions.push(action);
		} else {
			this.logger.error(
				"cant remove completion since it does not exist " +
					targetEntityId +
					" " +
					userId
			);
		}

		const runningActions = actions.map(async (a) => await a());
		const r = await Promise.all(runningActions);
		return r;
	}
}
