import { View } from "../View";
import "./logoutButton.css";

export enum LogOutButtonEvents {
    LOGOUT_BUTTON_CLICK = "logoutButtonClick",
}

export class LogOutButtonView extends View {
    toggleHtmlListeners(on: boolean): void {
		console.warn("Method not implemented.");
	}
	private readonly $logoutButton: HTMLButtonElement;

	constructor() {
		super();
		this.$logoutButton = document.getElementById(
			"logout-button"
		) as HTMLButtonElement;

		this.$initListeners();
	}

	private $initListeners() {
		this.$logoutButton.addEventListener("click", this.onLogoutButtonClick);
	}

	private onLogoutButtonClick = (event: MouseEvent) => {
		event.stopPropagation();
		console.log("LogoutButtonView.onLogOutButtonClick");
		this.emit(LogOutButtonEvents.LOGOUT_BUTTON_CLICK);
	};
}