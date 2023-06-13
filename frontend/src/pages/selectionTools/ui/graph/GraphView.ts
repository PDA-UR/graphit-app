import { GraphModel } from "./GraphModel";
import cytoscape, { Core } from "cytoscape";
import { View } from "../../../../shared/ui/View";

import interestedNormal from "../../icons/interested_normal.svg";
import { ActionManager } from "../../../../shared/extensions/undo/ActionManager";
import { Action } from "../../../../shared/extensions/undo/actions/Action";

export interface GraphViewOptions extends cytoscape.CytoscapeOptions {
	extensions?: any[];
}

const nodeSize = (ele: any) => {
	const degree = ele.degree();
	return 7 + degree * 7;
};

const DEFAULT_OPTIONS: GraphViewOptions = {
	layout: {
		name: "dagre",
	},
	style: [
		{
			selector: "node",
			style: {
				"background-color": "#666",
				label: "data(label)",
				width: nodeSize,
				height: nodeSize,
			},
		},
		{
			selector: "node:selected",
			style: {
				"border-width": "3px",
				"border-color": "#000000",
			},
		},
		{
			selector: "node[completed = 'true']",
			style: {
				"background-color": "#6DBB6D",
			},
		},
		{
			selector: "edge",
			style: {
				width: 3,
				"line-color": "#ccc",
				"target-arrow-color": "#ccc",
				"target-arrow-shape": "triangle",
				"curve-style": "bezier",
			},
		},
	],
};

export enum GraphViewEvents {
	SELECTION_CHANGED = "selectionChanged",
}

export class GraphView extends View {
	private readonly cy: Core;
	private readonly $container: HTMLElement;
	private readonly actionManager: ActionManager;

	constructor(
		model: GraphModel,
		$container: HTMLElement,
		options: GraphViewOptions
	) {
		super();

		if (options.extensions) this.loadExtensions(options.extensions);
		this.$container = $container;
		this.cy = cytoscape({
			container: this.$container,
			elements: model,
			...DEFAULT_OPTIONS,
			...options,
		});

		this.cy.nodeHtmlLabel([
			{
				query: "node",
				halign: "center",
				valign: "center",
				halignBox: "center",
				valignBox: "center",
				tpl: this.getBadge,
			},
		]);

		(this.cy as any).lassoSelectionEnabled(true);
		this.actionManager = (this.cy as any).undoRedo();
		console.log(this.actionManager);

		this.cy.on("select", "node", (event: any) => {
			const numSelectedNodes = this.cy.$(":selected").length;
			this.emit(GraphViewEvents.SELECTION_CHANGED, numSelectedNodes);
		});

		this.cy.on("unselect", "node", (event: any) => {
			const numSelectedNodes = this.cy.$(":selected").length;
			this.emit(GraphViewEvents.SELECTION_CHANGED, numSelectedNodes);
		});
	}

	private getBadge = (data: any) => {
		const badges = [];

		if (data.interested === "true")
			badges.push(
				"<div class='badge'><img src='" + interestedNormal + "'/></div>"
			);

		return `<div class="badges">${badges.join("")}</div>`;
	};

	private loadExtensions(extensions: any[]) {
		extensions.forEach((extension) => {
			cytoscape.use(extension);
		});
	}

	private toggleGrabMode(on: boolean) {
		this.cy.panningEnabled(on);
		this.cy.userPanningEnabled(on);
		this.cy.boxSelectionEnabled(!on);

		if (on) {
			this.cy.nodes().ungrabify();
			this.cy.nodes().unselectify();
		} else {
			this.cy.nodes().grabify();
			this.cy.nodes().selectify();
		}
	}

	setGrabMode() {
		this.toggleGrabMode(true);
	}

	setMouseMode() {
		this.toggleGrabMode(false);
	}

	getSelectedNodes() {
		return this.cy.$(":selected");
	}

	getCy() {
		return this.cy;
	}

	do(action: Action) {
		this.actionManager.do(action);
	}

	undo(): Action | null {
		return this.actionManager.undo();
	}

	redo(): Action | null {
		return this.actionManager.redo();
	}

	getWikibaseActions() {
		return this.actionManager.getWikibaseActions();
	}

	clearActions() {
		this.actionManager.clear();
	}
}
