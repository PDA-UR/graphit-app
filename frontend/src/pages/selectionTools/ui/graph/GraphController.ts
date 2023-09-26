import { ApiClient } from "../../../../shared/client/ApiClient";
import { CompositeAction } from "../../../../shared/extensions/undo/actions/CompositeAction";
import { EditPropertyAction } from "../../../../shared/extensions/undo/actions/EditPropertyAction";
import { ViewController } from "../../../../shared/ui/ViewController";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import {
	PropertyEditAction,
	PropertyModalControllerEvents,
} from "../propertyModal/PropertyModalController";
import { SaveButtonEvents } from "../saveButton/SaveButtonView";
import { GraphView } from "./GraphView";

export abstract class GraphController<
	T extends GraphView
> extends ViewController<T> {
	constructor(
		view: T,
		private api: ApiClient<unknown>,
		private userEntityId: string
	) {
		super(view);

		experimentEventBus.addListener(
			PropertyModalControllerEvents.EDIT_PROPERTY_ACTION_CLICKED,
			this.onEditPropertyActionClicked
		);

		experimentEventBus.addListener(
			SaveButtonEvents.SAVE_BUTTON_CLICK,
			this.onSaveButtonClick
		);
	}

	private onSaveButtonClick = () => {
		const actions = this.view.getWikibaseActions();
		console.log("actions", actions);
		const individualActions = actions.getActions();

		const executions = individualActions.map((action) =>
			action.getEditAction(this.api, this.userEntityId)()
		);

		Promise.all(executions)
			.then((results) => {
				console.log("results", results);
				this.view.clearActions();
				console.warn("TODO: Save");
				// TODO: Bake changes into cy elements (update data.originalValue)
				// this.graphModel.forEach((element) => {
				// 	// set data.original value to data but without the existing originalValue
				// 	element.data.originalValue = Object.fromEntries(
				// 		Object.entries(element.data).filter(
				// 			([key, value]) => key !== "originalValue"
				// 		)
				// 	);
				// });
				// this.view.updateData(this.graphModel);
			})
			.catch((error) => {
				console.log("error", error);
			})
			.finally(() => {
				console.log("finally");
			});
		// console.log("editActions", editActions);
	};

	private onEditPropertyActionClicked = (action: PropertyEditAction) => {
		if (action === PropertyEditAction.COMPLETE)
			this.onCompletedPropertyClicked();
		else if (action === PropertyEditAction.INTEREST)
			this.onInterestedPropertyClicked();
	};

	private onCompletedPropertyClicked = () => {
		console.log("onCompletedPropertyClicked");
		const selectedNodes = this.view.getSelectedNodes(),
			selectedNodeIds = selectedNodes.map((node: any) => node.id()),
			propertyName = "completed",
			numCompleted = selectedNodes.filter((node: any) => {
				return node.data("completed") === "true";
			}).length,
			numUncompleted = selectedNodes.filter((node: any) => {
				console.log(node.data("completed"), node.data("completed") === "false");
				return node.data("completed") === "false";
			}).length,
			newValue = numCompleted > numUncompleted ? "false" : "true",
			cy = this.view.getCy(),
			actions = selectedNodeIds.map((nodeId: string) => {
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
		this.view.do(compositeAction);
	};

	private onInterestedPropertyClicked = () => {
		console.log("onInterestedPropertyClicked");
		const selectedNodes = this.view.getSelectedNodes(),
			selectedNodeIds = selectedNodes.map((node: any) => node.id()),
			numInterested = selectedNodes.filter((node: any) => {
				return node.data("interested") === "true";
			}).length,
			numUninterested = selectedNodes.filter((node: any) => {
				return node.data("interested") === "false";
			}).length,
			propertyName = "interested",
			newValue = numInterested > numUninterested ? "false" : "true",
			cy = this.view.getCy(),
			actions = selectedNodeIds.map((nodeId: string) => {
				return new EditPropertyAction(cy, nodeId, propertyName, newValue);
			}),
			compositeAction = new CompositeAction(actions);

		this.view.do(compositeAction);
	};

	private initMouseListeners = (on = true) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("wheel", this.view.onWheel);
		fn("mousedown", this.view.onMousedown);
		fn("mouseup", this.view.onMouseUp);
		fn("mousemove", this.view.onMouseMove);
	};

	private initKeyboardListeners = (on = true) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("keydown", this.view.onKeydown);
		fn("keyup", this.view.onKeyUp);
	};

	public reset = () => {
		this.view.reset();
	};

	toggleListeners = (on = true) => {
		this.initMouseListeners(on);
		this.initKeyboardListeners(on);
	};
}
