import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
// import dblclick from "cytoscape-dblclick"; //brauchts nicht
import { BubbleSetsPlugin }  from "cytoscape-bubblesets"; // https://github.com/upsetjs/cytoscape.js-bubblesets
import { GraphViewOptions } from "../../propertyEditor/ui/graph/GraphView";
import { GraphEventController } from "../ui/EventController";
import { eventBus } from "../../propertyEditor/global/EventBus";
import { ElementDefinition } from "cytoscape";
import * as layoutOps from "../design/gLayout";

cytoscape.use(fcose);
//cytoscape.use(BubbleSets);
//cytoscape.use(dblclick);

// Bundles all changes to the Graph + Layout

const nodeSize = (ele: any) => {
	const degree = ele.degree();
	return 7 + degree * 7;
};

const DEFAULT_OPTIONS: GraphViewOptions = {
    layout: layoutOps.fcoseOptions,
    style: [
        // NODES:
        { selector: 'node',
        style: { // Show node with label
            'label': 'data(label)',
            'text-wrap': 'wrap',
            'text-max-width': '100',
            'border-color': "#666",
            'width': nodeSize,
            'height': nodeSize,
            }
        },
        // in State :selected
        { selector: ':selected',
        style: {
                'background-color': 'black',
            }
        },
        // Highlight connected nodes (pointed towards) 
        { selector: '.highlight-node-out',
        style: {
            'background-color': '#444444',
            }
        },
        // For resource-nodes:
        { selector:'.node-resource',
        style: {
            'background-color': 'orange', //Change that
            'shape': 'round-rectangle'
            }
        },

        // EDGES:
        { selector: 'edge',
        style: {
            'target-arrow-shape': 'triangle',
            'curve-style': 'straight',
            'events': 'no',
            }
        },
        // Highlight outgoing edges on node selection
        { selector: '.highlight-edge-out',
        style: {
            //'line-color': 'black',
            'line-fill': 'linear-gradient',
            'target-arrow-color': '#444444',
            'width': 5,
            'z-compound-depth': 'top',
            'line-gradient-stop-colors': ['black', '#444444'],
            }
        },
        // For resource-edge:
        { selector:'.edge-resource',
        style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
            'line-color': 'orange',
            'target-arrow-shape': 'tee',
            'target-arrow-color': 'orange',
            }
        },

        // PARENTS:
        { selector: ':parent',
        style: {
            'background-opacity': 0.333,
            'border-color': 'blue',
            'label': 'data(id)',
            'events': 'yes',
            }
        },
        // hide parents in graph
        { selector: '.hide',
        style: {
            'background-opacity': 0,
            'border-width': 0,
            'label': '',
            'events': 'no',
            }
        },
        { selector: '.bubbleSet',
        style: {
            'background-color': 'blue',
            'background-opacity': 0.2,
            'label': 'data(id)'
            }
        }

    ]
};

const HIGHLIGHT_CLASSES = ['.highlight-edge-out'];

export class MainGraph {
    private readonly cy: any;
    private readonly $container: HTMLElement;
    private hasFiredEvent: Boolean = false;
    private readonly bb: BubbleSetsPlugin;
    
    constructor(
        model: ElementDefinition[],
        $container: HTMLElement,
    ) {
        this.$container = $container;
        this.cy = cytoscape({
            container: this.$container,
            elements: model,
            ...DEFAULT_OPTIONS,
        });
        this.cy.$("edge").lock(); // Make edges immutable
        this.cy.$("node[url]").toggleClass("node-resource", true);
        this.cy.$("node[url]").connectedEdges().toggleClass("edge-resource", true);

        const graphEventConroller = new GraphEventController(this.cy);
        this.initGraphEvents();
        this.bb = new BubbleSetsPlugin(this.cy);
    };

    private initGraphEvents() {
        eventBus.on(
            "openItemPage", this.openItemPage
        );
        eventBus.on(
            "click", this.highlightClicked
        );
    }

    // ---- Graph Events ----

    // Open-Item-Page-Event
    public openItemPage = (target:any, timestamp:Date) => {
        if(!this.hasFiredEvent) {
            console.log("dbclick on", target);
            if(target.isNode()) {
                window.open(target.data("id"), "_blank")?.focus();
                this.hasFiredEvent = true;
            }
        } else this.hasFiredEvent = false;
    };

    // Highlight Nodes & Edges on selection -> use batch for simple styleing functions 
    // cy.batch(function(){ });
    private highlightClicked = (target:any) => {
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
                this.toggleParentVisibility(true)
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
            default:
                this.cy.layout(DEFAULT_OPTIONS).run();
        }
    };

    private toggleParentVisibility(show:Boolean) {
        const parents = this.cy.$(":parent");
        if(show) {
            //this.cy.$(":parent").unselectify();
            this.cy.$(":parent").toggleClass("hide", false);
        } else if (!show) {
            this.cy.$(":parent").toggleClass("hide", true);
        }
        //this.cy.elements().nodes().descendants().move({parent:null});
    }

    // Toggle BubbleSets for Parents
    // HOW TO STYLE BUBBLESETS ?
    public toggleBubbleSet = (toggleVar:any) => {
        //const bb = new BubbleSetsPlugin(this.cy); // init BubbleSet
        if(toggleVar.checked) {
            this.toggleParentVisibility(false);
            this.cy.ready(() => this.initBubbleSets());
        } else {
            const paths = this.bb.getPaths(); // finds no active paths
            // console.log(paths);
            paths.forEach(path => {
                this.bb.removePath(path);
            });
            // TODO: make true only if layout is appropriate
            this.toggleParentVisibility(true);
        }
    };

    private initBubbleSets() {
        //const bb = new BubbleSetsPlugin(this.cy);
        const parents = this.cy.$(":parent") as any;
        parents.forEach((parent: { descendants: () => any; }) => {
            // PROBLEM: Funktioniert noch nicht mit allen
            console.log("bb-parents", parent);
            const childs = parent.descendants();
            this.bb.addPath(childs, childs.edgesWith(childs), null);
        });
        /* EXAMPLE -> STYLE: events: yes
        bb.addPath(atp, null, cy.nodes().diff(atp).left, {
          virtualEdges: true,
          style: {
            fill: 'rgba(255, 0, 0, 0.2)',
            stroke: 'red',
        },*/
        // NOTE: Labels müssten mit dem Layer plugin erstellt werden, wird sonst nicht unterstützt
    }

}
