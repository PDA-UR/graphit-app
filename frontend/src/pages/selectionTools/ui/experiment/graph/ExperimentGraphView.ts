import { experimentEventBus } from "../../../global/ExperimentEventBus";
import {
	fromKeyboardEvent,
	isModifierActive,
	ModifierKey,
	fromEvent,
} from "../../../global/KeyboardManager";
import {
	ClickSelectionActionData,
	NeighborsSelectionActionData,
	PathSelectionActionData,
	SelectionTool,
} from "../../../global/SelectionTool";
import { SelectionType, getSelectionType } from "../../../global/SelectionType";
import {
	getPathSelectionElements,
	getNormalSelectionElements,
	getNeighbors,
	allShortestPaths,
	getCyElementsByIds,
	jumpToNodes,
} from "../../graph/CytoscapeElements";
import { initLassoSelection } from "../../graph/CytoscapeExtensions";
import { GraphView } from "../../graph/GraphView";
import {
	sharedEventBus,
	SharedEventBusEvent,
} from "../../shared/SharedEventBus";
import { Toast } from "../../toast/Toast";
import { SearchViewControllerEvents } from "../search/SearchController";
import cytoscape from "cytoscape-select";

export enum ExperimentGraphViewEvents {
	INDICATE_NODE_START = "hoverNodeStart",
	INDICATE_NODE_END = "hoverNodeEnd",
}

export class ExperimentGraphView extends GraphView {
	private readonly lassoSelection: any;

	private availablePathSelectionIndex = -1;
	private availablePathsToggleCount = 0;
	private availablePaths: any[] = [];

	constructor(cy: cytoscape.Core) {
		super(cy);
		this.lassoSelection = initLassoSelection(this.cy);
	}

	protected onTogglePanning(on: boolean): void {
		this.lassoSelection.toggle(!on);
	}

	// ~~~~~~~~~ Cytoscape listeners ~~~~~~~~~ //

	protected onCyKeyDown = (e: any) => {
		const modifierKeys = fromKeyboardEvent(e),
			selectionType = getSelectionType(modifierKeys);
		// console.log("Key down", e);
		if (e.key === "Shift") {
			console.log("Shift pressed");
			const hoveringNode = this.cy.$(".indicated").filter("node");
			if (hoveringNode) {
				this.setAvailablePathsIndication(hoveringNode.id());
			}
		} else if (
			e.key === "a" &&
			isModifierActive(fromKeyboardEvent(e), ModifierKey.CTRL)
		) {
			this.selectAll(selectionType);
			e.preventDefault();
		} else if (
			e.key === "i" &&
			isModifierActive(fromKeyboardEvent(e), ModifierKey.CTRL)
		) {
			this.invertSelection();
			e.preventDefault();
		} else if (Object.values(ModifierKey).includes(e.key)) {
			this.onModKeyChanged(e);
		}
	};

	protected onCyKeyUp = (e: any) => {
		if (e.key === "Shift") {
			const hoveringNode = this.cy.$(".indicated").filter("node");
			if (hoveringNode) this.clearAvailablePathsIndication();
		} else if (Object.values(ModifierKey).includes(e.key)) {
			this.onModKeyChanged(e);
		} else {
			// console.log("nope", e);
		}
	};

	private onModKeyChanged = (e: any) => {
		const modifierKeys = fromKeyboardEvent(e),
			selectionType = getSelectionType(modifierKeys);

		sharedEventBus.emit(
			SharedEventBusEvent.SELECTION_TYPE_CHANGED,
			selectionType
		);
	};

	// ----- Click Events ----- //

	public getDataAtFirstClick(modifierKeys: ModifierKey[]) {
		return {
			hoveringNode: this.cy.$(".indicated").filter("node"),
			selectionType: getSelectionType(modifierKeys),
			currentAvailablePath: this.getCurrentAvailablePath(),
			modifierKeys,
		};
	}

