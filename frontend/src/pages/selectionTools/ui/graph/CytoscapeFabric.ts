import cytoscape from "cytoscape-select";

import fcose, { FcoseLayoutOptions } from "cytoscape-fcose";

import dagre from "cytoscape-dagre";
import nodeHtmlLabel from "cytoscape-node-html-label";
import lasso from "../../../../shared/extensions/lasso-rectangle/lasso";
import undo from "../../../../shared/extensions/undo/undo";
import { GLOBALS } from "../../../graphVis/global/config";

export const getExperimentCy = (elements: any[]) => {
	const $cyContainer = document.getElementById("experiment-cy")!;
	const extensions = [fcose, dagre, nodeHtmlLabel, lasso, undo];
	loadExtensions(extensions);
	const mergedStyle = [
		...(DEFAULT_OPTIONS.style as any[]),
		...EXPERIMENT_STYLE,
	];
	const cy = cytoscape({
		container: $cyContainer,
		elements: elements as any,
		...DEFAULT_OPTIONS,
		style: mergedStyle,
	});

	return cy;
};

export const getControlCy = (elements: any[]) => {
	const $cyContainer = document.getElementById("control-cy")!;
	const extensions = [fcose, dagre, nodeHtmlLabel, undo];

	loadExtensions(extensions);
	const mergedStyle = [...(DEFAULT_OPTIONS.style as any[]), ...CONTROL_STYLE];
	const cy = cytoscape({
		container: $cyContainer,
		elements: elements as any,
		...DEFAULT_OPTIONS,
		style: mergedStyle,
	});

	cy.style().selector("core").style({
		// @ts-ignore
		"selection-box-color": "#c8e6f0",
	});

	cy.style().selector("core").style({
		// @ts-ignore
		"selection-box-border-color": "#6496b4",
	});
	return cy;
};

function loadExtensions(extensions: any[]) {
	extensions.forEach((extension) => {
		cytoscape.use(extension);
	});
}

const nodeSize = (ele: any) => {
	let degree = ele.degree();
	if(degree == 0) {
		degree = 1;
	}
	return 7 + degree * 7;
};

export const DEFAULT_OPTIONS: cytoscape.CytoscapeOptions = {
	layout: GLOBALS.courseLayout,

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
				// BLUE select
				"background-color": "#257AFD",
				"text-background-color": "#81b3ff",
				"text-background-opacity": 1,
				"text-background-shape": "roundrectangle",
				"text-background-padding": "3px",
			},
		},
		// edges of selected nodes
		{
			selector: "node[label]",
			style: {
				// @ts-ignore
				"text-margin-y": "-8px",
			},
		},
		{
			selector: "node.indicated[label]",
			style: {
				"z-index": 9999999999,
			},
		},
		{
			selector: "node[completed = 'true']",
			style: {
				"background-color": "#6DBB6D",
			},
		},
		{
			selector: "node[interested = 'true']",
			style: {
				"shape": "star",
			}
		},
		{ // only style goals, that are not yet completed
			selector: "node[goal = 'true']",
			style: { // NOTE: background-image handled in CytoscapeExtension.ts
				"background-color": "#BE234F", //#FF5484
				"z-index": 0,
			},
		},
		{ // style goals that have been completed (othwise doesn't style)
			selector: "node[goal = 'true'][completed = 'true']",
			style: { // NOTE: background-image handled in CytoscapeExtension.ts
				"border-width": "3px",
				"border-color": "#BE234F",
				"background-color": "#6DBB6D", 
				"z-index": 0,
				// combines both styles
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

		{
			selector: "node.last-clicked",
			style: {
				backgroundColor: "#474747",
				"border-width": "7px",
				"border-color": "black",
			},
		},
		{
			selector: "node:selected.last-clicked",
			style: {
				backgroundColor: "#4377c6",
			},
		},
		{
			selector: "node.indicated",
			style: {
				"border-color": "#FEDD00",
				"border-width": "3px",
				"text-background-color": "#FEDD00",
				"text-background-opacity": 1,
				"z-index": 10,
			},
		},
		{
			selector: ".dimmed, .path-dimmed",
			style: {
				opacity: 0.4,
			},
		},
		{
			selector: ".filter-fade",
			style: {
				opacity: 0.4,
			},
		},

	],
	selectionType: "single",
};

const EXPERIMENT_STYLE: any[] = [
	//
	{
		selector: ".incoming, .outgoing",
		style: {
			"line-fill": "linear-gradient",
			// @ts-ignore
			"line-gradient-stop-positions": "0 100%",
			// @ts-ignore
			"line-gradient-stop-colors": "black #FEDD00",
			"target-arrow-color": "#FEDD00",
		},
	},

	{
		selector: ".neighbor",
		style: {
			// color: "white",
			// "text-background-color": "black",
			// "text-background-opacity": 1,
			"z-index": 10,
			// "background-color": "black",
		},
	},
	{
		selector: ".path-highlight-inactive",
		style: {
			opacity: 0.85,
			"line-color": "#666",
			"target-arrow-color": "#666",
		},
	},
	{
		selector: ".path-highlight-active",
		style: {
			"border-width": "3px",
			"border-color": "#FEDD00",
			"border-opacity": 1,

			"line-color": "#FEDD00",
			"target-arrow-color": "#FEDD00",

			opacity: 1,
		},
	},
];

const CONTROL_STYLE: any[] = [];
