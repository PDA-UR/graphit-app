import { ViewController } from "../../../../shared/ui/ViewController";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import { SaveButtonEvents, SaveButtonView } from "./SaveButtonView";

export default class SaveButtonController extends ViewController<SaveButtonView> {
	constructor(userId: string) {
		super(new SaveButtonView(userId));
	}

	protected toggleListeners(on: boolean): void {
		if (on) {
			this.view.addListener(
				SaveButtonEvents.SAVE_BUTTON_CLICK,
				this.onSaveButtonClick
			);
		} else {
			this.view.removeListener(
				SaveButtonEvents.SAVE_BUTTON_CLICK,
				this.onSaveButtonClick
			);
		}
	}
	public reset(): void {}

	private onSaveButtonClick = () => {
		experimentEventBus.emit(SaveButtonEvents.SAVE_BUTTON_CLICK);
	};
}
