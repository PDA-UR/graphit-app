import tippy from "tippy.js";
import { View } from "../../../../../shared/ui/View";
import { experimentEventBus } from "../../../global/ExperimentEventBus";
import {
	fromEvent,
	isModifierActive,
	ModifierKey,
} from "../../../global/KeyboardManager";
import { getSelectionType } from "../../../global/SelectionType";
import { ExperimentGraphViewEvents } from "../graph/ExperimentGraphView";
import { NodeData } from "./NodeData";
import "./search.css";

export enum SearchViewEvents {
	SEARCH_INPUT_CHANGED = "searchInputChanged",
	SEARCH_RESULT_SELECTED = "searchResultClicked",
	TOGGLE_BUTTON_CLICKED = "toggleButtonClicked",
	HOVER_NODE = "hoverNode",
}

export class SearchView extends View {
	private readonly $container: HTMLDivElement;

	private readonly $searchInput: HTMLInputElement;
	private readonly $searchKey: HTMLSelectElement;
	private readonly $searchResults: HTMLDivElement;
	private readonly $toggleButton: HTMLDivElement;

	constructor() {
		super();
		this.$container = document.getElementById("search") as HTMLDivElement;
		this.$searchInput = document.getElementById(
			"search-input"
		) as HTMLInputElement;
		this.$searchKey = document.getElementById(
			"search-key"
		) as HTMLSelectElement;
		this.$searchResults = document.getElementById(
			"search-results"
		) as HTMLDivElement;
		this.$toggleButton = document.getElementById(
			"search-toggle-button"
		) as HTMLDivElement;
		tippy(this.$toggleButton, {
			content: "Suche ein/ausblenden (Ctrl + F)",
			placement: "right",
			duration: 300,
			theme: "dark",
		});
	}

	// ~~~~~~~~~~~~ HTML Listeners ~~~~~~~~~~~ //

	toggleHtmlListeners(on: boolean) {
		if (on) {
			this.$container.addEventListener("wheel", this.stopEvent);
			this.$container.addEventListener("click", this.stopEvent);
			this.$searchInput.addEventListener("input", this.onSearchInput);
			this.$toggleButton.addEventListener("click", this.onToggleSearch);
			this.$searchKey.addEventListener("change", this.onSearchKeyChange);
			this.$searchInput.addEventListener("keydown", this.onSearchInputKeydown);
			// mousemove
		} else {
			this.$container.removeEventListener("wheel", this.stopEvent);
			this.$container.removeEventListener("click", this.stopEvent);
			this.$searchInput.removeEventListener("input", this.onSearchInput);
			this.$toggleButton.removeEventListener("click", this.onToggleSearch);
			this.$searchKey.removeEventListener("change", this.onSearchKeyChange);
			this.$searchInput.removeEventListener(
				"keydown",
				this.onSearchInputKeydown
			);
		}
	}

	private onSearchKeyChange = (e: any) => {
		this.onSearchInput(e, false);
	};

	private onSearchInputKeydown = (e: KeyboardEvent) => {
		if (e.key === "Enter") setTimeout(() => this.$searchInput.blur(), 0);
	};

	private onSearchInput = (e: Event, isUserTyping = true) => {
		e.stopPropagation();
		this.emit(SearchViewEvents.SEARCH_INPUT_CHANGED, isUserTyping);
	};

	private onToggleSearch = () => {
		this.emit(SearchViewEvents.TOGGLE_BUTTON_CLICKED);
	};

	public onSelectionChanged = (selectedIds: string[]) => {
		this.$searchResults
			.querySelectorAll(".search-result-container")
			.forEach((container: any) => this.$setSelection(selectedIds, container));
	};
	public onLastClickedChanged = (lastClickedId: string) => {
		this.$searchResults
			.querySelectorAll(".search-result-container")
			.forEach((container: any) =>
				this.$setLastClicked(lastClickedId, container)
			);
	};

	private isWaitingForDoubleClick = false;

	private onClickSearchResult = (result: NodeData, event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const modifierKeys = fromEvent(event),
			isShift: boolean = isModifierActive(modifierKeys, ModifierKey.SHIFT),
			selectionType = getSelectionType(modifierKeys);

		if (this.isWaitingForDoubleClick) {
			this.isWaitingForDoubleClick = false;
			console.log("double click");
			this.emit(
				SearchViewEvents.SEARCH_RESULT_SELECTED,
				result.id,
				selectionType,
				modifierKeys,
				true
			);
			return;
		} else {
			this.isWaitingForDoubleClick = true;

			setTimeout(() => {
				if (this.isWaitingForDoubleClick) {
					this.isWaitingForDoubleClick = false;

					this.emit(
						SearchViewEvents.SEARCH_RESULT_SELECTED,
						result.id,
						selectionType,
						modifierKeys,
						false
					);
				}
			}, 200);
		}

		this.onLastClickedChanged(result.id);
	};

	// ~~~~~~~~~~~~ Private Logic ~~~~~~~~~~~~ //

	$getResultsBetween = ($lastClicked: any, clickedResult: NodeData) => {
		const lastClickedId = $lastClicked.dataset.id,
			$allResults = this.$searchResults.querySelectorAll(
				".search-result-container"
			) as any,
			lastClickedIndex = Array.from($allResults).findIndex(
				($result: any) => $result.dataset.id === lastClickedId
			),
			currentClickedIndex = Array.from($allResults).findIndex(
				($result: any) => $result.dataset.id === clickedResult.id
			),
			$allResultsBetween = Array.from($allResults).slice(
				Math.min(lastClickedIndex, currentClickedIndex),
				Math.max(lastClickedIndex, currentClickedIndex) + 1
			);
		return Array.from($allResultsBetween);
	};

