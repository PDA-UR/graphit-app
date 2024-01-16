import { SelectionType } from "cytoscape";
import {
	FuzzySearchManager,
	FuzzySearch,
} from "../../../../../shared/classes/FuzzySearch";
import { ViewController } from "../../../../../shared/ui/ViewController";
import { experimentEventBus } from "../../../global/ExperimentEventBus";
import { ModifierKey } from "../../../global/KeyboardManager";
import { SelectionTool } from "../../../global/SelectionTool";
import { GraphViewEvents } from "../../graph/GraphView";
import { FilterManagerEvents } from "../filter/Filter";
import { ExperimentGraphViewEvents } from "../graph/ExperimentGraphView";
import { NodeData, getNodeDatasFromCy } from "./NodeData";
import { SearchView, SearchViewEvents } from "./SearchView";
import { SwitchCourseEvents } from "../../switchCourse/switchCourseController";

export enum SearchViewControllerEvents {
	SELECT_NODE = "selectNode",
	UPDATE_SEARCH_RESULTS = "updateSearchResults",
	CLOSE = "close",
	RESET = "reset",
	HOVER_NODE = "hoverNode",
}

export class SearchViewController extends ViewController<SearchView> {
	private readonly cy: cytoscape.Core;

	private fuzzySearchManager: FuzzySearchManager<NodeData> | null = null;

	constructor(cy: cytoscape.Core) {
		super(new SearchView());
		this.cy = cy;
		this.initEventBusListeners();
	}

	protected toggleListeners(on: boolean): void {
		this.initSearchViewListeners(on);
		this.initKeyboardListeners(on);
	}
	private listenerGate = (
		listener: (...props: any[]) => void,
		...args: any[]
	) => {
		if (this.view.isVisible()) listener(...args);
	};

	// ~~~~~~~~~ SearchView Listeners ~~~~~~~~ //

	private initSearchViewListeners = (on: boolean) => {
		if (on) {
			this.view.on(
				SearchViewEvents.SEARCH_INPUT_CHANGED,
				this.onSearchInputChanged
			);
			this.view.on(SearchViewEvents.TOGGLE_BUTTON_CLICKED, this.onToggle);
			this.view.on(
				SearchViewEvents.SEARCH_RESULT_SELECTED,
				this.onSearchResultsSelected
			);
		} else {
			this.view.off(
				SearchViewEvents.SEARCH_INPUT_CHANGED,
				this.onSearchInputChanged
			);
			this.view.off(SearchViewEvents.TOGGLE_BUTTON_CLICKED, this.onToggle);
			this.view.off(
				SearchViewEvents.SEARCH_RESULT_SELECTED,
				this.onSearchResultsSelected
			);
		}
	};

	private onSearchResultsSelected = (
		clickedElementId: string,
		selectionType: SelectionType,
		modifierKeys: ModifierKey[],
		isDoubleClick: boolean
	) => {
		const query = this.view.getSearchInput(),
			property = this.view.getSearchKey();

		experimentEventBus.emit(
			SearchViewControllerEvents.SELECT_NODE,
			{
				query,
				property,
				clickedElementId,
				selectionType,
				modifierKeys,
				isDoubleClick,
			},
			selectionType
		);
	};

	private onSearchInputChanged = (isUserTyping = true) => {
		const matchedNodeDatas: NodeData[] = [];
		const nodeDatas = getNodeDatasFromCy(this.cy),
			selectedIds = nodeDatas
				.map((n) => {
					const id = n.id,
						selected = this.cy.getElementById(id).selected();
					return selected ? id : null;
				})
				.filter((s) => s),
			lastClickedId = this.cy.$("node.last-clicked")?.id() ?? "";

		if (this.view.getSearchInput() === "") {
			matchedNodeDatas.push(...nodeDatas);
		} else {
			const searchResults = this.fuzzySearchManager!.search(
				this.view.getSearchKey(),
				this.view.getSearchInput()
			).map((r: any) => r.item);

			matchedNodeDatas.push(...searchResults);
		}

		this.view.setSearchResults(matchedNodeDatas, selectedIds, lastClickedId);

		experimentEventBus.emit(
			SearchViewControllerEvents.UPDATE_SEARCH_RESULTS,
			matchedNodeDatas.map((r) => r.id)
		);
	};

	// ~~~~~~~~~~ Event Bus Listener ~~~~~~~~~ //

	private initEventBusListeners = () => {
		experimentEventBus.on(
			ExperimentGraphViewEvents.INDICATE_NODE_START,
			(id: string) => {
				this.view.setResultIndication(id, true);
			}
		);

		experimentEventBus.on(
			ExperimentGraphViewEvents.INDICATE_NODE_END,
			(id: string) => this.view.setResultIndication(id, false)
		);

		experimentEventBus.on(SearchViewControllerEvents.RESET, () => {
			this.view.reset();
			this.onSearchInputChanged(false);
		});

		experimentEventBus.on(
			FilterManagerEvents.ACTIVE_FILTER_CHANGED,
			this.refreshData
		);

		experimentEventBus.addListener(
			GraphViewEvents.SELECTION_CHANGED,
			(selectedIds: string[]) =>
				this.listenerGate(this.view.onSelectionChanged, selectedIds)
		);
		experimentEventBus.addListener(
			GraphViewEvents.LAST_CLICKED_CHANGED,
			(lastClickedId: string) =>
				this.listenerGate(this.view.onLastClickedChanged, lastClickedId)
		);

		experimentEventBus.addListener(
			SwitchCourseEvents.SWITCH_COURSE, 
			this.refreshData
		);
	};

	// ~~~~~~~~~~ Keyboard Listeners ~~~~~~~~~ //

	private initKeyboardListeners = (on: boolean) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("keydown", this.onKeydown);
	};

	private onKeydown = (e: KeyboardEvent) => {
		if (e.code === "KeyF" && e.ctrlKey) {
			e.preventDefault();
			e.stopPropagation();

			const doClose = this.view.isVisible(),
				isFocusingInput = this.view.isFocusingInput();

			if (doClose && isFocusingInput) this.onClose();
			else if (!doClose || isFocusingInput) this.onOpen();
			else this.view.focusSearchInput();
		}
	};

	private onToggle = () => {
		if (this.view.isVisible()) this.onClose();
		else this.onOpen();
	};

	private onClose = () => {
		this.view.setVisibility(false);
		experimentEventBus.emit(SearchViewControllerEvents.CLOSE);
	};

	private onOpen = () => {
		const nodeDatas = getNodeDatasFromCy(this.cy),
			keys = FuzzySearch.getKeys(nodeDatas[0] ?? {});

		this.view.setSearchKeyValues(keys);
		this.fuzzySearchManager = new FuzzySearchManager(nodeDatas);

		this.onSearchInputChanged(false);
		this.view.setVisibility(true);
	};

	private refreshData = () => {
		const nodeDatas = getNodeDatasFromCy(this.cy),
			keys = FuzzySearch.getKeys(nodeDatas[0] ?? {});

		this.view.setSearchKeyValues(keys);
		this.fuzzySearchManager = new FuzzySearchManager(nodeDatas);
		this.onSearchInputChanged(false);
	};

	reset() {
		this.view.reset();
		this.onSearchInputChanged(false);
		this.view.setVisibility(false);
	}
}
