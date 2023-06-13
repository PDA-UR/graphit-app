import { View } from "../../../../shared/ui/View";
import "./saveButton.css";

export enum SaveButtonEvents {
	SAVE_BUTTON_CLICK = "saveButtonClick",
}

export class SaveButtonView extends View {
	private readonly $saveButton: HTMLButtonElement;

	constructor() {
		super();
		this.$saveButton = document.getElementById(
			"save-button"
		) as HTMLButtonElement;

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
}
