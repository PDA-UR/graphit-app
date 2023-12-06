import { sharedEventBus } from "../SharedEventBus";
import { ViewController } from "../ViewController";

import { LogOutButtonEvents, LogOutButtonView } from "./LogoutButtonView";

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
		sharedEventBus.emit(LogOutButtonEvents.LOGOUT_BUTTON_CLICK);
	};

}