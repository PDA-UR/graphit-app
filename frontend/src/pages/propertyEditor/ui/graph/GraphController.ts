import { ElementDefinition } from "cytoscape";
import { GraphModel } from "./GraphModel";
import { GraphView, GraphViewEvents } from "./GraphView";
import { eventBus } from "../../global/EventBus";
import { ToolbarViewControllerEvents } from "../toolbar/ToolbarController";
import { DEFAULT_TOOL, Tool } from "../toolbar/ToolbarModel";

import dagre from "cytoscape-dagre";
import nodeHtmlLabel from "cytoscape-node-html-label";
import {
	PropertyEditAction,
	PropertyModalControllerEvents,
} from "../propertyModal/PropertyModalController";
import lasso from "../../../../shared/extensions/lasso-rectangle/lasso";
import undo from "../../../../shared/extensions/undo/undo";
import { EditPropertyAction } from "../../../../shared/extensions/undo/actions/EditPropertyAction";
import { CompositeAction } from "../../../../shared/extensions/undo/actions/CompositeAction";
import { SaveButtonEvents } from "../saveButton/SaveButtonView";
import { ApiClient } from "../../../../shared/client/ApiClient";

export class GraphController {
	private readonly graphView: GraphView;
	private readonly graphModel: GraphModel;

	private readonly api: ApiClient<unknown>;
	private readonly userEntityId: string;

	constructor(
		elements: ElementDefinition[],
		api: ApiClient<unknown>,
		userEntityId: string
	) {
		console.log("GraphController");
		this.graphModel = elements;
		this.graphView = new GraphView(
			this.graphModel,
			document.getElementById("app")!,
			{
				extensions: [dagre, nodeHtmlLabel, lasso, undo],
			}
		);
		this.api = api;
		this.userEntityId = userEntityId;

		console.log("GraphController done view");
		this.switchTool(DEFAULT_TOOL);

		this.graphView.addListener(
			GraphViewEvents.SELECTION_CHANGED,
			this.onSelectionChanged
		);

		eventBus.addListener(
			ToolbarViewControllerEvents.SWITCH_TOOL,
			this.switchTool
		);

		eventBus.addListener(
			PropertyModalControllerEvents.EDIT_PROPERTY_ACTION_CLICKED,
			this.onEditPropertyActionClicked
		);

		eventBus.addListener(
			SaveButtonEvents.SAVE_BUTTON_CLICK,
			this.onSaveButtonClick
		);

		console.log("GraphController done");

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

	private onEditPropertyActionClicked = (action: PropertyEditAction) => {
		if (action === PropertyEditAction.COMPLETE)
			this.onCompletedPropertyClicked();
		else if (action === PropertyEditAction.INTEREST)
			this.onInterestedPropertyClicked();
	};

	private onCompletedPropertyClicked = () => {
		const selectedNodes = this.graphView.getSelectedNodes(),
			selectedNodeIds = selectedNodes.map((node) => node.id()),
			propertyName = "completed",
			numCompleted = selectedNodes.filter((node) => {
				return node.data("completed") === "true";
			}).length,
			numUncompleted = selectedNodes.filter((node) => {
				console.log(node.data("completed"), node.data("completed") === "false");
				return node.data("completed") === "false";
			}).length,
			newValue = numCompleted > numUncompleted ? "false" : "true",
			cy = this.graphView.getCy(),
			actions = selectedNodeIds.map((nodeId) => {
				return new EditPropertyAction(cy, nodeId, propertyName, newValue);
			}),
			compositeAction = new CompositeAction(actions);

		console.log(
			"fond ",
			numCompleted,
			" completed and ",
			numUncompleted,
			" uncompleted so setting to ",
			newValue
		);
		this.graphView.do(compositeAction);
	};

	private onInterestedPropertyClicked = () => {
		const selectedNodes = this.graphView.getSelectedNodes(),
			selectedNodeIds = selectedNodes.map((node) => node.id()),
			numInterested = selectedNodes.filter((node) => {
				return node.data("interested") === "true";
			}).length,
			numUninterested = selectedNodes.filter((node) => {
				return node.data("interested") === "false";
			}).length,
			propertyName = "interested",
			newValue = numInterested > numUninterested ? "false" : "true",
			cy = this.graphView.getCy(),
			actions = selectedNodeIds.map((nodeId) => {
				return new EditPropertyAction(cy, nodeId, propertyName, newValue);
			}),
			compositeAction = new CompositeAction(actions);

		this.graphView.do(compositeAction);
	};

	private onSelectionChanged = (selectionCount: number) => {
		if (selectionCount === 0)
			eventBus.emit(
				PropertyModalControllerEvents.SET_PROPERTY_MODAL_VISIBILITY,
				false
			);
		else
			eventBus.emit(
				PropertyModalControllerEvents.SET_PROPERTY_MODAL_VISIBILITY,
				true
			);
	};

	private onSaveButtonClick = () => {
		const actions = this.graphView.getWikibaseActions();
		console.log("actions", actions);
		const editActions = actions.getActions().map((action) => {
			return action.getEditAction(this.api, this.userEntityId);
		});

		// TODO: Enable later when it was tested
		return;

		const executions = editActions.map((action) => action());

		Promise.all(executions)
			.then((results) => {
				console.log("results", results);
			})
			.catch((error) => {
				console.log("error", error);
			})
			.finally(() => {
				console.log("finally");
			});
		console.log("editActions", editActions);
	};
}
