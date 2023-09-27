import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import cise from "cytoscape-cise";
import layoutUtilities from "cytoscape-layout-utilities";
import { BubbleSetsPlugin } from "cytoscape-bubblesets"; // https://github.com/upsetjs/cytoscape.js-bubblesets
import { GraphEventController } from "../ui/EventController";
import { ElementDefinition } from "cytoscape";
import * as layoutOps from "../design/gLayout";
import { vizEventBus } from "../VizEventBus";
// https://stackoverflow.com/questions/59002953/how-to-get-cytoscape-to-place-separate-node-groups-closer-and-avoid-overlapping

// Register extensions:
cytoscape.use(fcose);
cytoscape.use(cise);
cytoscape.use(layoutUtilities); //Make toggleables
//cytoscape.use(BubbleSets);

// Bundles all changes to the Graph + Layout

const nodeSize = (ele: any) => {
	const degree = ele.degree();
	return 7 + degree * 7;
};

const DEFAULT_OPTIONS = {
	layout: layoutOps.fcoseOptions,
	style: [
		// NODES:
		{
			selector: "node",
			style: {
				// Show node with label
				label: "data(label)",
				"text-wrap": "wrap",
				"text-max-width": "100",
				"border-color": "#666",
				width: nodeSize,
				height: nodeSize,
			},
		},
		// in State :selected
		{
			selector: ":selected",
			style: {
				"background-color": "black",
			},
		},
		// Highlight connected nodes (pointed towards)
		{
			selector: ".highlight-node-out",
			style: {
				"background-color": "#444444",
			},
		},
		// For resource-nodes:
		{
			selector: ".node-resource",
			style: {
				"background-color": "orange", //Change that
				shape: "round-rectangle",
			},
		},
		// Highlight a searched node
		{
			selector: ".searched",
			style: {
				"border-color": "red",
				"border-width": 3,
				"border-style": "dashed",
			},
		},

		// EDGES:
		{
			selector: "edge",
			style: {
				"target-arrow-shape": "triangle",
				"curve-style": "straight",
				events: "no",
			},
		},
		// Highlight outgoing edges on node selection
		{
			selector: ".highlight-edge-out",
			style: {
				//'line-color': 'black',
				"line-fill": "linear-gradient",
				"target-arrow-color": "#444444",
				width: 5,
				"z-compound-depth": "top",
				"line-gradient-stop-colors": ["black", "#444444"],
			},
		},
		// For resource-edge:
		{
			selector: ".edge-resource",
			style: {
				"line-style": "dashed",
				"line-dash-pattern": [6, 3],
				"line-color": "orange",
				"target-arrow-shape": "tee",
				"target-arrow-color": "orange",
			},
		},

		// PARENTS:
		{
			selector: ":parent",
			style: {
				"background-opacity": 0.333,
				"border-color": "blue",
				label: "data(id)",
				events: "yes",
			},
		},
		// hide parents in graph
		{
			selector: ".hide",
			style: {
				"background-opacity": 0,
				"border-width": 0,
				label: "",
				events: "no",
			},
		},
		{
			selector: ".bubbleSet",
			style: {
				"background-color": "blue",
				"background-opacity": 0.2,
				label: "data(id)",
			},
		},
	],
};

const LAYOUT_UTIL_OPS = {
	desiredAspectRatio: 1,
	polynominalGridSizFactor: 1,
	utilityFunction: 1,
	componentSpacing: 0,
};

export class MainGraph {
	private readonly cy: any;
	private readonly $container: HTMLElement;
	private hasFiredEvent: Boolean = false;
	private readonly bb: BubbleSetsPlugin;

	constructor(model: ElementDefinition[], $container: HTMLElement) {
		// INIT cytoscape
		this.$container = $container;
		// @ts-ignore
		this.cy = cytoscape({
			container: this.$container,
			elements: model,
			...DEFAULT_OPTIONS,
		});

		/* SET FURTHER GRAPH OPTIONS */
		this.cy.$("edge").lock(); // Make edges immutable
		// Style edges to resources
		this.cy.$("node[url]").toggleClass("node-resource", true);
		this.cy.$("node[url]").connectedEdges().toggleClass("edge-resource", true);

		// Events
		const graphEventConroller = new GraphEventController(this.cy);
		this.initGraphEvents();

		// Init extensions and their options
		this.bb = new BubbleSetsPlugin(this.cy);
	}

	// ---- Graph Events ----

	private initGraphEvents() {
		vizEventBus.on("openItemPage", this.openItemPage);
		vizEventBus.on("click", this.highlightClicked);
		vizEventBus.on("searchNode", this.searchForNode);
	}

