import pointInPolygon from "point-in-polygon";
import {
	getPointInCy,
	Point,
	Rect,
} from "../../../pages/selectionTools/ui/graph/CytoscapeView";
import { fromMouseEvent } from "../../../pages/selectionTools/global/KeyboardManager";
import { AddSelectionAction } from "../undo/actions/AddSelectionAction";
import { RemoveSelectionAction } from "../undo/actions/RemoveSelectionAction";

import { SelectionActionData } from "../undo/actions/SelectionAction";
import {
	SelectionTool,
	LassoRectSelectionActionData,
} from "../../../pages/selectionTools/global/SelectionTool";
import {
	getSelectionType,
	SelectionType,
} from "../../../pages/selectionTools/global/SelectionType";

/**
 * Code from: https://github.com/zakjan/cytoscape-lasso
 * Modified to be typescript compatible
 * Also: planning to add new features
 */

export class LassoHandler {
	private cy: any;
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private originalAutoungrabify: boolean = false;
	private originalUserPanningEnabled: boolean = false;
	private originalBoxSelectionEnabled: boolean = false;
	private polygon: Point[] = [];
	private rect: Rect = [
		[0, 0],
		[0, 0],
	];
	private activated = false;
	private isDisabled = false;

	private readonly RECT_THRESHOLD = 100;
	private readonly OFFSET = 100;

	constructor(cy: any) {
		this.cy = cy;
		const graphContainer = this.cy.container();
		const originalCanvas = graphContainer.querySelector(
			'canvas[data-id="layer0-selectbox"]'
		);
		this.canvas = document.createElement("canvas");
		this.canvas.setAttribute("data-id", "layer0-lasso");
		this.canvas.setAttribute("style", originalCanvas.getAttribute("style"));
		this.onGraphResize();
		originalCanvas.parentElement.insertBefore(this.canvas, originalCanvas);
		this.ctx = this.canvas.getContext("2d")!;
		this.cy.on("resize", this.onGraphResize.bind(this));
		graphContainer.addEventListener(
			"mousedown",
			this.onGraphContainerMouseDown.bind(this)
		);
	}

	toggle(on: boolean): void {
		this.isDisabled = !on;
	}

	destroy(): void {
		const graphContainer = this.cy.container();
		this.cy.off("resize", this.onGraphResize.bind(this));
		graphContainer.removeEventListener(
			"mousedown",
			this.onGraphContainerMouseDown.bind(this)
		);
		this.canvas.remove();
	}

	private onGraphResize(): void {
		const pixelRatio = this.cy.renderer().getPixelRatio();
		this.canvas.width = this.cy.width() * pixelRatio;
		this.canvas.height = this.cy.height() * pixelRatio;
		this.canvas.style.width = `${this.cy.width()}px`;
		this.canvas.style.height = `${this.cy.height()}px`;
	}

	private onGraphContainerMouseDown(event: MouseEvent): void {
		if (this.isDisabled) return;
		this.polygon = [[event.clientX, event.clientY]];
		this.rect = [
			[event.clientX, event.clientY],
			[event.clientX, event.clientY],
		];
		this.cy
			.container()
			.addEventListener("mousemove", this.onDocumentMouseMove.bind(this));
		this.cy
			.container()
			.addEventListener("mouseup", this.onDocumentMouseUp.bind(this));
	}

	private onDocumentMouseMove(event: MouseEvent): void {
		if (this.isDisabled) return;
		this.polygon.push([event.clientX, event.clientY]);
		this.rect[1] = [event.clientX, event.clientY];
		if (this.shouldActivate(event)) {
			this.activate(event);
		}
		this.render();
	}

	private shouldActivate(event: MouseEvent): boolean {
		if (this.isDisabled) false;
		const renderer = this.cy.renderer();
		const hoverData = renderer.hoverData;
		const isEhSource = this.cy.$(".eh-source").length === 0;
		const selectionType = getSelectionType(fromMouseEvent(event));
		return (
			event.buttons === 1 &&
			isEhSource &&
			(((hoverData.down == null || hoverData.down.pannable()) &&
				!hoverData.dragging &&
				(selectionType === SelectionType.ADD ||
					!this.cy.panningEnabled() ||
					!this.cy.userPanningEnabled())) ||
				(hoverData.down && selectionType === SelectionType.ADD))
		);
	}

