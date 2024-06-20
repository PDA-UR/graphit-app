import cytoscape from "cytoscape";
import { GLOBALS } from "../../../graphVis/global/config";
import { INFO_NODES } from "../../../graphVis/global/data/infoNodes";
import cytoscapeDagre from "cytoscape-dagre";
import { stylesheet } from "../../global/Stylesheet";

/**
 * A separate cytoscape core to show a 
 * small learning path for a specific node
 * because there can't be separate graphs on one
 */
export class PathViewGraph {
    
    private readonly cy: cytoscape.Core | any;
    private readonly $container: HTMLDivElement;

    constructor() {
        this.$container = document.getElementById("path-view") as HTMLDivElement;
        cytoscape.use(cytoscapeDagre)
        this.cy = cytoscape({
            container: this.$container,
            style: stylesheet,
            elements: INFO_NODES,
            layout: GLOBALS.dagre,
        });
        // on itit container has different dimensions
        this.cy.pan({x: 100, y:200})
        this.cy.zoom({level: 2.5})
        console.log(this.cy.width(), this.cy.height())
        this.initGraphEvents()
    }

    // Events exclusive for the path graph
    private initGraphEvents() {
        this.cy.on("mouseover", "node", this.onHoverNode);
		this.cy.on("mouseout", "node", this.onHoverNodeEnd);
    }

    public showPath(target:cytoscape.NodeSingular) {
        // let path = target.closedNeighborhood() 
        target.removeClass("indicated") // BUG: otherwise style will show (stays over from interaction with normal graph)
        
        let path = target.successors()
        path = path.union(target.incomers())
        path = path.union(target)
        
        path.forEach(node => {
            node.data("degree", node.degree(false))
            // console.log(node.degree(false))
        });
        
        this.cy.remove(this.cy.elements())

        this.cy.add(path)
        this.cy.layout(GLOBALS.dagre).run()
    }

    // TODO: styling
    // TODO: interaction between graphs
    // TODO: interaction with path

    /* -- EVENTS -- */

    private onHoverNode = (event:any) => {
        const node = event.target! as cytoscape.NodeSingular;
        node.addClass("indicated");
    }

    private onHoverNodeEnd = (event:any) => {
        const node = event.target! as cytoscape.NodeSingular;
        node.removeClass("indicated");
    }
}