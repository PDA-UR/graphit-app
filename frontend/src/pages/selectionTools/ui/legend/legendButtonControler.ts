import { toggleShortcutCheatsheet } from "../../../../shared/shortcuts/Shortcut";
import { ShortcutsExperiment } from "../../../../shared/shortcuts/ShortcutsExperiment";
import { ViewController } from "../../../../shared/ui/ViewController";
import { LegendButtonView, LegendViewEvents } from "./legendButtonView";

export default class LegendButtonController extends ViewController<LegendButtonView> {

	constructor() {
		super(new LegendButtonView());
	}

	protected toggleListeners(on: boolean): void {
        this.initLegendViewListeners(on)
        // this.initKeyboardListeners(on);
	}

	// ~~~~~~~~~ LegendView Listeners ~~~~~~~~ //

	private initLegendViewListeners = (on: boolean) => {
        if(on) {
            this.view.on(
                LegendViewEvents.TOGGLE_BUTTON_CLICK,
                this.onToggle
            );
        }
    }

    public reset(): void {
        throw new Error("Method not implemented.");
    }

	// ~~~~~~~~~ Click-Events ~~~~~~~~ //    

    private onToggle = () => {
        console.log("Toggle Shortcut Legend");
        toggleShortcutCheatsheet(ShortcutsExperiment)
    }

	// ~~~~~~~~~ Keyboard-Events ~~~~~~~~ //    


}