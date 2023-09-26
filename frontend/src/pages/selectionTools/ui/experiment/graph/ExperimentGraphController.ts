import {
	ExperimentGraphView,
	ExperimentGraphViewEvents,
} from "./ExperimentGraphView";
import { experimentEventBus } from "../../../global/ExperimentEventBus";
import cytoscape from "cytoscape-select";

import { SearchViewControllerEvents } from "../search/SearchController";
import { ModifierKey } from "../../../global/KeyboardManager";
import { GraphController } from "../../graph/GraphController";
import { SearchViewEvents } from "../search/SearchView";
import { ApiClient } from "../../../../../shared/client/ApiClient";

export class ExperimentGraphController extends GraphController<ExperimentGraphView> {
	constructor(
		cy: cytoscape.Core,
		api: ApiClient<unknown>,
		userEntityId: string
	) {
		super(new ExperimentGraphView(cy), api, userEntityId);
		this.initEventBusListeners();
	}

	private initEventBusListeners = () => {
		experimentEventBus.addListener(
			ExperimentGraphViewEvents.INDICATE_NODE_START,
			this.view.onIndicateNodeStart
		);

		experimentEventBus.addListener(
			ExperimentGraphViewEvents.INDICATE_NODE_END,
			this.view.onIndicateNodeEnd
		);

		experimentEventBus.addListener(
			SearchViewControllerEvents.CLOSE,
			this.onCloseSearchView
		);

		experimentEventBus.addListener(
			SearchViewControllerEvents.SELECT_NODE,
			this.onSearchViewSelectNode
		);

		experimentEventBus.addListener(
			SearchViewControllerEvents.UPDATE_SEARCH_RESULTS,
			this.onUpdateSearchResults
		);

		experimentEventBus.addListener(
			SearchViewEvents.HOVER_NODE,
			this.onHoverSearchResult
		);
	};

	private onHoverSearchResult = (
		nodeId: string,
		modifierKeys: ModifierKey[]
	) => {
		this.view.setNodeIndication(nodeId, true);

		const node = this.view.getCy().getElementById(nodeId);
		this.view.clearAvailablePathsIndication();
		this.view.onHoverNode(node, modifierKeys);
	};

	private onUpdateSearchResults = (resultIds: string[]) => {
		this.view.setNodeSpotlight(resultIds);
	};

	private onSearchViewSelectNode = (data: any) => {
		const clickedElementId = data.clickedElementId,
			modifierKeys = data.modifierKeys,
			isDoubleClick = data.isDoubleClick;

		const node = this.view.getCy().getElementById(clickedElementId);

		if (isDoubleClick) {
			this.view.onDoubleClickNode(
				node,
				this.view.getDataAtFirstClick(modifierKeys)
			);
		} else {
			this.view.onNormalClickNode(
				node,
				this.view.getDataAtFirstClick(modifierKeys),
				true
			);
		}

		this.view.jumpToNodes([clickedElementId]);
	};

	private onCloseSearchView = () => {
		this.view.clearSpotlight();
		this.view.clearNodeIndication();
	};
}