	onNormalClickNode = (
		clickedNode: any,
		dataAtClick: any,
		isSearch: boolean
	) => {
		console.log("normal click on", clickedNode);
		const doSelectShortestPathBetween = this.doSelectShortestPathBetween(
				dataAtClick.modifierKeys
			),
			selectionTool = doSelectShortestPathBetween
				? SelectionTool.PATH
				: isSearch
				? SelectionTool.SEARCH
				: SelectionTool.CLICK;

		// @ts-ignore
		const [elementsToSelect, elementsToUnselect] = doSelectShortestPathBetween
			? getPathSelectionElements(
					clickedNode,
					dataAtClick.currentAvailablePath,
					dataAtClick.selectionType,
					this.cy
			  )
			: getNormalSelectionElements(
					[clickedNode],
					dataAtClick.selectionType,
					this.cy
			  );

		if (
			doSelectShortestPathBetween &&
			elementsToSelect.length <= 1 &&
			elementsToUnselect.length <= 1
		) {
			console.log(
				doSelectShortestPathBetween,
				elementsToSelect,
				elementsToUnselect
			);

			Toast.warning("No path found").show();
		} else {
			const type = dataAtClick.selectionType;

			const elementIdsToSelect = elementsToSelect.map((ele: any) => ele.id()),
				elementIdsToUnselect = elementsToUnselect.map((ele: any) => ele.id());

			let addSelectionActionData:
					| ClickSelectionActionData
					| PathSelectionActionData,
				removeSelectionActionData:
					| ClickSelectionActionData
					| PathSelectionActionData;

			if (selectionTool === SelectionTool.PATH) {
				addSelectionActionData = {
					elementIds: elementIdsToSelect,
					toggleCount: this.availablePathsToggleCount,
				};
				removeSelectionActionData = {
					elementIds: elementIdsToUnselect,
					toggleCount: this.availablePathsToggleCount,
				};
			} else {
				addSelectionActionData = {
					didClickCanvas: false,
					elementIds: elementIdsToSelect,
				};
				removeSelectionActionData = {
					didClickCanvas: false,
					elementIds: elementIdsToUnselect,
				};
			}

			this.setSelection(
				addSelectionActionData,
				removeSelectionActionData,
				selectionTool,
				type
			);
		}

		if (clickedNode.hasClass("dimmed"))
			experimentEventBus.emit(SearchViewControllerEvents.RESET);

		this.availablePaths = [];
		this.availablePathSelectionIndex = -1;
		this.availablePathsToggleCount = 0;
		this.setLastClicked(clickedNode);
	};

	public _onNormalClickNode = (event: any, dataAtClick: any) => {
		console.log("_normal click");
		const clickedNode = event.target!;
		this.onNormalClickNode(clickedNode, dataAtClick, false);
	};

	public onDoubleClickNode = (clickedNode: any, dataAtClick: any) => {
		if (this.availablePathSelectionIndex >= 0) {
			this.stepNextAvailablePathsIndication(clickedNode.id());
			return;
		}
		const selectionType = dataAtClick.selectionType;
		const doExpandWholeSelection =
				clickedNode.selected() && selectionType === SelectionType.NEW,
			selectionTool = SelectionTool.NEIGHBORS;

		const neighbors = doExpandWholeSelection
			? getNeighbors([clickedNode, ...this.cy.$(":selected").not(".filtered")])
			: clickedNode.neighborhood().not(".filtered");

		const selectedElements =
			selectionType !== SelectionType.SUBTRACT
				? selectionType === SelectionType.NEW || !clickedNode.selected()
					? [clickedNode, ...neighbors]
					: neighbors
				: neighbors;

		if (neighbors.length > 0) {
			const type =
				selectionType === SelectionType.NEW
					? doExpandWholeSelection
						? SelectionType.ADD
						: SelectionType.NEW
					: selectionType;
			const tool = SelectionTool.NEIGHBORS,
				isDirectNeighbors = clickedNode.selected();

			const [elementsToSelect, elementsToUnselect] = getNormalSelectionElements(
				selectedElements,
				type,
				this.cy
			);

			const addSelectionActionData: NeighborsSelectionActionData = {
					elementIds: elementsToSelect.map((ele: any) => ele.id()),
					isDirectNeighbors,
				},
				removeSelectionActionData: NeighborsSelectionActionData = {
					elementIds: elementsToUnselect.map((ele: any) => ele.id()),
					isDirectNeighbors,
				};

			this.setSelection(
				addSelectionActionData,
				removeSelectionActionData,
				tool,
				type
			);
			this.setLastClicked(clickedNode);
		}

		if (clickedNode.hasClass("dimmed"))
			experimentEventBus.emit(SearchViewControllerEvents.RESET);
	};

	public onIndicateNodeStart = (id: string) => {
		this.setNodeIndication(id, true);
	};

	public onIndicateNodeEnd = (id: string) => {
		this.setNodeIndication(id, false);
	};

	// --- Hover Events --- //

	public onHoverNode = (element: any, modifierKeys: ModifierKey[]) => {
		const id = element.id(),
			isHoldingShift = isModifierActive(modifierKeys, ModifierKey.SHIFT);

		if (isHoldingShift) {
			{
				this.setAvailablePathsIndication(id);
			}
		}
		experimentEventBus.emit(ExperimentGraphViewEvents.INDICATE_NODE_START, id);
	};

	protected _onHoverNode = (event: any) => {
		const node = event.target!,
			modifierKeys = fromEvent(event.originalEvent);
		// console.log("hover node", node, modifierKeys, event);
		this.onHoverNode(node, modifierKeys);
	};

	private setAvailablePathsIndication = (id: string) => {
		this.availablePathSelectionIndex = 0;
		const lastClickedElement = this.cy.$("node.last-clicked");

		if (lastClickedElement) {
			this.availablePaths = allShortestPaths(
				this.cy,
				lastClickedElement.id(),
				id
			);
			this.onIndicateAvailablePathsStart(this.availablePaths);
		}
	};

