import tippy from "tippy.js";
import { View } from "../../../../../shared/ui/View";
import { experimentEventBus } from "../../../global/ExperimentEventBus";
import { Filter, FilterManager, FilterManagerEvents } from "./Filter";
import { Toast, ToastLength } from "../../toast/Toast";
import "./filterBar.css";

export class FilterBarView extends View {
	toggleHtmlListeners(on: boolean): void {
		if (on) {
			this.$addFilterButton.addEventListener("click", this.onEnterNewFilter);
			this.$container.style.pointerEvents = "auto";
			// also all children
		} else {
			this.$addFilterButton.removeEventListener("click", this.onEnterNewFilter);
			this.$container.style.pointerEvents = "none";
		}
	}
	readonly $container: HTMLDivElement;
	readonly $items: HTMLDivElement;
	readonly $addFilterButton: HTMLDivElement;

	private readonly filterManager: FilterManager;
	private readonly cy: any;

	constructor(cy: any, filterManager: FilterManager) {
		super();
		this.filterManager = filterManager;
		this.cy = cy;

		this.$container = document.getElementById("filter-bar") as HTMLDivElement;
		this.$items = document.getElementById("filter-bar-items") as HTMLDivElement;
		this.$addFilterButton = document.getElementById(
			"filter-bar-add-button"
		) as HTMLDivElement;

		tippy(this.$addFilterButton, {
			content: "Filter erstellen und anwenden (Enter)",
			placement: "bottom",
			duration: 300,
			theme: "dark",
		});

		this.$appendFilter(
			this.filterManager.getActiveFilter(),
			this.filterManager.getActiveFilterIndex()
		);
		this.$setActiveFilter(this.filterManager.getActiveFilterIndex());
	}

	// ~~~~~~~~~~ Keyboard Listeners ~~~~~~~~~ //

	public onEnterNewFilter = () => {
		const selectedElements = this.cy.$(":selected");
		if (selectedElements.length === 0) {
			Toast.warning(
				"Can't create a filter view with no nodes selected."
			).show();
			return;
		}
		const filter = new Filter(selectedElements, this.cy);
		const didPushFilter = this.filterManager.pushFilter(filter);
		if (!didPushFilter)
			Toast.warning(
				"A filter view with these nodes already exists, change the selection and try again.",
				ToastLength.MEDIUM
			).show();
	};

	public onEscapeFilter = () => {
		const activeFilter = this.filterManager.getActiveFilterIndex();

		if (activeFilter) this.filterManager.removeFilter(activeFilter);
	};

	// ~~~~~~~~~~~~ HTML Listeners ~~~~~~~~~~~ //

	private $onClickFilterItem = (filterId: string) => {
		const filterIndex = this.filterManager.getFilterIndexById(filterId);
		this.filterManager.jumpToFilter(filterIndex);
	};

	private $onHoverFilterItemStart = (event: MouseEvent) => {
		const $filterItem = event.target as HTMLDivElement;
		$filterItem.classList.add("hover");
		const filterId = $filterItem.dataset.filterId!,
			filterIndex = this.filterManager.getFilterIndexById(filterId);
		this.filterManager.startFilterPreview(filterIndex);
	};

	private $onHoverFilterItemEnd = (event: MouseEvent) => {
		const $filterItem = event.target as HTMLDivElement;
		$filterItem.classList.remove("hover");
		const filterId = $filterItem.dataset.filterId!,
			filterIndex = this.filterManager.getFilterIndexById(filterId);
		this.filterManager.stopFilterPreview(filterIndex);
	};

	private $onClickFilterItemRemove = (filterId: string, event: MouseEvent) => {
		event.stopPropagation();
		const filterIndex = this.filterManager.getFilterIndexById(filterId);
		this.filterManager.stopFilterPreview(filterIndex);
		this.filterManager.removeFilter(filterIndex);
	};

	// ~~~~~~~~~~~~ Filter Manager ~~~~~~~~~~~ //

	public onFilterAdded = (filterIndex: number) => {
		const filter = this.filterManager.getFilterByIndex(filterIndex);
		this.$appendFilter(filter, filterIndex);
		this.$setActiveFilter(filterIndex);
	};

	public onFilterRemoved = (filterIndex: number) => {
		this.$removeFilter(filterIndex);
		if (this.filterManager.hasFilters())
			this.$setActiveFilter(this.filterManager.getActiveFilterIndex());
	};

	public onActiveFilterChanged = (filterIndex: number) => {
		this.$setActiveFilter(filterIndex);
	};

	// ~~~~~~~~~~~~~ HTML methods ~~~~~~~~~~~~ //

	private $appendFilter(filter: Filter, filterIndex: number) {
		const $filterItemContainer = document.createElement("div"),
			$filterItemText = $filterItemContainer.appendChild(
				document.createElement("div")
			),
			$filterItemRemoveButton = $filterItemContainer.appendChild(
				document.createElement("div")
			),
			$separator = document.createElement("div");

		$separator.className = "filter-bar-separator";

		$filterItemContainer.className = "filter-bar-item";
		if (filterIndex === 0) $filterItemContainer.classList.add("root-filter");
		$filterItemContainer.dataset.filterId = filter.getId();
		$filterItemContainer.onclick = () =>
			this.$onClickFilterItem(filter.getId());
		$filterItemContainer.onmouseenter = (event) =>
			this.$onHoverFilterItemStart(event);
		$filterItemContainer.onmouseleave = (event) =>
			this.$onHoverFilterItemEnd(event);

		$filterItemText.innerText =
			filterIndex === 0
				? "[0] - Kompletter Graph"
				: `[${filterIndex}] - Filter ${filterIndex} (${filter.getNumberOfNodes()})`;
		$filterItemRemoveButton.className = "filter-bar-item-remove-button";
		$filterItemRemoveButton.onclick = (e) =>
			this.$onClickFilterItemRemove(filter.getId(), e);

		tippy($filterItemRemoveButton, {
			content: "Filter löschen (Esc)",
			placement: "bottom",
			duration: 300,
			theme: "dark",
		});

		if (filterIndex > 0) this.$items.appendChild($separator);
		this.$items.appendChild($filterItemContainer);
	}

	private $removeFilter(filterIndex: number) {
		this.$items.removeChild(this.$items.childNodes[filterIndex * 2]);
		if (filterIndex > 0)
			this.$items.removeChild(this.$items.childNodes[filterIndex * 2 - 1]);
	}

	private $setActiveFilter(filterIndex: number) {
		const $filters = this.$items.querySelectorAll(".filter-bar-item");
		for (let i = 0; i < $filters.length; i++) {
			const $filter = $filters[i] as HTMLDivElement;
			$filter.classList.remove("active");
		}

		const $filter = $filters[filterIndex] as HTMLDivElement;
		$filter.classList.add("active");
		experimentEventBus.emit(
			FilterManagerEvents.ACTIVE_FILTER_CHANGED,
			filterIndex
		);
	}

	public reset() {
		this.filterManager.reset();
		this.$items.innerHTML = "";
		this.$appendFilter(
			this.filterManager.getActiveFilter(),
			this.filterManager.getActiveFilterIndex()
		);
		this.$setActiveFilter(this.filterManager.getActiveFilterIndex());
	}
}
