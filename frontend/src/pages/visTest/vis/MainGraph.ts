import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import dblclick from "cytoscape-dblclick";
import { GraphViewOptions } from "../../propertyEditor/ui/graph/GraphView";
import { GraphEventController } from "../ui/EventController";
import { eventBus } from "../../propertyEditor/global/EventBus";
import { ElementDefinition } from "cytoscape";
import * as layoutOps from "../design/gLayout";

cytoscape.use(fcose);
cytoscape.use(dblclick);

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
        // EDGES:
        { selector: 'edge',
        style: {
            'target-arrow-shape': 'triangle',
            'curve-style': 'straight'
            }
        },
        // PARENTS:
        { selector: ':parent',
        style: {
            'background-opacity': 0.333,
            'border-color': 'blue',
            'label': 'data(id)'
            }
        },
        // hide parents in graph
        { selector: '.hide',
        style: {
            'background-opacity': 0,
            'border-width': 0,
            'label': ''
            }
        },

    ]
};

export class MainGraph {
    private readonly cy: any;
    private readonly $container: HTMLElement;
    private hasFiredEvent: Boolean = false;
    
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
        this.cy.$("edge").unselectify(); // Make edges immutable

        const graphEventConroller = new GraphEventController(this.cy);
        this.initEvents();
    };

    private initEvents() {
        eventBus.on(
            "openItemPage", this.openItemPage
        );
    }

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
            this.cy.$(":parent").toggleClass("hide", false);
        } else if (!show) {
            this.cy.$(":parent").toggleClass("hide", true);
        }
        //this.cy.elements().nodes().descendants().move({parent:null});
    }

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

}
