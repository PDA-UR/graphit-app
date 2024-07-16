import { ActionManager } from "../../../../shared/extensions/undo/ActionManager";
import { Action } from "../../../../shared/extensions/undo/actions/Action";
import { AddSelectionAction } from "../../../../shared/extensions/undo/actions/AddSelectionAction";
import { CompositeAction } from "../../../../shared/extensions/undo/actions/CompositeAction";
import { RemoveSelectionAction } from "../../../../shared/extensions/undo/actions/RemoveSelectionAction";
import { View } from "../../../../shared/ui/View";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import {
	fromEvent,
	isModifierActive,
	ModifierKey,
} from "../../global/KeyboardManager";
import {
	SelectionTool,
	AllSelectionActionData,
	InvertSelectionActionData,
	ClickSelectionActionData,
	SelectionActionDataMap,
} from "../../global/SelectionTool";
import { getAllSelectionElements } from "./CytoscapeElements";
import { initNodeHtmlLabel, initUndoRedo } from "./CytoscapeExtensions";
import { zoom } from "./CytoscapeView";
import { SelectionType } from "../../global/SelectionType";
import { PathViewEvents } from "../learnpath/PathViewGraph";
import cytoscape from "cytoscape";

export enum GraphViewEvents {
	SELECTION_CHANGED = "selectionChanged",
	LAST_CLICKED_CHANGED = "lastClickedChanged",
	PATH_SELECTION_CHANGED = "pathSelectionChanged",
}

export abstract class GraphView extends View {
	protected readonly cy: any;
	protected readonly actionManager: ActionManager;

	private selectEventTimeout: any;
	private isPanning: boolean = false;

	private dataAtFirstClick: any = {};
	private isWaitingForDoubleClick: boolean = false;

	constructor(cy: cytoscape.Core) {
		super();
		this.cy = cy;

		// initNodeHtmlLabel(this.cy); // for adding images to a node
		this.actionManager = initUndoRedo(this.cy);

		this.cy.userPanningEnabled(false);
		this.cy.boxSelectionEnabled(false);
		this.cy.nodes().grabify();
		this.cy.nodes().selectify();
		// set max zoom
		this.cy.minZoom(0.3);
		// make all edges unselectable
		this.cy.edges().unselectify();
	}

	toggleHtmlListeners(on: boolean): void {
		if (on) {
			this.cy.on("click", this.onAtomicClick);
			this.cy.on("cxttap", "node", this.onRightClick);
			this.cy.on("select unselect", this.onSelectionChanged);
			this.cy.on("multiSelect", this.onMultiSelect);
			this.cy.on("mouseover", "node", this._onHoverNode);
			this.cy.on("mouseout", "node", this.onHoverNodeEnd);
			this.cy.on("boxselect", this._onBoxSelect);
			experimentEventBus.on(PathViewEvents.NODE_SELECT, this.onAtomicClick);
		} else {
			this.cy.removeListener("click", this.onAtomicClick);
			this.cy.removeListener("select unselect", this.onSelectionChanged);
			this.cy.removeListener("multiSelect", this.onMultiSelect);
			this.cy.removeListener("mouseover", "node", this._onHoverNode);
			this.cy.removeListener("mouseout", "node", this.onHoverNodeEnd);
			this.cy.removeListener("boxselect", this._onBoxSelect);
			experimentEventBus.on(PathViewEvents.NODE_SELECT, this.onAtomicClick);
		}
	}

	private readonly boxSelectElementBuffer: any[] = [];
	boxSelectElementTimeout: any = null;

	private _onBoxSelect = (e: any) => {
		const element = e.target;
		if (element.isNode()) {
			this.boxSelectElementBuffer.push(element);

			if (!this.boxSelectElementTimeout) {
				const modifierKeys = fromEvent(e);
				this.boxSelectElementTimeout = setTimeout(() => {
					this.boxSelectElementTimeout = null;
					this.onBoxSelect(
						[...this.boxSelectElementBuffer],
						this.getDataAtFirstClick(modifierKeys)
					);
					this.boxSelectElementBuffer.length = 0;
				}, 25);
			}
		}
	};

	protected onBoxSelect(elements: any[], dataAtFirstClick: any) {}

	// ~~~~~~~~~~~ Mouse listeners ~~~~~~~~~~~ //

	public onWheel = (e: any) => {
		if (isModifierActive(fromEvent(e), ModifierKey.SHIFT)) {
			zoom(this.cy, -e.deltaY, 0.0004, e);
		} else {
			zoom(this.cy, -e.deltaY, 0.002, e);
		}
	};

	public onMousedown = (e: any) => {
		if (this.doActivatePanning(e)) {
			this.isPanning = true;
			this.onTogglePanning(true);
			// this.lassoSelection.toggle(false);
		}
	};

	public onMouseUp = (e: any) => {
		if (this.isPanning) {
			this.isPanning = false;
			// this.lassoSelection.toggle(true);
			this.onTogglePanning(false);
		}
	};

