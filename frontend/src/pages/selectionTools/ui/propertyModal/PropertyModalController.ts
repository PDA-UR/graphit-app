import { ViewController } from "../../../../shared/ui/ViewController";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import { GraphViewEvents } from "../graph/GraphView";
import {
	PropertyModalView,
	PropertyModalViewEvents,
} from "./PropertyModalView";

export enum PropertyModalControllerEvents {
	EDIT_PROPERTY_ACTION_CLICKED = "editPropertyAction",
	SET_PROPERTY_MODAL_VISIBILITY = "setPropertyModalVisibility",
}

export enum PropertyEditAction {
	COMPLETE = "complete",
	INTEREST = "interest",
	RATE = "rate",
}

export class PropertyModalController extends ViewController<PropertyModalView> {
	constructor() {
		super(new PropertyModalView());
	}

	protected toggleListeners(on: boolean): void {
		if (on) {
			this.view.addListener(
				PropertyModalViewEvents.COMPLETE_BUTTON_CLICK,
				this.onCompletionActionClicked
			);
			this.view.addListener(
				PropertyModalViewEvents.INTEREST_BUTTON_CLICK,
				this.onInterestActionClicked
			);
			this.view.addListener(
				PropertyModalViewEvents.RATE_BUTTON_CLICK,
				this.onRateActionClicked
			);

			document.addEventListener("keydown", this.onKeydown);

			experimentEventBus.addListener(
				GraphViewEvents.SELECTION_CHANGED,
				this.onSelectionChanged
			);
		} else {
			this.view.removeListener(
				PropertyModalViewEvents.COMPLETE_BUTTON_CLICK,
				this.onCompletionActionClicked
			);
			this.view.removeListener(
				PropertyModalViewEvents.INTEREST_BUTTON_CLICK,
				this.onInterestActionClicked
			);
			this.view.removeListener(
				PropertyModalViewEvents.RATE_BUTTON_CLICK,
				this.onRateActionClicked
			);

			document.removeEventListener("keydown", this.onKeydown);

			experimentEventBus.removeListener(
				GraphViewEvents.SELECTION_CHANGED,
				this.onSelectionChanged
			);
		}
	}
	public reset(): void {}

	private onSelectionChanged = (selectedNodes: any) => {
		this.onSetPropertyModalVisibility(selectedNodes.length > 0);
	};

	private onKeydown = (event: KeyboardEvent) => {
		if (event.key === "1") this.onCompletionActionClicked();
		else if (event.key === "2") this.onInterestActionClicked();
		else if (event.key === "3") this.onRateActionClicked();
	};

	private onCompletionActionClicked = () => {
		experimentEventBus.emit(
			PropertyModalControllerEvents.EDIT_PROPERTY_ACTION_CLICKED,
			PropertyEditAction.COMPLETE
		);
	};

	private onInterestActionClicked = () => {
		experimentEventBus.emit(
			PropertyModalControllerEvents.EDIT_PROPERTY_ACTION_CLICKED,
			PropertyEditAction.INTEREST
		);
	};

	private onRateActionClicked = () => {
		experimentEventBus.emit(
			PropertyModalControllerEvents.EDIT_PROPERTY_ACTION_CLICKED,
			PropertyEditAction.RATE
		);
	};

	private onSetPropertyModalVisibility = (isVisible: boolean) => {
		if (isVisible) this.view.show();
		else this.view.hide();
	};
}
