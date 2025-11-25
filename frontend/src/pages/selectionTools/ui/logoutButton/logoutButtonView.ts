import { View } from "../../../../shared/ui/View";
import "./logoutButton.css";

export enum LogOutButtonEvents {
    LOGOUT_BUTTON_CLICK = "logoutButtonClick",
}

export class LogOutButtonView extends View {

	private readonly $logoutButton: HTMLButtonElement;

	constructor() {
		super();
		this.$logoutButton = document.getElementById(
			"logout-button"
		) as HTMLButtonElement;
	}

    // ~~~~~~~~~~~~ HTML Listeners ~~~~~~~~~~~ //

	toggleHtmlListeners(on: boolean): void {
		if(on) {
			this.$logoutButton.addEventListener("click", this.onLogoutButtonClick);
		} else {
			this.$logoutButton.removeEventListener("click", this.onLogoutButtonClick);
		}
	}

	private onLogoutButtonClick = (event: MouseEvent) => {
		console.log("LogoutButtonView.onLogOutButtonClick");
		event.stopPropagation();
		this.emit(LogOutButtonEvents.LOGOUT_BUTTON_CLICK);
	};

}