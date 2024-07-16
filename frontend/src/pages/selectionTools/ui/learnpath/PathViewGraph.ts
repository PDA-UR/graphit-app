import cytoscape from "cytoscape";
import { INFO_NODES } from "../../../graphVis/global/data/infoNodes";
import cytoscapeDagre from "cytoscape-dagre";
import { stylesheet } from "../../global/Stylesheet";
import { pathLayout, fcoseLayout } from "./PathLayout";
import cytoscapeFcose from "cytoscape-fcose";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import { ExperimentGraphViewEvents } from "../experiment/graph/ExperimentGraphView";
import { PropertyEditAction } from "../propertyModal/PropertyModalController";
import { GraphViewEvents } from "../graph/GraphView";

export enum PathViewEvents {
    NODE_SELECT = "nodeSelect", // select the same item in both graphs (don't change path-layout)
    PROPERTY_ACTION_CLICKED = "propertyActionClicked",
}

/**
 * A separate cytoscape core to show a 
 * small learning path for a specific node
 * because there can't be separate graphs on one
 */
export class PathViewGraph {
    
    private readonly cy: cytoscape.Core | any;
    private readonly $container: HTMLDivElement;
    private layoutOptions: any;
    private isPanning: boolean = false;
    private selectedNode: any;

    constructor() {
        // initialise use of extension for the separate cytoscape core instance
        cytoscape.use(cytoscapeDagre)
        cytoscape.use(cytoscapeFcose)

        this.$container = document.getElementById("path-container") as HTMLDivElement;
        this.layoutOptions = pathLayout;

        // create a new cytoscape instance, as 1 core can only draw to 1 container
        this.cy = cytoscape({
            container: this.$container,
            style: stylesheet,
            elements: INFO_NODES,
            layout: this.layoutOptions,
        });
        // on init the container has different dimensions, because it's closed
        this.cy.pan({x: 100, y:200})
        this.cy.zoom({level: 2.5})

        this.initGraphEvents()
    }

    public getPathCore() {
        return this.cy;
    }

    // Events exclusive for the path graph
    private initGraphEvents() {
        // TODO: mirror graph interaction of main core (i.e. drag with right mb) -> creates bugs :(
        // window.addEventListener("mousedown", this.onMouseDown);
        // window.addEventListener("mouseup", this.onMouseUp);
        // window.addEventListener("mousemove", this.onMouseMove);
        // this.cy.on("click", "cy", this.onCanvasClick)

        // this.cy.on("multiSelect", this.onMultiSelect);
        experimentEventBus.addListener(
            GraphViewEvents.PATH_SELECTION_CHANGED,
            this.onSelectionChanged
        );

        this.cy.on("mouseover", "node", this.onHoverNode);
		this.cy.on("mouseout", "node", this.onHoverNodeEnd);
        this.cy.on("click", "node", this.onNodeSelected);
        experimentEventBus.addListener(PathViewEvents.PROPERTY_ACTION_CLICKED, this.updateStyle)
        
        experimentEventBus.addListener(
            ExperimentGraphViewEvents.INDICATE_NODE_END, 
            this.onIndirectIndicationEnd
        )
        experimentEventBus.addListener(
            ExperimentGraphViewEvents.INDICATE_NODE_START, 
            this.onIndirectIndicationStart
        )
        // this.cy.on("scrollzoom", "cy", this.zoom)
    }

    public showPath(target:cytoscape.NodeSingular) {

        target.removeClass("indicated") // BUG: otherwise style will show (stays over from interaction with normal graph)
        this.cy.remove(this.cy.elements())
        
        let successors = target.successors() as cytoscape.NodeCollection;
        let predecessors = target.incomers() as cytoscape.NodeCollection;

        target = this.cy.add(target);
        this.cy.add(successors);
        predecessors = this.cy.add(predecessors);

        // move all predecessors (i.e. nodes above) into a "container" it there are too many
        if(predecessors.size() >= 14) {
            const parent = this.cy.add({
                group: "nodes",
                data: {id: "parent", label:""}
            });
            predecessors.move({parent:"parent"})

            // remove all edges toward the target
            let targetEdges = predecessors.edgesTo(target)
            this.cy.remove(targetEdges);

            this.cy.add({
                group:"edges",
                data: {
                    id:"temp",
                    target: target.id(),
                    source: parent.id()
                } 
            });

            predecessors.layout(fcoseLayout).run();
        } 
        this.cy.elements().not(":child").layout(this.layoutOptions).run();
        this.cy.fit();

        // re-get target, so that it is from the right core
        this.selectedNode = this.cy.$(`[label = "${target.data("label")}"]`); // uses label bc. id's uses chars that would need to be escaped
    }

