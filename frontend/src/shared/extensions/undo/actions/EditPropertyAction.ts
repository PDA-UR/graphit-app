import WikibaseClient from "../../../WikibaseClient";
import { ApiClient, UpdateClaimModel } from "../../../client/ApiClient";
import {
	WB_PROPERTIES_DEV,
	WB_PROPERTIES_PROD,
} from "../../../sparql/SparqlVars";
import { getEnvVar } from "../../../util/Env";
import { EditAction } from "../other/EditAction";
import { PropertyAction } from "./PropertyAction";

const WB_PROPERTIES: any =
	getEnvVar("PROD") === "true" ? WB_PROPERTIES_PROD : WB_PROPERTIES_DEV;

export class EditPropertyAction extends PropertyAction {
	private readonly newValue: any;
	private readonly oldValue: any;
	private readonly originalValue: any;

	constructor(cy: any, elementId: string, propertyName: string, newValue: any) {
		super(cy, elementId, propertyName);
		this.newValue = newValue;
		this.oldValue = cy.$id(elementId).data(propertyName);
		const originalData = cy.$id(elementId).data("_originalData");
		this.originalValue = originalData ? originalData[propertyName] : null;
	}

	do(): void {
		this.cy.$id(this.elementId).data(this.propertyName, this.newValue);
	}
	undo(): void {
		this.cy.$id(this.elementId).data(this.propertyName, this.oldValue);
	}

	private parseElementId(elementId: string): string {
		const split = elementId.split("/");
		return split[split.length - 1];
	}

	editAction(client: ApiClient<unknown>, userEntityId: string) {
		const propertyId = WB_PROPERTIES[this.propertyName];
		const entityId = this.parseElementId(this.elementId);
		return client.user.complete("Q30", [entityId], true);
	}

	static mergedEditAction(
		client: ApiClient<unknown>,
		userEntityId: string,
		actions: EditPropertyAction[]
	) {
		const actionMap: any = {};
		actions.forEach((action) => {
			const key = action.propertyName + action.newValue;
			if (actionMap[key] === undefined) actionMap[key] = [];
			actionMap[key].push(action);
		});

		console.log("action map", actionMap);

		const mergedActions: Array<() => Promise<any>> = [];
		Object.keys(actionMap).forEach((key) => {
			const unmergedActions: Array<EditPropertyAction> = actionMap[key],
				entityIds = unmergedActions.map((action) =>
					action.parseElementId(action.elementId)
				);

			const actionFunction = () =>
				client.user.complete("Q30", entityIds, unmergedActions[0].newValue);
			if ((key = "complete")) mergedActions.push(actionFunction);
			else throw new Error("Not implemented yet");
		});
		return mergedActions;
	}

	getEditAction(client: ApiClient<unknown>, userEntityId: string): EditAction {
		if (this.hasImpact())
			return () => this.editAction(client, userEntityId) as any;
		console.log("no impact");
		return () => Promise.resolve();
	}

	hasImpact(): boolean {
		return this.newValue !== this.oldValue;
	}
}
