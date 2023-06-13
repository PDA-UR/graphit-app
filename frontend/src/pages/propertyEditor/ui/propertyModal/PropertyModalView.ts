import { View } from "../../../../shared/ui/View";
import "./propertyModal.css";

export enum PropertyModalViewEvents {
	COMPLETE_BUTTON_CLICK = "completeButtonClick",
	INTEREST_BUTTON_CLICK = "interestButtonClick",
	RATE_BUTTON_CLICK = "rateButtonClick",
}

export class PropertyModalView extends View {
	private readonly $container: HTMLDivElement;
	private readonly $completeButton: HTMLButtonElement;
	private readonly $interestButton: HTMLButtonElement;
	private readonly $rateButton: HTMLButtonElement;

	constructor() {
		super();
		this.$container = document.getElementById(
			"property-modal"
		) as HTMLDivElement;
		this.$completeButton = this.$container.querySelector(
			"#complete"
		) as HTMLButtonElement;
		this.$interestButton = this.$container.querySelector(
			"#interest"
		) as HTMLButtonElement;
		this.$rateButton = this.$container.querySelector(
			"#rate"
		) as HTMLButtonElement;

		this.$initListeners();
	}

	private $initListeners() {
		this.$completeButton.addEventListener("click", this.onCompleteButtonClick);
		this.$interestButton.addEventListener("click", this.onInterestButtonClick);
		this.$rateButton.addEventListener("click", this.onRateButtonClick);
	}

	private onCompleteButtonClick = (event: MouseEvent) => {
		event.stopPropagation();
		this.emit(PropertyModalViewEvents.COMPLETE_BUTTON_CLICK);
	};

	private onInterestButtonClick = (event: MouseEvent) => {
		event.stopPropagation();
		this.emit(PropertyModalViewEvents.INTEREST_BUTTON_CLICK);
	};

	private onRateButtonClick = (event: MouseEvent) => {
		event.stopPropagation();
		this.emit(PropertyModalViewEvents.RATE_BUTTON_CLICK);
	};

	private toggleVisibility(isVisible: boolean) {
		if (isVisible) {
			this.$container.classList.add("visible");
		} else {
			this.$container.classList.remove("visible");
		}
	}

	public show() {
		this.toggleVisibility(true);
	}

	public hide() {
		this.toggleVisibility(false);
	}
}
