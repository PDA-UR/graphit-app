// import { View } from "../../../../shared/ui/View";
import tippy from "tippy.js";
import { View } from "../../../../shared/ui/View";
import "./legendButton.css";

export enum LegendViewEvents {
	TOGGLE_BUTTON_CLICK = "toggleButtonClick",
}

export class LegendButtonView extends View {

	private readonly $toggleButton: HTMLButtonElement;

	constructor() {
		super();
		this.$toggleButton = document.getElementById(
			"legend-toggle-button"
		) as HTMLButtonElement;
        tippy(this.$toggleButton, {
            content: "Legende ein/ausblenden (Ctrl + ?)",
            placement: "left",
            duration: 300,
            theme: "dark",
        });
	}

    // ~~~~~~~~~~~~ HTML Listeners ~~~~~~~~~~~ //

    toggleHtmlListeners(on: boolean): void {
        if(on) {
            this.$toggleButton.addEventListener("click", this.onToggleLegend);
        } else {
            this.$toggleButton.removeEventListener("click", this.onToggleLegend);
        }
    }

    private onToggleLegend = () => {
		this.emit(LegendViewEvents.TOGGLE_BUTTON_CLICK);
	};
}