	protected abstract onTogglePanning(on: boolean): void;

	public onMouseMove = (e: any) => {
		if (this.isPanning) {
			this.cy.panBy({
				x: e.movementX,
				y: e.movementY,
			});
		}
	};

	// ~~~~~~~~~~ Keyboard Listeners ~~~~~~~~~ //

	public onKeydown = (e: any) => {
		// console.log(e);
		const isInputElement = e.target instanceof HTMLInputElement;

		// return if ctrl a
		if (e.key === "a" && e.ctrlKey && isInputElement) return;
		if (e.key === "z" && e.ctrlKey) this.undo();
		else if (e.key === "y" && e.ctrlKey) {
			e.preventDefault();
			this.redo();
		}
		this.onCyKeyDown(e);
	};

	public onKeyUp = (e: any) => {
		this.onCyKeyUp(e);
	};

	// ---- Keyboard Events --- //

	public selectAll = (selectionType: SelectionType) => {
		const tool = SelectionTool.ALL;

		const [elementIdsToSelect, elementIdsToUnselect] = getAllSelectionElements(
				this.cy,
				selectionType
			).map((elements) => elements.map((element: any) => element.id())),
			addSelectionActionData: AllSelectionActionData = {
				elementIds: elementIdsToSelect,
			},
			removeSelectionActionData: AllSelectionActionData = {
				elementIds: elementIdsToUnselect,
			};

		this.setSelection(
			addSelectionActionData,
			removeSelectionActionData,
			tool,
			selectionType
		);
	};

	public invertSelection = () => {
		const tool = SelectionTool.INVERT;

		const selectedElements = this.cy.elements(":selected"),
			selectedElementsIds = selectedElements.map((element: any) =>
				element.id()
			),
			unselectedElements = this.cy.elements().difference(selectedElements),
			unselectedElementsIds = unselectedElements.map((element: any) =>
				element.id()
			),
			addInvertSelectionActionData: InvertSelectionActionData = {
				elementIds: unselectedElementsIds,
			},
			removeInvertSelectionActionData: InvertSelectionActionData = {
				elementIds: selectedElementsIds,
			};

		this.setSelection(
			addInvertSelectionActionData,
			removeInvertSelectionActionData,
			tool,
			SelectionType.NEW
		);
	};

	// ~~~~~~~~~ Cytoscape listeners ~~~~~~~~~ //

	protected abstract onCyKeyDown(e: any): void;
	protected abstract onCyKeyUp(e: any): void;

	// ----- Click Events ----- //

	private lastClickTs: number = 0;
	private onAtomicClick = (event: any) => {
		if (this.lastClickTs + 10 > event.timeStamp) return;

		this.lastClickTs = event.timeStamp;
		const modifierKeys = fromEvent(event.originalEvent as MouseEvent);

		if (this.isWaitingForDoubleClick) {
			this.isWaitingForDoubleClick = false;
			this.onDoubleClick(event, this.dataAtFirstClick);
		} else {
			this.isWaitingForDoubleClick = true;
			this.dataAtFirstClick = this.getDataAtFirstClick(modifierKeys);
			setTimeout(() => {
				if (this.isWaitingForDoubleClick) {
					this.isWaitingForDoubleClick = false;
					this.onNormalClick(event, this.dataAtFirstClick);
					this.resetDataAtFirstClick();
				}
			}, 200);
		}
	};

	protected abstract getDataAtFirstClick(modifierKeys: ModifierKey[]): any;

	private resetDataAtFirstClick = () => {
		this.dataAtFirstClick = {};
		this.isWaitingForDoubleClick = false;
	};

	private onNormalClick = (event: any, dataAtClick: any) => {
		const isCanvas = event.target === this.cy;
		if (isCanvas) this.onNormalClickCanvas();
		else {
			const isNode = event.target.isNode();
			// console.log("clicked node:", event.target.data("label"), event.target.id());
			if (isNode) this._onNormalClickNode(event, dataAtClick);
		}
		this.resetDataAtFirstClick();
	};

	private onNormalClickCanvas = () => {
		const elementIds = this.cy.$(":selected").map((ele: any) => ele.id());
		const removeSelectionData: ClickSelectionActionData = {
			didClickCanvas: true,
			elementIds,
		};
		this.setSelection(
			null,
			removeSelectionData,
			SelectionTool.CLICK,
			SelectionType.NEW
		);
		this.clearLastClicked();
	};

	protected abstract _onNormalClickNode: (event: any, dataAtClick: any) => void;

	private onDoubleClick = (event: any, dataAtClick: any) => {
		const isNode = event.target.isNode();
		if (isNode) this.onDoubleClickNode(event.target, dataAtClick);
		this.resetDataAtFirstClick();
	};

	protected abstract onDoubleClickNode: (
		clickedNode: any,
		dataAtClick: any
	) => void;

