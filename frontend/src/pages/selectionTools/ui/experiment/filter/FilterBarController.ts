import cytoscape from "cytoscape-select";
import { FilterBarView } from "./FilterBarView";
import { FilterManager, FilterManagerEvents } from "./Filter";
import { ViewController } from "../../../../../shared/ui/ViewController";

export class FilterBarController extends ViewController<FilterBarView> {
	private readonly filterManager: FilterManager;

	constructor(cy: cytoscape.Core, filterManager: FilterManager) {
		super(new FilterBarView(cy, filterManager));
		this.filterManager = filterManager;
	}

	protected toggleListeners(on: boolean): void {
		this.initKeyboardListeners(on);
		this.initFilterListeners(on);
	}

	private initKeyboardListeners(on: boolean) {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("keydown", this.onKeydown);
	}

	private onKeydown = (e: KeyboardEvent) => {
		if (document.activeElement instanceof HTMLInputElement) return;
		if (e.key === "Enter") this.view.onEnterNewFilter();
		else if (e.key === "Escape") this.view.onEscapeFilter();
		// 1-9
		else if (e.key.match(/[1-9]/)) {
			const filterIndex = parseInt(e.key) - 1;
			if (this.filterManager.getNumberOfFilters() > filterIndex)
				this.filterManager.jumpToFilter(filterIndex);
		}
	};

	private initFilterListeners(on: boolean) {
		if (on) {
			this.filterManager.on(
				FilterManagerEvents.FILTER_ADDED,
				this.view.onFilterAdded
			);
			this.filterManager.on(
				FilterManagerEvents.FILTER_REMOVED,
				this.view.onFilterRemoved
			);
			this.filterManager.on(
				FilterManagerEvents.ACTIVE_FILTER_CHANGED,
				this.view.onActiveFilterChanged
			);
		} else {
			this.filterManager.off(
				FilterManagerEvents.FILTER_ADDED,
				this.view.onFilterAdded
			);
			this.filterManager.off(
				FilterManagerEvents.FILTER_REMOVED,
				this.view.onFilterRemoved
			);
			this.filterManager.off(
				FilterManagerEvents.ACTIVE_FILTER_CHANGED,
				this.view.onActiveFilterChanged
			);
		}
	}

	reset() {
		this.view.reset();
	}
}
