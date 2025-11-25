import tippy from "tippy.js";
import { View } from "../../../../shared/ui/View";
import "./propertyModal.css";

export enum PropertyModalViewEvents {
	COMPLETE_BUTTON_CLICK = "completeButtonClick",
	INTEREST_BUTTON_CLICK = "interestButtonClick",
	RATE_BUTTON_CLICK = "rateButtonClick",
}

export class PropertyModalView extends View {
	toggleHtmlListeners(on: boolean): void {
		console.warn("Method not implemented.");
	}
	private readonly $container: HTMLDivElement;
	private readonly $completeButton: HTMLButtonElement;
	private readonly $interestButton: HTMLButtonElement;
	private readonly $rateButton: HTMLButtonElement;
	private readonly $closeButton: HTMLButtonElement;
	private readonly $minimizedModal: HTMLDivElement;
	private readonly $openButton: HTMLButtonElement;
	private readonly $minCompleteButton: HTMLButtonElement;
	private readonly $minInterestButton: HTMLButtonElement;
	private isMinimized: boolean;

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
		this.$closeButton = this.$container.querySelector(
			".modal-closer"
		) as HTMLButtonElement;
		this.$openButton = document.getElementById(
			"modal-opener"
		) as HTMLButtonElement;
		this.$minimizedModal = document.getElementById(
			"modal-closed"
		) as HTMLDivElement;
		this.$minCompleteButton = document.getElementById(
			"min-complete-button"
		) as HTMLButtonElement;
		this.$minInterestButton = document.getElementById(
			"min-interest-button"
		) as HTMLButtonElement;
		this.isMinimized = false;

		this.$initTippy();

		this.$initListeners();
	}

	private $initTippy() {
		const $completeRect = document.getElementById("modal-complete-rect") as HTMLDivElement;
		const $interestRect = document.getElementById("modal-interest-rect") as HTMLDivElement;
		tippy($completeRect, {
            content: "completed",
            placement: "top",
            duration: 300,
            theme: "dark",
        });
        tippy($interestRect, {
            content: "interest",
            placement: "top",
            duration: 300,
            theme: "dark",
        });
		tippy(this.$openButton, {
			content: "ALT + '-'",
			placement: "top",
			duration: 300,
			theme: "dark",
		})
	}

	private $initListeners() {
		this.$completeButton.addEventListener("click", this.onCompleteButtonClick);
		this.$minCompleteButton.addEventListener("click", this.onCompleteButtonClick);
		this.$interestButton.addEventListener("click", this.onInterestButtonClick);
		this.$minInterestButton.addEventListener("click", this.onInterestButtonClick);
		this.$rateButton.addEventListener("click", this.onRateButtonClick);
		this.$closeButton.addEventListener("click", this.onMinimizeModal);
		this.$openButton.addEventListener("click", this.onMinimizeModal);
		
		this.initKeyboardListeners(true);
	}

	 private initKeyboardListeners = (on: boolean) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("keydown", this.onKeydown);
	};

	private onKeydown = (e: KeyboardEvent) => {
        if (e.key === "-" && e.altKey) { 
            this.onMinimizeModal(e)
        }
	};

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

	private onMinimizeModal = (event: MouseEvent | KeyboardEvent) => {
		if (this.$container.classList.contains("visible")) {
			this.toggleVisibility(false);
			this.toggleMinimizedModal(true);
			this.isMinimized = true;
		} else {
			this.isMinimized = false;
			this.toggleVisibility(true);
			this.toggleMinimizedModal(false);
		}
	}

	private toggleMinimizedModal(isVisible: boolean) {
		if (isVisible) {
			this.$minimizedModal.classList.remove("invisible");
			this.$closeButton.style.position = "initial";
		} else {
			this.$minimizedModal.classList.add("invisible");
			this.$closeButton.style.position = "absolute";
		}
	}

	private toggleVisibility(isVisible: boolean) {
		if (this.isMinimized) {
			this.toggleMinimizedModal(isVisible)	
		} else if (isVisible) {
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
