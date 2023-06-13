import { Core } from "cytoscape";
import { WikibaseAction } from "./WikibaseAction";
import { CompositeAction } from "./CompositeAction";

export abstract class PropertyAction extends WikibaseAction {
	protected readonly cy: Core;
	protected readonly elementId: string;
	protected readonly propertyName: string;

	constructor(cy: any, elementId: string, propertyName: string) {
		super();
		this.cy = cy;
		this.elementId = elementId;
		this.propertyName = propertyName;
	}

	isOverriddenBy(action: WikibaseAction): boolean {
		if (!(action instanceof PropertyAction)) {
			return false;
		}
		return (
			this.elementId === action.elementId &&
			this.propertyName === action.propertyName
		);
	}
}