	private stepNextAvailablePathsIndication = (id: string) => {
		if (this.availablePaths.length > 0) {
			this.availablePathSelectionIndex =
				(this.availablePathSelectionIndex + 1) % this.availablePaths.length;
			this.availablePathsToggleCount++;

			this.cy.$(".path-highlight-active").removeClass("path-highlight-active");
			this.cy
				.$(".path-highlight-inactive")
				.removeClass("path-highlight-inactive");

			this.onIndicateAvailablePathsStart(this.availablePaths, true);
		}
	};

	protected onHoverNodeEnd = (event: any) => {
		const element = event.target,
			id = element.id();
		this.clearAvailablePathsIndication();
		this.availablePaths = [];
		this.availablePathSelectionIndex = -1;
		this.availablePathsToggleCount = 0;
		experimentEventBus.emit(ExperimentGraphViewEvents.INDICATE_NODE_END, id);
	};

	private onIndicateAvailablePathsStart = (
		availablePaths: any[],
		skipDim = false
	) => {
		availablePaths.forEach((path: any[], i: number) => {
			path.forEach((id: string, index: number) => {
				const nextId = path[index + 1];
				const node = this.cy.getElementById(id);
				if (i === this.availablePathSelectionIndex) {
					node.addClass("path-highlight-active");

					if (nextId) {
						const nextNode = this.cy.getElementById(nextId);
						const edge = node.edgesWith(nextNode);
						edge.addClass("path-highlight-active");
					}
				} else {
					if (nextId) {
						const nextNode = this.cy.getElementById(nextId);
						const edge = node.edgesWith(nextNode);
						edge.addClass("path-highlight-inactive");
					}
					node.addClass("path-highlight-inactive");
				}
			});
		});

		if (!skipDim)
			this.cy
				.elements()
				.not(".path-highlight-active, .path-highlight-inactive")
				.addClass("path-dimmed");
	};

	public clearAvailablePathsIndication = () => {
		this.cy.elements().removeClass("path-highlight-active");
		this.cy.elements().removeClass("path-highlight-inactive");
		this.cy.elements().removeClass("path-dimmed");
	};

	// ~~~~~~~~~~ Private Logic ~~~~~~~~~~ //

	private getCurrentAvailablePath = () => {
		return this.availablePaths[this.availablePathSelectionIndex] ?? [];
	};

	private doSelectShortestPathBetween(modifierKeys: ModifierKey[]) {
		return isModifierActive(modifierKeys, ModifierKey.SHIFT);
	}

	// ------ Highlights ------ //

	setNodeSpotlight(ids: string[]) {
		this.clearSpotlight();
		const elements = this.cy
				.elements()
				.filter((ele: any) => ids.includes(ele.id())),
			otherElements = this.cy.elements().difference(elements);

		otherElements.addClass("dimmed");
	}

	clearSpotlight() {
		this.cy.elements().removeClass("dimmed");
	}

	setNodeIndication(id: string, on: boolean) {
		const node = this.cy.getElementById(id);
		if (on) {
			node.addClass("indicated");
			this.setNodeNeighborHighlight(node, true);
		} else {
			node.removeClass("indicated");
			this.setNodeNeighborHighlight(node, false);
		}
	}

	clearNodeIndication() {
		this.cy.elements().removeClass("indicated");
	}

	setNodeNeighborHighlight(rootNode: any, on: boolean) {
		const neighbors = rootNode.neighborhood(),
			incomingElements: any[] = [],
			outgoingElements: any[] = [];

		neighbors.forEach((neighbor: any) => {
			const connectedEdges = neighbor.connectedEdges();
			connectedEdges.forEach((edge: any) => {
				if (edge.target().id() === rootNode.id()) {
					incomingElements.push(edge);
					incomingElements.push(neighbor);
				} else if (edge.source().id() === rootNode.id()) {
					outgoingElements.push(edge);
					outgoingElements.push(neighbor);
				}
			});
		});

		if (on) {
			neighbors.addClass("neighbor");
			incomingElements.forEach((ele: any) => ele.addClass("incoming"));
			outgoingElements.forEach((ele: any) => ele.addClass("outgoing"));
		} else {
			neighbors.removeClass("neighbor");
			incomingElements.forEach((ele: any) => ele.removeClass("incoming"));
			outgoingElements.forEach((ele: any) => ele.removeClass("outgoing"));
		}
	}

	// ------- Movement ------- //

	jumpToNodes(nodeIds: string[]) {
		const nodes = getCyElementsByIds(nodeIds, this.cy);
		jumpToNodes(nodes, this.cy);
	}

	// -------- Setters ------- //

	onReset = () => {
		this.cy
			.elements()
			.removeClass(
				"indicated neighbor path-highlight-active path-highlight-inactive path-dimmed"
			);

		this.availablePathSelectionIndex = 0;
		this.availablePathsToggleCount = 0;
		this.clearAvailablePathsIndication();
	};
}