	private activate(event: MouseEvent): void {
		if (this.isDisabled) return;
		if (this.activated) return;
		const firstPosition = this.polygon[0];
		const lastPosition = this.polygon[this.polygon.length - 1];
		const dx = lastPosition[0] - firstPosition[0];
		const dy = lastPosition[1] - firstPosition[1];
		const isOverThresholdDrag =
			dx * dx + dy * dy >= this.cy.renderer().desktopTapThreshold2;

		if (isOverThresholdDrag) {
			this.activated = true;
			this.originalAutoungrabify = this.cy.autoungrabify();
			this.originalUserPanningEnabled = this.cy.userPanningEnabled();
			this.originalBoxSelectionEnabled = this.cy.boxSelectionEnabled();
			this.cy.autoungrabify(true);
			this.cy.userPanningEnabled(false);
			this.cy.boxSelectionEnabled(false);
			this.cy.renderer().data.bgActivePosistion = undefined;
			this.cy.renderer().redrawHint("select", true);
			this.cy.renderer().redraw();
			const graphPosition = this.getGraphPosition([
				event.clientX,
				event.clientY,
			]);
			this.cy.emit({
				type: "boxstart",
				originalEvent: event,
				position: { x: graphPosition[0], y: graphPosition[1] },
			});
		}
	}

	private onDocumentMouseUp(event: MouseEvent): void {
		if (this.isDisabled) return;

		this.cy
			.container()
			.removeEventListener("mousemove", this.onDocumentMouseMove.bind(this));
		this.cy
			.container()
			.removeEventListener("mouseup", this.onDocumentMouseUp.bind(this));

		if (!this.activated) {
			return;
		}

		this.finish(event);
		this.polygon = [];
		this.rect = [
			[0, 0],
			[0, 0],
		];
		this.render();
		this.cy.autoungrabify(this.originalAutoungrabify);
		this.cy.userPanningEnabled(this.originalUserPanningEnabled);
		this.cy.boxSelectionEnabled(this.originalBoxSelectionEnabled);
		this.cy.renderer().hoverData.dragged = true;
		const graphPosition = this.getGraphPosition([event.clientX, event.clientY]);
		this.cy.emit({
			type: "boxend",
			originalEvent: event,
			position: { x: graphPosition[0], y: graphPosition[1] },
		});
	}

	private selectNodesInRect(): any {
		// console.log("selectNodesInRect");
		const graphRect = this.getGraphRect(this.rect);
		const matchedNodes = this.cy.nodes().filter((node: any) => {
			const position = node.position();
			const point: Point = [position.x, position.y];
			return this.isPointInRect(point, graphRect);
		});
		return matchedNodes;
	}

	private selectNodesInPolygon(): any {
		// console.log("selectNodesInPolygon");
		const graphPolygon = this.getGraphPolygon(this.polygon);
		const matchedNodes = this.cy.nodes().filter((node: any) => {
			const position = node.position();
			const point = [position.x, position.y];
			return pointInPolygon(point, graphPolygon);
		});
		return matchedNodes;
	}

	private finish(event: MouseEvent): void {
		if (this.isDisabled) return;

		const distance = this.distance(this.rect[0], this.rect[1]),
			doUseRect = distance >= this.RECT_THRESHOLD;

		const matchedNodes = doUseRect
			? this.selectNodesInRect().not(".filtered")
			: this.selectNodesInPolygon().not(".filtered");

		const elementsToUnselect = [],
			elementsToSelect = [];

		const selectionType = getSelectionType(fromMouseEvent(event));
		if (selectionType === SelectionType.NEW) {
			elementsToUnselect.push(...this.cy.$(":selected").unmerge(matchedNodes));
			// not of class .filtered
			elementsToSelect.push(...matchedNodes.filter(":selectable:unselected"));
		} else if (selectionType === SelectionType.SUBTRACT) {
			elementsToUnselect.push(...matchedNodes);
		} else if (selectionType === SelectionType.ADD) {
			elementsToSelect.push(...matchedNodes.filter(":selectable:unselected"));
		}

		if (elementsToSelect.length > 0 || elementsToUnselect.length > 0) {
			const tool = SelectionTool.LASSO_RECT,
				type = getSelectionType(fromMouseEvent(event)),
				isLasso = !doUseRect;

			const addSelectionData: LassoRectSelectionActionData = {
					elementIds: elementsToSelect.map((ele) => ele.id()),
					isLasso,
				},
				removeSelectionData: LassoRectSelectionActionData = {
					elementIds: elementsToUnselect.map((ele) => ele.id()),
					isLasso,
				};

			const addSelectionAction = new AddSelectionAction(
					this.cy,
					tool,
					type,
					addSelectionData
				),
				removeSelectionAction = new RemoveSelectionAction(
					this.cy,
					tool,
					type,
					removeSelectionData
				);

			this.cy.emit("multiSelect", [addSelectionAction, removeSelectionAction]);
		}

		this.activated = false;
	}

	private distance = (point1: Point, point2: Point) => {
		const rectOnGraph = this.getCanvasPoints([point1, point2]);

		const dx = rectOnGraph[1][0] - rectOnGraph[0][0];
		const dy = rectOnGraph[1][1] - rectOnGraph[0][1];

		return Math.sqrt(dx * dx + dy * dy);
	};

	private getRectOpacity = (distance: number) => {
		return Math.max(
			Math.min(distance / (this.RECT_THRESHOLD + this.OFFSET), 0.7),
			0.3
		);
	};

