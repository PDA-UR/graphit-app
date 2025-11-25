import { View } from "../../../../shared/ui/View";
import "./saveButton.css";

export enum SaveButtonEvents {
	SAVE_BUTTON_CLICK = "saveButtonClick",
}

export class SaveButtonView extends View {
	toggleHtmlListeners(on: boolean): void {
		console.warn("Method not implemented.");
	}
	private readonly $saveButton: HTMLButtonElement;

	constructor(userId: string) {
		super();
		this.$saveButton = document.getElementById(
			"save-button"
		) as HTMLButtonElement;

		if (userId == "Q157") this.hideSaveButton();

		this.$initListeners();
	}

	private $initListeners() {
		this.$saveButton.addEventListener("click", this.onSaveButtonClick);
	}

	private onSaveButtonClick = (event: MouseEvent) => {
		event.stopPropagation();
		console.log("SaveButtonView.onSaveButtonClick");
		this.emit(SaveButtonEvents.SAVE_BUTTON_CLICK);
	};

	private hideSaveButton() {
		this.$saveButton.classList.add("invisible");
	}
}
