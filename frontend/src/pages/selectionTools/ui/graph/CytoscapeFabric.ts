import cytoscape from "cytoscape-select";

import fcose, { FcoseLayoutOptions } from "cytoscape-fcose";

import dagre from "cytoscape-dagre";
import nodeHtmlLabel from "cytoscape-node-html-label";
import lasso from "../../../../shared/extensions/lasso-rectangle/lasso";
import undo from "../../../../shared/extensions/undo/undo";
import { GLOBALS } from "../../../graphVis/global/config";
import { stylesheet } from "../../global/Stylesheet";

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

export const DEFAULT_OPTIONS: any = {
	layout: {
		name: 'fcose',
		// @ts-ignore
		randomize: false,
		animate: true,
		fit: true, 
		packComponents: false,
		padding: 5,
		nodeDimensionsIncludeLabels: true,
		avoidOverlap: true,
		nodeRepulsion: 5500,
		// @ts-ignore
		idealEdgeLength: 150,
		// @ts-ignore
		edgeElasticity: 0.3,
		nestingFactor: 0.1,
		tile: true,
	},
	//GLOBALS.courseLayout,
	style: stylesheet,
	selectionType: "single",
};

const EXPERIMENT_STYLE: any[] = [
	//
	{
		selector: "edge.incoming, edge.outgoing",
		style: {
			"line-fill": "linear-gradient",
			// @ts-ignore
			"line-gradient-stop-positions": "0 100%",
			// @ts-ignore
			"line-gradient-stop-colors": "black #FEDD00",
			"target-arrow-color": "#FEDD00",
			"width": 4,
			"mid-target-arrow-shape": "triangle",
			"mid-target-arrow-color": "#7F6F00",
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