	private getLassoOpacity = (distance: number) => {
		return Math.max(
			Math.min(1 - distance / (this.RECT_THRESHOLD + this.OFFSET), 0.7),
			0.3
		);
	};

	private render(): void {
		if (this.isDisabled) return;

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if (!this.activated) return;
		const style = this.cy.style();
		const pixelRatio = this.canvas.width / this.canvas.clientWidth;
		this.ctx.scale(pixelRatio, pixelRatio);
		const canvasPolygon = this.getCanvasPoints(this.polygon),
			canvasRect = this.getCanvasPoints(this.rect);

		const startEndDistance = this.distance(canvasRect[0], canvasRect[1]);

		const doUseLasso = startEndDistance < this.RECT_THRESHOLD;

		const lassoOpacity = this.getLassoOpacity(startEndDistance),
			rectOpacity = this.getRectOpacity(startEndDistance);
		// console.log(lassoOpacity, rectOpacity);

		if (canvasPolygon.length > 0)
			this.renderLasso(canvasPolygon, style, lassoOpacity, doUseLasso);
		if (canvasPolygon.length > 1)
			this.renderRect(canvasRect, style, rectOpacity, !doUseLasso);
	}

	private renderLasso(
		canvasPolygon: Point[],
		style: any,
		opacity: number,
		isActive: boolean
	): void {
		if (this.isDisabled) return;

		const color = isActive ? [200, 230, 240] : [155, 155, 155];
		const borderColor = isActive ? [100, 150, 180] : [100, 100, 100];
		const borderWidth = style.core("selection-box-border-width").value;

		this.ctx.beginPath();
		this.ctx.moveTo(canvasPolygon[0][0], canvasPolygon[0][1]);
		for (let position of canvasPolygon) {
			this.ctx.lineTo(position[0], position[1]);
		}
		if (borderWidth > 0) {
			this.ctx.lineWidth = borderWidth;
			this.ctx.strokeStyle = `rgba(${borderColor[0]}, ${borderColor[1]}, ${borderColor[2]}, ${opacity})`;
			this.ctx.stroke();
			this.ctx.closePath();
		}
		this.ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
		this.ctx.fill();

		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	private renderRect(
		canvasRect: Point[],
		style: any,
		opacity: number,
		isActive: boolean
	): void {
		if (this.isDisabled) return;

		const color = isActive ? [200, 230, 240] : [155, 155, 155];
		const borderColor = isActive ? [100, 150, 180] : [100, 100, 100];
		const borderWidth = style.core("selection-box-border-width").value;

		const start = this.getCanvasRectPosition(canvasRect[0]);
		const end = this.getCanvasRectPosition(canvasRect[canvasRect.length - 1]);

		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.beginPath();
		this.ctx.moveTo(start[0], start[1]);
		this.ctx.lineTo(start[0], end[1]);
		this.ctx.lineTo(end[0], end[1]);
		this.ctx.lineTo(end[0], start[1]);
		this.ctx.lineTo(start[0], start[1]);
		this.ctx.closePath();
		this.ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
		this.ctx.fill();

		if (borderWidth > 0) {
			this.ctx.lineWidth = borderWidth;
			this.ctx.strokeStyle = `rgba(${borderColor[0]}, ${borderColor[1]}, ${borderColor[2]}, ${opacity})`;
			this.ctx.stroke();
		}
	}

	private getCanvasRectPosition(clientPosition: Point): Point {
		const zoom = this.canvas.offsetWidth / this.canvas.width;
		const canvasPosition: Point = [
			clientPosition[0] / zoom,
			clientPosition[1] / zoom,
		];
		return canvasPosition;
	}

	private getGraphPosition(clientPosition: Point): Point {
		const graphPosition = this.cy
			.renderer()
			.projectIntoViewport(clientPosition[0], clientPosition[1]);
		return graphPosition;
	}

	private getCanvasPoints(clientPolygon: Point[]): Point[] {
		const canvasPolygon = clientPolygon.map((clientPosition) =>
			getPointInCy(clientPosition, this.cy)
		);
		return canvasPolygon;
	}

	private getGraphPolygon(clientPolygon: Point[]): Point[] {
		const graphPolygon = clientPolygon.map((clientPosition) =>
			this.getGraphPosition(clientPosition)
		);
		return graphPolygon;
	}

	private getGraphRect(clientRect: Point[]): Rect {
		const graphRect: Rect = [
			this.getGraphPosition(clientRect[0]),
			this.getGraphPosition(clientRect[clientRect.length - 1]),
		];

		return graphRect;
	}

	private isPointInRect(point: Point, rect: Rect): boolean {
		const [x, y] = point;
		const [[x1, y1], [x2, y2]] = rect;

		return (
			x >= Math.min(x1, x2) &&
			x <= Math.max(x1, x2) &&
			y >= Math.min(y1, y2) &&
			y <= Math.max(y1, y2)
		);
	}
}
