import cytoscape from "cytoscape";
import { INFO_NODES } from "../../../graphVis/global/data/infoNodes";
import cytoscapeDagre from "cytoscape-dagre";
import { stylesheet } from "../../global/Stylesheet";
import { pathLayout } from "./PathLayout";
import { GLOBALS } from "../../../graphVis/global/config";
import cytoscapeFcose from "cytoscape-fcose";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import { ExperimentGraphViewEvents } from "../experiment/graph/ExperimentGraphView";

/**
 * A separate cytoscape core to show a 
 * small learning path for a specific node
 * because there can't be separate graphs on one
 */
export class PathViewGraph {
    
    private readonly cy: cytoscape.Core | any;
    private readonly $container: HTMLDivElement;
    // private readonly layoutOptions: cytoscapeDagre.DagreLayoutOptions;
    private layoutOptions: any;

    constructor() {
        // initialise use of extension for the separate cytoscape core instance
        cytoscape.use(cytoscapeDagre)
        cytoscape.use(cytoscapeFcose)

        this.$container = document.getElementById("path-container") as HTMLDivElement;
        this.layoutOptions = pathLayout
        // this.layoutOptions = GLOBALS.courseLayout;

        // create a new cytoscape instance, as it can only use 1 container
        this.cy = cytoscape({
            container: this.$container,
            style: stylesheet,
            elements: INFO_NODES,
            layout: this.layoutOptions,
        });
        // on init container has different dimensions, because it's closed
        this.cy.pan({x: 100, y:200})
        this.cy.zoom({level: 2.5})
        console.log(this.cy.width(), this.cy.height())
        this.initGraphEvents()
    }

    public getPathCore() {
        return this.cy;
    }

    // Events exclusive for the path graph
    private initGraphEvents() {
        this.cy.on("mouseover", "node", this.onHoverNode);
		this.cy.on("mouseout", "node", this.onHoverNodeEnd);
        // this.cy.on("scrollzoom", "cy", this.zoom)
    }

    public showPath(target:cytoscape.NodeSingular) {
        // let path = target.closedNeighborhood() 
        target.removeClass("indicated") // BUG: otherwise style will show (stays over from interaction with normal graph)
        this.cy.remove(this.cy.elements())
        
        // IDEA: if successor/incomers to many -> use a grid layout on the as a collection

        // let path = target.successors();

        // path = path.union(target.incomers())
        // path = path.union(target)
        
        // path.forEach(node => {
        //     node.data("degree", node.degree(false))
        // });
        // this.cy.add(path)
        
        let successors = target.successors() as cytoscape.NodeCollection;
        let incomers = target.incomers() as cytoscape.NodeCollection;

        this.cy.add(target)
        this.cy.add(successors)
        incomers = this.cy.add(incomers)

        this.cy.layout(this.layoutOptions).run()

        console.log("s", successors.length, "i", incomers.length)

        // works
        if(incomers.length >= 10) { // only incomers of the same level?
            incomers.layout(GLOBALS.gridLayout).run()
            // TODO: better grid layout 
            // keep target in the middle 
            // put incomers above target
        } 
        
    }

    // TODO: styling
    // TODO: interaction between graphs
    // TODO: interaction with path (zoom, highlight neighbors)
    // TODO: graph editing

    /* -- EVENTS -- */

    private onHoverNode = (event:any) => {
        const node = event.target! as cytoscape.NodeSingular;
        node.addClass("indicated");
        
        experimentEventBus.emit(
            ExperimentGraphViewEvents.INDICATE_NODE_START, 
            node.id()
        );

    }
    
    private onHoverNodeEnd = (event:any) => {
        const node = event.target! as cytoscape.NodeSingular;
        node.removeClass("indicated");

        experimentEventBus.emit(
            ExperimentGraphViewEvents.INDICATE_NODE_END, 
            node.id()
        );
    }
}