	// Open-Item-Page-Event
	public openItemPage = (target: any) => {
		if (!this.hasFiredEvent) {
			console.log("dbclick on", target);
			if (target.isNode()) {
				window.open(target.data("id"), "_blank")?.focus();
				this.hasFiredEvent = true;
			}
		} else this.hasFiredEvent = false;
	};

	// Highlight Nodes & Edges on selection -> use batch for many simple styling functions
	// cy.batch(function(){ });
	private highlightClicked = (target: any) => {
		target.select();
		console.log("clicked ", target.label);
		this.cy.elements().removeClass("highlight-edge-out highlight-node-out"); //array or space separated string
		//this.cy.elements().edges().toggleClass("highlight-edge-out", false);
		target.outgoers().edges().toggleClass("highlight-edge-out", true);
		target.outgoers().nodes().toggleClass("highlight-node-out", true);
	};

	// ---- Menu Events & Util-Functions ----

	// Switch-Layout-Event
	public switchLayout = (option: string) => {
		console.log("switch Layout: ", option);
		switch (option) {
			case "fcose":
				this.toggleParentVisibility(true);
				this.cy.layout(layoutOps.fcoseOptions).run();
				break;
			case "breadth":
				this.toggleParentVisibility(false);
				this.cy.layout(layoutOps.breadthOptions).run();
				break;
			case "concentric":
				this.toggleParentVisibility(false);
				this.cy.layout(layoutOps.concOptions).run();
				break;
			case "cise":
				// WORKS -> TODO: IMPROVE
				this.toggleParentVisibility(true);
				// clusters = [[c1.1, c1.2], [c2.1, c2.2], ...]
				const parents = this.cy.$(":parents");
				let clusters = [] as Array<any>;
				parents.forEach((parent: { descendants: () => any[] }) => {
					let p = [] as Array<string>;
					parent.descendants().forEach((child) => {
						p.push(child.id());
					});
					clusters.push(p);
				});
				console.log(clusters);
				this.cy
					.layout({
						name: "cise",
						clusters: clusters,
						nodeSeparation: 20,
					})
					.run();
			default:
				this.cy.layout(DEFAULT_OPTIONS).run();
		}
	};

	private toggleParentVisibility(show: Boolean) {
		const parents = this.cy.$(":parent");
		if (show) {
			//this.cy.$(":parent").unselectify();
			this.cy.$(":parent").toggleClass("hide", false);
		} else if (!show) {
			this.cy.$(":parent").toggleClass("hide", true);
		}
		//this.cy.elements().nodes().descendants().move({parent:null});
	}

	// Toggle BubbleSets for Parents
	// HOW TO STYLE BUBBLESETS ?
	public toggleBubbleSet = (toggleVar: any) => {
		//const bb = new BubbleSetsPlugin(this.cy); // init BubbleSet
		if (toggleVar.checked) {
			this.toggleParentVisibility(false);
			this.cy.ready(() => this.initBubbleSets());
		} else {
			const paths = this.bb.getPaths(); // finds no active paths
			// console.log(paths);
			paths.forEach((path) => {
				this.bb.removePath(path);
			});
			// TODO: make true only if layout is appropriate
			this.toggleParentVisibility(true);
		}
	};

	private initBubbleSets() {
		//const bb = new BubbleSetsPlugin(this.cy);
		const parents = this.cy.$(":parent") as any;
		parents.forEach((parent: { descendants: () => any }) => {
			// PROBLEM: Funktioniert noch nicht mit allen
			console.log("bb-parents", parent);
			const childs = parent.descendants();
			this.bb.addPath(childs, childs.edgesWith(childs), null, {
				virtualEdges: true,
				style: {
					fill: "grey",
					opacity: "0.333",
					stroke: "blue",
					pointerEvents: "yes",
					// NOTE: Labels not supported -> use layers plugin
				},
			});
		});
	}

	// If a node is search, zoom to it and highight it shortly
	private searchForNode = (e: any) => {
		const input = (document.getElementById("searchInput") as HTMLInputElement)
			.value;
		if (!input) {
			console.log("nothing entered");
			return;
		}
		let filter = this.cy.$("node[label = '" + input + "']");
		//const filter = this.cy.$("node[label = '" + input + "']");
		let el = this.cy.getElementById(filter.id());
		if (el.id() == undefined) {
			console.log("Node doesn't exist");
			return;
		}
		// zoom to position of node
		this.cy.zoom({
			level: 1.5,
			position: el.position(),
		});
		el.flashClass("searched", 2000); // hightlight node for 2000ms
	};

	// Can't really see a difference with this
	public togglePacking = (toggleVar: any) => {
		if (toggleVar.checked) {
			this.cy.layout(layoutOps.fcoseOptions).run();
		} else return;
	};
}
