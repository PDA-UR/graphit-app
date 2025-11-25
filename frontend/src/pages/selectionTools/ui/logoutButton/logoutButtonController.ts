import { ViewController } from "../../../../shared/ui/ViewController";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import { LogOutButtonEvents, LogOutButtonView } from "./logoutButtonView";

export default class LogoutButtonController extends ViewController<LogOutButtonView> {
    constructor() {
        super(new LogOutButtonView());
    }

    protected toggleListeners(on: boolean): void {
		if (on) {
			this.view.addListener(
				LogOutButtonEvents.LOGOUT_BUTTON_CLICK,
				this.onLogoutButtonClick
			);
		} else {
			this.view.removeListener(
				LogOutButtonEvents.LOGOUT_BUTTON_CLICK,
				this.onLogoutButtonClick
			);
		}
	}
	public reset(): void {}

	private onLogoutButtonClick = () => {
		experimentEventBus.emit(LogOutButtonEvents.LOGOUT_BUTTON_CLICK);
	};

}