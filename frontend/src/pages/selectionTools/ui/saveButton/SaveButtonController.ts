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
			this.initKeyboardListeners(true);
		} else {
			this.view.removeListener(
				SaveButtonEvents.SAVE_BUTTON_CLICK,
				this.onSaveButtonClick
			);
			this.initKeyboardListeners(false);
		}
	}
	public reset(): void {}

	private onSaveButtonClick = () => {
		experimentEventBus.emit(SaveButtonEvents.SAVE_BUTTON_CLICK);
	};

	private initKeyboardListeners = (on: boolean) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("keydown", this.onKeydown);
	};

	private onKeydown = (e: KeyboardEvent) => {
		// NOTE: uses ALT + S as a shortcut for "SAVE"
		if (e.code === "KeyS" && e.ctrlKey) {
            e.preventDefault();
			console.log("todo save")
			experimentEventBus.emit(SaveButtonEvents.SAVE_BUTTON_CLICK);
        }
	};
}
