import tippy from "tippy.js";
import "./legend.css";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import { ExperimentGraphViewEvents } from "../experiment/graph/ExperimentGraphView";
import { PathViewControllerEvents } from "../learnpath/PathViewController";
import cytoscape from "cytoscape";

/**
 * Mirror the hover/click actions on the graph nodes 
 * Displays the classes of the node 
 */
export class ColorLegendController {

    private readonly cy: cytoscape.Core | any;
    // private readonly $defaultNode: HTMLDivElement;
    private readonly $goalNode: HTMLDivElement;
    private readonly $completeNode: HTMLDivElement;
    private readonly $interestNode: HTMLDivElement;

    constructor(cy: cytoscape.Core) {
        this.cy = cy;
        // this.$defaultNode = document.getElementById("default-node") as HTMLDivElement;
        this.$goalNode = document.getElementById("goal-node") as HTMLDivElement;
        this.$completeNode = document.getElementById("complete-node") as HTMLDivElement;
        this.$interestNode = document.getElementById("interest-node") as HTMLDivElement;        

        this.initTippy()
    }

    private initTippy() {
        tippy(this.$goalNode, {
            content: "goal",
            placement: "top",
            duration: 300,
            theme: "dark",
        });
        tippy(this.$completeNode, {
            content: "completed",
            placement: "top",
            duration: 300,
            theme: "dark",
        });
        tippy(this.$interestNode, {
            content: "interest",
            placement: "top",
            duration: 300,
            theme: "dark",
        });
    }

    private setIndication(id: string|undefined, on: boolean) {
        if (id == undefined) return
        const node = this.cy.filter(`[id = "${id}"]`);
        this.setClassesForLegend(node, on, "legend-indicated")
    }

    private setSelection = (event:any) => {
        this.clearSelection();
        if(event.target.isNode) {
            this.setClassesForLegend(event.target, true, "legend-selected")
        } 
        
    }

    private clearSelection(){
        this.$completeNode.classList.toggle("legend-selected", false)
        this.$interestNode.classList.toggle("legend-selected", false)
        this.$goalNode.classList.toggle("legend-selected", false)
    }

    private setClassesForLegend(node:cytoscape.NodeSingular, on: boolean, cssClass:string) {
        const data = node.data();
        if(data === undefined) return;

        if (data["completed"] == "true")
            this.$completeNode.classList.toggle(cssClass, on)
        if (data["interested"] == "true")
            this.$interestNode.classList.toggle(cssClass, on)
        if (data["goal"] == "true")
            this.$goalNode.classList.toggle(cssClass, on)
    }

    // Toggle on all events
    public toggle(on: boolean): void {
        if(on) {
            experimentEventBus.on(
                ExperimentGraphViewEvents.INDICATE_NODE_START,
                (id: string) => this.setIndication(id, true)
            );
            experimentEventBus.on(
                ExperimentGraphViewEvents.INDICATE_NODE_END,
                (id: string) => this.setIndication(id, false)
            )

            this.cy.on("click", this.setSelection)
        }
       
    }
    
}