    // IDEA !!: gradient on edges -> darker = closer to selection/target
    // TODO: interaction with path same as main (zoom, highlight neighbors, indication)
    // ??: Move along the graph within the path view, instead of just visible selection
    // Show lasso selection

    /* -- EVENTS -- */

    private onCanvasClick = (event:any) => {
        console.log("hi");
        event.preventDefault();
        // stops panning on left mouse button
    }

    public onMouseDown = (event:any) => {
        if (event.buttons == 2) {
            this.isPanning = true;
            this.cy.panningEnabled(true)
        } else {
            this.isPanning = false;
            this.cy.panningEnabled(false)
        }
    }

    public onMouseUp = () => {
        if (this.isPanning) 
			this.isPanning = false;
    }

    public onMouseMove = (e: any) => {
		if (this.isPanning) {
            console.log("pan");
			this.cy.panBy({
				x: e.movementX,
				y: e.movementY,
			});
		}
	};

    public onNodeSelected = (event:any) => {
        experimentEventBus.emit(PathViewEvents.NODE_SELECT, event);
        this.removeRemainingStyling();
        this.selectedNode = event.target;

        // IDEA: show the neighbours -> get from main core
    }

    public removeRemainingStyling() {
        this.cy.elements().removeClass("last-clicked"); // removes the class, that would otherwise stay
        this.cy.elements().removeClass("incoming");
        this.cy.elements().removeClass("outgoing");
        this.cy.elements().removeClass("neighbor");
        this.cy.elements().removeClass("path-going");
        this.cy.elements().removeClass("indicated");
    }

    private checkIfURL(id: string){
        let url;
        try {
            url = new URL(id);
        } catch (_) {
            return false;
        }
        return url.protocol === "http:" || url.protocol === "https:"; 
    }

    private onHoverNode = (event:any) => {
        const node = event.target! as cytoscape.NodeSingular;
        node.addClass("indicated");
        // node.removeClass("path-selected")
        
        const id = node.id();

        if (this.checkIfURL(id)) {
            experimentEventBus.emit(
                ExperimentGraphViewEvents.INDICATE_NODE_START, 
                id
            );
        }
    	this.setNodeNeighborHighlight(node, true);
    }
    
    private onHoverNodeEnd = (event:any) => {
        const node = event.target! as cytoscape.NodeSingular;
        node.removeClass("indicated");
        
        const id = node.id()

        if (this.checkIfURL(id)) {
            experimentEventBus.emit(
                ExperimentGraphViewEvents.INDICATE_NODE_END, 
                id
            );
        }
        this.setNodeNeighborHighlight(node, false);

    }

    private updateStyle = (action: PropertyEditAction) => {
        if (action === PropertyEditAction.COMPLETE)
            this.selectedNode.data("completed", "true");
		else if (action === PropertyEditAction.INTEREST)
            this.selectedNode.data("interested", "true");
    }

    // Mirror the indication of the main core
    private onIndirectIndicationStart = (id: string) => {
		this.setNodeIndication(id, true);
	};

    private onIndirectIndicationEnd = (id: string) => {
		this.setNodeIndication(id, false);
	};

    private setNodeIndication(id:string, on:boolean) {
        const node = this.cy.getElementById(id);
		if (on) {
			node.addClass("path-indicated");
		} else {
			node.removeClass("path-indicated");
		}
    }

    // from ExperimentGraphView (for separation)
    private setNodeNeighborHighlight(rootNode: any, on: boolean) {
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
			neighbors.addClass("path-neighbor");
			incomingElements.forEach((ele: any) => ele.addClass("path-incoming"));
			outgoingElements.forEach((ele: any) => ele.addClass("path-outgoing"));
		} else {
			neighbors.removeClass("path-neighbor");
            incomingElements.forEach((ele: any) => ele.removeClass("path-incoming"));
			outgoingElements.forEach((ele: any) => ele.removeClass("path-outgoing"));
		}
	}

    private onSelectionChanged = (selectedLabels: any) => {
        // mimic the selection of the main core (lasso-selects)
        this.cy.elements().removeClass("path-selected");

        selectedLabels.forEach((label:string) => {
            const el = this.cy.nodes(`[label ="${label}"]`);
            if (el.length >= 1){
                el.addClass("path-selected")
            }
        });

    }


}