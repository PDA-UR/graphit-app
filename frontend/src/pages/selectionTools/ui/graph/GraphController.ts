import WikibaseClient from "../../../../shared/WikibaseClient";
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

export const GRAPH_SAVE_EVENT = "GRAPH_SAVE_EVENT";
export enum GraphSaveProgress {
	START,
	COMPLETE,
	ERROR,
	COUNT_WARNING,
}

export abstract class GraphController<
	T extends GraphView
> extends ViewController<T> {
	constructor(
		view: T,
		private client: WikibaseClient,
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
		experimentEventBus.emit(GRAPH_SAVE_EVENT, {
			progress: GraphSaveProgress.START,
		});

		const actions = this.view.getWikibaseActions();
		console.log("actions", actions);
		const individualActions = actions.getActions();

		const executions = individualActions.map((action) =>
			action.getEditAction(this.client, this.userEntityId)()
		);
		Promise.all(executions)
			.then((results) => {
				this.view.clearActions();
				this.view.applyChanges();
				experimentEventBus.emit(GRAPH_SAVE_EVENT, {
					progress: GraphSaveProgress.COMPLETE,
				});
			})
			.catch((error) => {
				experimentEventBus.emit(GRAPH_SAVE_EVENT, {
					progress: GraphSaveProgress.ERROR,
					error,
				});
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
				return new EditPropertyAction(
					cy,
					nodeId,
					propertyName,
					newValue,
					"has completed"
				);
			}),
			compositeAction = new CompositeAction(actions);

		console.log(
			"found ",
			numCompleted,
			" completed and ",
			numUncompleted,
			" uncompleted so setting to ",
			newValue
		);

		this.view.do(compositeAction);
		this.updateSaveCounter(newValue, numUncompleted, numCompleted);
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
				return new EditPropertyAction(
					cy,
					nodeId,
					propertyName,
					newValue,
					"interested in"
				);
			}),
			compositeAction = new CompositeAction(actions);

		this.view.do(compositeAction);
		this.updateSaveCounter(newValue, numUninterested, numInterested);
	};

	
	private updateSaveCounter(update:string, add:number, remove:number) {
		const counterDiv = document.getElementById("save-counter") as HTMLElement;
		let num = Number(counterDiv.innerHTML);

		(update === "true") ? num += add : num -= remove; //items added or removed
		
		if (num < 0) num *= -1;
		counterDiv.innerHTML = "Saving " + num.toString();
		console.log("num", num);

		// Give notice about save-time
		if (num > 40) {
			experimentEventBus.emit(GRAPH_SAVE_EVENT, {
				progress: GraphSaveProgress.COUNT_WARNING,
			});
			if (num > 60) counterDiv.style.color = "red";
			else counterDiv.style.color = "DarkOrange";
		} else counterDiv.style.color = "black";
	}

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