	private $updateClass(
		datasetIds: string[],
		className: string,
		container: any
	) {
		const id = container.dataset.id,
			$result = container.querySelector(".search-result");
		if (datasetIds.includes(id)) $result.classList.add(className);
		else $result.classList.remove(className);
	}

	private $setSelection(selectedIds: string[], container: any) {
		this.$updateClass(selectedIds, "selected", container);
	}

	private $setLastClicked(lastClickedId: string, container: any) {
		this.$updateClass([lastClickedId], "last-clicked", container);
	}

	private createResultContainer(
		result: NodeData,
		activeKey: string,
		selectedIds: string[],
		lastClickedId: string
	) {
		const $resultContainer = document.createElement("div"),
			$result = $resultContainer.appendChild(document.createElement("div")),
			$resultLabel = $result.appendChild(document.createElement("div")),
			$resultValue = $result.appendChild(document.createElement("div"));

		const label = result.label,
			value = result[activeKey],
			isSelected = selectedIds.includes(result.id),
			isLastClicked = lastClickedId === result.id;

		$resultContainer.classList.add("search-result-container");
		$resultContainer.dataset.id = result.id;
		$result.classList.add("search-result");
		$resultLabel.classList.add("search-result-label");
		$resultValue.classList.add("search-result-value");
		if (isSelected) $result.classList.add("selected");
		if (isLastClicked) $result.classList.add("last-clicked");

		$resultLabel.innerHTML = label;
		$resultValue.innerHTML = value;

		$result.addEventListener("click", (e) =>
			this.onClickSearchResult(result, e)
		);

		$result.addEventListener("mouseenter", (e) => {
			const modifierKeys = fromEvent(e);
			experimentEventBus.emit(
				SearchViewEvents.HOVER_NODE,
				result.id,
				modifierKeys
			);
		});
		$result.addEventListener("mouseleave", () => {
			experimentEventBus.emit(
				ExperimentGraphViewEvents.INDICATE_NODE_END,
				result.id
			);
		});

		// changed from "DOMNodeRemoved"
		const observer = new MutationObserver(mutationList => 
			mutationList.filter(m => m.type === "childList").forEach(m => {
				m.addedNodes.forEach( () => {
					experimentEventBus.emit(
						ExperimentGraphViewEvents.INDICATE_NODE_END,
						result.id
					);
				})
			})
		)
		observer.observe($resultContainer, {childList: true, subtree: true});
		// see: https://developer.chrome.com/blog/mutation-events-deprecation?hl=de


		this.$searchResults.appendChild($resultContainer);
	}

	// ~~~~~~~~~~~~~ Public Logic ~~~~~~~~~~~~ //

	// -------- Getters ------- //

	getSearchKey() {
		return this.$searchKey.value;
	}

	getSearchInput() {
		return this.$searchInput.value;
	}

	isVisible() {
		return this.$container.classList.contains("slided-in-left");
	}

	// -------- Setters ------- //

	setSearchKeyValues(keys: string[]) {
		this.$searchKey.innerHTML = "";
		const _keys = keys.filter((key) => key !== "label");
		if (keys.includes("label")) _keys.unshift("label");

		_keys.forEach((key) => {
			const $option = document.createElement("option");
			$option.value = key;
			$option.innerHTML = key;
			this.$searchKey.appendChild($option);
		});
	}

	setResultIndication(id: string, isIndicated: boolean) {
		const $result = this.$searchResults.querySelector(
			`.search-result-container[data-id="${id}"] > .search-result`
		) as any;
		if ($result) $result.classList.toggle("indicated", isIndicated);
	}

	clearResultIndication() {
		const $results = this.$searchResults.querySelectorAll(
			".search-result-container > .search-result"
		) as any;
		$results.forEach(($result: any) => $result.classList.remove("indicated"));
	}

	setVisibility(isVisible: boolean) {
		this.$container.classList.toggle("invisible", !isVisible);
		this.$container.classList.toggle("slided-out-left", !isVisible);
		this.$container.classList.toggle("slided-in-left", isVisible);
		this.$toggleButton.classList.toggle("active", isVisible);
		if (isVisible) setTimeout(() => this.$searchInput.focus(), 0);
		else
			setTimeout(() => {
				this.reset();
				this.$container.classList.toggle("invisible", true);
			}, 100);
	}

	setSearchResults(
		searchResults: NodeData[],
		selectedIds: string[],
		lastClickedId: string
	) {
		this.clearSearchResults();
		const activeKey = this.getSearchKey();

		searchResults.forEach((result) =>
			this.createResultContainer(result, activeKey, selectedIds, lastClickedId)
		);

		// changed from "DOMNodeRemoved"
		const observer = new MutationObserver(mutationList => 
			mutationList.filter(m => m.type === "childList").forEach(m => {
				m.addedNodes.forEach( () => {
					experimentEventBus.removeListener(
						"selectionChanged",
						this.onSelectionChanged
					);
					experimentEventBus.removeListener(
						"lastClickedChanged",
						this.onLastClickedChanged
					);
				})
			})
		)
		observer.observe(this.$searchResults, {childList: true, subtree: true});
		// see: https://developer.chrome.com/blog/mutation-events-deprecation?hl=de
	}

	clearSearchResults() {
		this.$searchResults.innerHTML = "";
	}

	clearSearchInput() {
		this.$searchInput.value = "";
	}

	reset() {
		this.clearSearchInput();
		this.clearSearchResults();
		this.clearResultIndication();
	}

	isFocusingInput() {
		return document.activeElement === this.$searchInput;
	}

	focusSearchInput() {
		this.$searchInput.focus();
	}
}
