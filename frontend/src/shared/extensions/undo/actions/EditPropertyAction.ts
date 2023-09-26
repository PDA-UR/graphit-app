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
	getData() {
		return {
			elementId: this.elementId,
			propertyName: this.propertyName,
			newValue: this.newValue,
			oldValue: this.oldValue,
		};
	}
	getName(): string {
		return "EditPropertyAction";
	}
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
		const entityId = this.parseElementId(this.elementId);
		if (this.propertyName === "completed")
			return client.user.complete(
				userEntityId,
				entityId,
				this.newValue === "true"
			);
		else if (this.propertyName === "interested")
			return client.user.interest(
				userEntityId,
				entityId,
				this.newValue === "true"
			);
		else console.log("not implemented yet:", this.propertyName);
		return Promise.resolve();
	}

	getEditAction(client: ApiClient<unknown>, userEntityId: string): EditAction {
		if (this.hasImpact())
			return () => this.editAction(client, userEntityId) as any;
		console.log("no impact");
		return () => Promise.resolve();
	}

	hasImpact(): boolean {
		return this.newValue !== this.originalValue;
	}
}
