import { ElementDefinition } from "cytoscape";
import { GraphModel } from "../../propertyEditor/ui/graph/GraphModel";
import { MainGraph } from "./MainGraph";
import { MenuEventController } from "../ui/EventController";
import { eventBus } from "../../propertyEditor/global/EventBus";

// MainViz bundles all viz-tests

export class MainViz {
    private mainGraph;
    private graphModel: GraphModel;
    private menuController: MenuEventController;

    constructor(elements:ElementDefinition[]) {
        this.graphModel = elements;
        this.mainGraph = new MainGraph(
            this.graphModel,
            document.getElementById("app")!, // t is undefined -> hier?
        );
        this.menuController = new MenuEventController();

        // ---- MENU - EVENTS ----
        eventBus.on(
            "layoutChange", this.mainGraph.switchLayout
        );
        
        eventBus.on(
            "toggleChange", this.mainGraph.toggleBubbleSet
        );

    }
    
}