import { ElementDefinition } from "cytoscape";
import { MainGraph } from "./MainGraph";
import { MenuEventController } from "../ui/EventController";
import { vizEventBus } from "../VizEventBus";
import { GraphModel } from "../../selectionTools/ui/graph/GraphModel";

// MainViz bundles all viz-tests

export class MainViz {
	private mainGraph;
	private graphModel: GraphModel;
	private menuController: MenuEventController;

	constructor(elements: ElementDefinition[]) {
		this.graphModel = elements;
		this.mainGraph = new MainGraph(
			this.graphModel,
			document.getElementById("app")! // t is undefined -> hier?
		);
		this.menuController = new MenuEventController();

		// ---- MENU - EVENTS ----
		vizEventBus.on("layoutChange", this.mainGraph.switchLayout);

		vizEventBus.on("toggleBubble", this.mainGraph.toggleBubbleSet);

		vizEventBus.on("togglePacking", this.mainGraph.togglePacking);
	}
}
