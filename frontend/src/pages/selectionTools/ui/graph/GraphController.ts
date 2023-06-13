import { ElementDefinition } from "cytoscape";
import { GraphModel } from "./GraphModel";
import { GraphView, GraphViewEvents } from "./GraphView";
import { eventBus } from "../../global/EventBus";
import { ToolbarViewControllerEvents } from "../toolbar/ToolbarController";
import { DEFAULT_TOOL, Tool } from "../toolbar/ToolbarModel";

import dagre from "cytoscape-dagre";
import nodeHtmlLabel from "cytoscape-node-html-label";
import lasso from "../../../../shared/extensions/lasso-rectangle/lasso";
import undo from "../../../../shared/extensions/undo/undo";
import { ApiClient } from "../../../../shared/client/ApiClient";

export class GraphController {
	private readonly graphView: GraphView;
	private readonly graphModel: GraphModel;

	constructor(elements: ElementDefinition[]) {
		console.log("GraphController");
		this.graphModel = elements;
		this.graphView = new GraphView(
			this.graphModel,
			document.getElementById("app")!,
			{
				extensions: [dagre, nodeHtmlLabel, lasso, undo],
			}
		);

		this.switchTool(DEFAULT_TOOL);

		this.graphView.addListener(
			GraphViewEvents.SELECTION_CHANGED,
			this.onSelectionChanged
		);

		eventBus.addListener(
			ToolbarViewControllerEvents.SWITCH_TOOL,
			this.switchTool
		);

		// listen to z key
		document.addEventListener("keydown", (event) => {
			if (event.key === "z") {
				console.log("undo");
				this.graphView.undo();
			}
			if (event.key === "y") {
				console.log("redo");
				this.graphView.redo();
			}
		});
	}

	private switchTool = (tool: string) => {
		switch (tool) {
			case Tool.GRAB:
				this.graphView.setGrabMode();
				break;
			case Tool.MOUSE:
				this.graphView.setMouseMode();
				break;
		}
	};

	private onSelectionChanged = (selectionCount: number) => {
		console.log("onSelectionChanged", selectionCount);
	};
}
