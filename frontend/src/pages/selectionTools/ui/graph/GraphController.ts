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
import { LogOutButtonEvents } from "../logoutButton/logoutButtonView";
import { GraphView } from "./GraphView";
import { PathViewEvents } from "../learnpath/PathViewGraph";

export const GRAPH_SAVE_EVENT = "GRAPH_SAVE_EVENT";
export enum GraphSaveProgress {
	START,
	COMPLETE,
	ERROR,
	COUNT_WARNING,
	UNAUTHORIZED,
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

		experimentEventBus.addListener(
			LogOutButtonEvents.LOGOUT_BUTTON_CLICK,
			this.onLogoutButtonClick
		);
	}

	private onLogoutButtonClick = () => {
		this.client.logout(); 
		setTimeout(() => {
			localStorage.clear();
			window.location.href = "/app/"; // Nav to main-page
		}, 10); // Otherwise, logout gets interrupted and throws an error
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
				if (results[0].status === 401 ) { 
					experimentEventBus.emit(GRAPH_SAVE_EVENT, {
						progress: GraphSaveProgress.UNAUTHORIZED,
					});
				} else {
					experimentEventBus.emit(GRAPH_SAVE_EVENT, {
						progress: GraphSaveProgress.COMPLETE,
					});
				}
			})
			.catch((error) => {
				experimentEventBus.emit(GRAPH_SAVE_EVENT, {
					progress: GraphSaveProgress.ERROR,
					error,
				});
				console.log("error")
			})
			.finally(() => {
				console.log("finally");
				this.resetSaveCounter();
			});
		console.log("!!actions", individualActions, executions);
	};

	private onEditPropertyActionClicked = (action: PropertyEditAction) => {
		if (action === PropertyEditAction.COMPLETE)
			this.onCompletedPropertyClicked();
		else if (action === PropertyEditAction.INTEREST)
			this.onInterestedPropertyClicked();

		// update style in Path
		experimentEventBus.emit(PathViewEvents.PROPERTY_ACTION_CLICKED, action)
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
	
		this.updateSaveCounter();
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

		this.updateSaveCounter()
	};


	private updateSaveCounter() {
		const div = document.getElementById("save-counter") as HTMLElement;
		const actions = this.view.getWikibaseActions();
		const individualActions = actions.getActions().length;

		div.innerHTML = `<b> ${individualActions} </b> unsaved changes`;

		// Color-coding and warning
		if(individualActions > 35){
			experimentEventBus.emit(GRAPH_SAVE_EVENT, {
				progress: GraphSaveProgress.COUNT_WARNING,
			});
			if (individualActions > 60) div.style.color = "red";
			else div.style.color = "DarkOrange";
		} else div.style.color = "black";
	}

	private resetSaveCounter() {
		const div = document.getElementById("save-counter") as HTMLElement;
		div.innerHTML = `<b>0</b> unsaved changes`;;
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
