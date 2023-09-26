import { ViewController } from "../../../../../shared/ui/ViewController";
import { SelectionType } from "../../../global/SelectionType";
import { SharedEventBusEvent, sharedEventBus } from "../SharedEventBus";
import { SelectionTypeIndicatorView } from "./SelectionTypeIndicatorView";

export class SelectionTypeIndicatorController extends ViewController<SelectionTypeIndicatorView> {
	constructor() {
		super(new SelectionTypeIndicatorView());
		this.initEventBusListeners();
	}

	private initEventBusListeners(): void {
		sharedEventBus.on(
			SharedEventBusEvent.SELECTION_TYPE_CHANGED,
			this.onSelectionTypeChanged
		);
	}

	private onSelectionTypeChanged = (selectionType: SelectionType) => {
		this.view.setType(selectionType);
	};

	protected toggleListeners(on: boolean): void {}

	public reset(): void {
		this.view.reset();
	}
}
