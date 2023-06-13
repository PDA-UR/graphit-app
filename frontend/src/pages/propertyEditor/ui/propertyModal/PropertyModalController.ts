import { eventBus } from "../../global/EventBus";
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

export class PropertyModalController {
	private readonly propertyModalView;

	constructor() {
		this.propertyModalView = new PropertyModalView();

		this.propertyModalView.addListener(
			PropertyModalViewEvents.COMPLETE_BUTTON_CLICK,
			this.onCompletionActionClicked
		);
		this.propertyModalView.addListener(
			PropertyModalViewEvents.INTEREST_BUTTON_CLICK,
			this.onInterestActionClicked
		);
		this.propertyModalView.addListener(
			PropertyModalViewEvents.RATE_BUTTON_CLICK,
			this.onRateActionClicked
		);

		// listen to keys 1 - 3
		document.addEventListener("keydown", (event) => {
			if (event.key === "1") this.onCompletionActionClicked();
			else if (event.key === "2") this.onInterestActionClicked();
			else if (event.key === "3") this.onRateActionClicked();
		});

		eventBus.addListener(
			PropertyModalControllerEvents.SET_PROPERTY_MODAL_VISIBILITY,
			this.onSetPropertyModalVisibility
		);
	}

	private onCompletionActionClicked = () => {
		eventBus.emit(
			PropertyModalControllerEvents.EDIT_PROPERTY_ACTION_CLICKED,
			PropertyEditAction.COMPLETE
		);
	};

	private onInterestActionClicked = () => {
		eventBus.emit(
			PropertyModalControllerEvents.EDIT_PROPERTY_ACTION_CLICKED,
			PropertyEditAction.INTEREST
		);
	};

	private onRateActionClicked = () => {
		eventBus.emit(
			PropertyModalControllerEvents.EDIT_PROPERTY_ACTION_CLICKED,
			PropertyEditAction.RATE
		);
	};

	private onSetPropertyModalVisibility = (isVisible: boolean) => {
		if (isVisible) this.propertyModalView.show();
		else this.propertyModalView.hide();
	};
}