	// open WikibasePage for a selected Node
	protected onRightClick = (event:any) => {
		const node = event.target;
		let url = node.id() as string;
		console.log("open", url);
		if(this.isValidUrl(url)) {
			window.open(url, "_blank")?.focus();
		} else { console.log("no valid url"); }
	}

	private isValidUrl(url:string) {
		try {
			new URL(url);
			return true;
		} catch (err) {
			return false;
		}
	} // via: https://www.freecodecamp.org/news/how-to-validate-urls-in-javascript/ 

	// --- Selection Events --- //

	private onSelectionChanged = (event: any) => {
		if (event.target.isNode()) {
			if (!this.selectEventTimeout)
				this.selectEventTimeout = setTimeout(() => {
					const selectedNodes = this.cy.$(":selected").map((n: any) => n.id());
					experimentEventBus.emit(
						GraphViewEvents.SELECTION_CHANGED,
						selectedNodes
					);
					experimentEventBus.emit(
						GraphViewEvents.PATH_SELECTION_CHANGED,
						this.cy.$(":selected").map((n: any) => n.data("label"))
					)
					this.selectEventTimeout = null;
				}, 10);
		}
	};

	protected onMultiSelect = <T extends SelectionTool>(
		_e: any,
		...data: [AddSelectionAction<T> | null, RemoveSelectionAction<T> | null]
	) => {
		const [addSelectionAction, removeSelectionAction] = data;

		let actionToDo: Action;

		if (
			addSelectionAction &&
			addSelectionAction.numElements() > 0 &&
			removeSelectionAction &&
			removeSelectionAction.numElements() > 0
		) {
			actionToDo = new CompositeAction([
				addSelectionAction,
				removeSelectionAction,
			]);
		} else if (addSelectionAction && addSelectionAction.numElements() > 0) {
			actionToDo = addSelectionAction;
		} else if (
			removeSelectionAction &&
			removeSelectionAction.numElements() > 0
		) {
			actionToDo = removeSelectionAction;
		} else return;

		this.actionManager.do(actionToDo);
	};


	// --- Hover Events --- //

	protected abstract _onHoverNode: (event: any) => void;
	protected abstract onHoverNodeEnd: (event: any) => void;

	// ~~~~~~~~~~ Protected Logic ~~~~~~~~~~ //

	public setSelection = <T extends SelectionTool>(
		addSelectionData: SelectionActionDataMap[T] | null,
		removeSelectionData: SelectionActionDataMap[T] | null,
		tool: T,
		type: SelectionType
	) => {
		const addSelectionAction = addSelectionData
				? new AddSelectionAction(this.cy, tool, type, addSelectionData)
				: null,
			removeSelectionAction = removeSelectionData
				? new RemoveSelectionAction(this.cy, tool, type, removeSelectionData)
				: null;

		this.cy.emit("multiSelect", [addSelectionAction, removeSelectionAction]);
	};

	public setLastClicked(clickedNode: any) {
		this.cy.nodes().removeClass("last-clicked");
		clickedNode.addClass("last-clicked");
		experimentEventBus.emit(
			GraphViewEvents.LAST_CLICKED_CHANGED,
			clickedNode.id()
		);
	}

	public applyChanges() {
		// set data.original to data for each node
		this.cy.nodes().forEach((node: any) => {
			node.data.originalValue = {
				...node.data,
				originalValue: undefined,
			};
		});
	}

	// ~~~~~~~~~~ Private Logic ~~~~~~~~~~ //

	private clearLastClicked() {
		this.cy.$("node.last-clicked").removeClass("last-clicked");
	}

	private doActivatePanning(event: MouseEvent) {
		return (
			event.button === 1 ||
			event.button === 2 ||
			isModifierActive(fromEvent(event), ModifierKey.SPACE)
		);
	}

	// -------- Actions ------- //

	do(action: Action) {
		this.actionManager.do(action);
	}

	undo(): Action | null {
		return this.actionManager.undo();
	}

	redo(): Action | null {
		return this.actionManager.redo();
	}

	clearActions() {
		this.actionManager.clear();
	}

	// ------ Getters ------ //

	getSelectedNodes() {
		return this.cy.$(":selected");
	}

	getCy() {
		return this.cy;
	}

	getNodeById(id: string) {
		return this.cy.getElementById(id);
	}

	getWikibaseActions() {
		return this.actionManager.getWikibaseActions();
	}

	// -------- Setters ------- //

	reset = () => {
		this.clearActions();

		this.cy.elements().removeClass("last-clicked incoming outgoing dimmed");

		this.cy.elements().unselect();

		this.cy
			.layout({
				name: "fcose",
			})
			.run();
		this.isPanning = false;
		this.dataAtFirstClick = {};
		this.isWaitingForDoubleClick = false;
		this.onReset();
	};

	protected abstract onReset: () => void;
}
