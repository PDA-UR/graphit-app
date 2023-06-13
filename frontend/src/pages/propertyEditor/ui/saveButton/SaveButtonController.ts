import { eventBus } from "../../global/EventBus";
import { SaveButtonEvents, SaveButtonView } from "./SaveButtonView";

export default class SaveButtonController {
	private readonly saveButtonView: SaveButtonView;

	constructor() {
		this.saveButtonView = new SaveButtonView();

		this.saveButtonView.addListener(
			SaveButtonEvents.SAVE_BUTTON_CLICK,
			this.onSaveButtonClick
		);
	}

	private onSaveButtonClick = () => {
		eventBus.emit(SaveButtonEvents.SAVE_BUTTON_CLICK);
	};
}
