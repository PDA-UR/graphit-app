import cytoscape from "cytoscape";
import { STYLESHEET } from "./Stylesheet";
import LEARNEY_ELEMENTS from "../data/Learney_positions_map_v013.json"
import { NodeInfo } from "../ui/NodeInfo";

export class MainGraph {

    private readonly cy: cytoscape.Core;
    private readonly $container: HTMLDivElement;
    private readonly nodeInfo: NodeInfo;
    private currentSelection: cytoscape.NodeSingular | null = null;

    constructor() {
        this.$container = document.getElementById("app") as HTMLDivElement;
        
        this.cy = cytoscape({
            container: this.$container,
            style: STYLESHEET,
			elements: LEARNEY_ELEMENTS,
			layout: { name: 'preset' },
            autoungrabify: true,
		});
        
        this.initGraphEvents();
        this.nodeInfo = new NodeInfo(this.cy);

    }

    private initGraphEvents() {
        this.cy.on("click", this.onClick);
        this.cy.on("mouseover", "node", this.onMouseOver);
        this.cy.on("mouseout", "node", this.onMouseOut);
        this.$container.addEventListener("mousemove", this.resetSelection);
    }


    private showPathToSelection(node:cytoscape.NodeSingular) {
        const path = node.predecessors();
        path.addClass("path");
    }

    /* ----- EVENTS ----- */

    private onClick = (e:any) => {
        const node = e.target;
        try {
            if (node.isNode() && node.isChild()) {
                this.nodeInfo.open(node.id());
                this.currentSelection = node;
            } 
        } catch {
            if (this.nodeInfo.isLinkClick) {
                return;
            }
            this.nodeInfo.close();
        }
    }

    private onMouseOver = (e:any) => {
        const node = e.target;
        if (node.isParent()) return;

        node.addClass("hover");
        this.showPathToSelection(node);
    }

    private onMouseOut = (e:any) => {
        const node = e.target;
        if (node.isParent()) return;

        node.removeClass("hover")
        this.cy.elements().removeClass("path")
    }

    private resetSelection = () => {
        // reset selection, as is unselects after opening a link and leaving the tab
        if (this.currentSelection !== null && this.currentSelection.selected() == false) {
            this.currentSelection.select();
        }
    }

}