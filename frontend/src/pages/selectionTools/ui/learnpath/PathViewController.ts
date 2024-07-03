import tippy from "tippy.js";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import "./path.css"
import { PathViewGraph } from "./PathViewGraph";
import { dragSpacer } from "./PathSpacer";
import { toggleLassoSelection } from "../graph/CytoscapeExtensions";

export enum PathViewControllerEvents {
    NODE_CLICK = "nodeClick",
}

export class PathViewController {

    private readonly cy: cytoscape.Core | any;
    private readonly graph: PathViewGraph;
    private readonly $container: HTMLDivElement;
    private readonly $toggleBtn: HTMLButtonElement;
    private readonly $spacer: HTMLDivElement;
    private isOpen: boolean;
    private selectedNode: any | null = null;

    constructor(cy: cytoscape.Core) {
        this.cy = cy
        this.graph = new PathViewGraph()

        this.$container = document.getElementById("path-container") as HTMLDivElement;
        this.$toggleBtn = document.getElementById("path-toggle-button") as HTMLButtonElement;
        this.$spacer = document.getElementById("path-spacer") as HTMLDivElement; 
        this.isOpen = false;

        dragSpacer(this.$spacer, this.cy, this.graph.getPathCore());

        tippy(this.$toggleBtn, {
            content: "Lernpfad ein/ausblenden (Ctrl + L)",
            placement: "left",
            duration: 300,
            theme: "dark",
        });
    }

    private isVisible() {
		return this.$container.classList.contains("slided-out-right");
	}

    private onOpen(isVisible:boolean) {
        this.$container.classList.toggle("hidden-cy", !isVisible);
		this.$container.classList.toggle("slided-out-right", !isVisible);
		this.$container.classList.toggle("slided-in-right", isVisible);
		this.$container.classList.toggle("show-cy", isVisible);
        this.$toggleBtn.classList.toggle("active", isVisible);
        this.isOpen = isVisible;
    }

    public toggleView() {
        console.log("toggle path view", this.isVisible())
        if(this.isVisible()) {
            this.onOpen(true);
            if (this.selectedNode != undefined) 
                this.showPath()
        } else {
            this.onOpen(false);
        }
    }

    private reshapeView(event:MouseEvent) {
        dragSpacer(this.$spacer, this.cy, this.graph.getPathCore());
    }

    private setSelectedNode(target:any) {
        if (target == undefined) return;
        this.selectedNode = target;
        if (this.isOpen) {
            this.showPath()
        }
    }

    private showPath() {
        if (!this.isOpen || this.selectedNode == null){
            return;
        }
        console.log("show path for", this.selectedNode)
        this.createPath()
    }

    private createPath() {
        console.log("show path for", this.selectedNode)
        this.graph.showPath(this.selectedNode)
        // get all path nodes, from the selected on
    }


    // Toggle on all events
    public toggle(on: boolean): void {
        this.$toggleBtn.addEventListener("click", () => this.toggleView() )
        this.$spacer.addEventListener("mousedown", (event:MouseEvent) => this.reshapeView )

        this.$container.addEventListener("mouseover", () => this.toggleMainGraphEvents(false))
        this.$container.addEventListener("mouseout", () => this.toggleMainGraphEvents(true))

        experimentEventBus.on(
            PathViewControllerEvents.NODE_CLICK, 
            (target) => this.setSelectedNode(target))
        
        this.initKeyboardListeners(on)
    }

    /**
     * Toggle events of the main cytoscape core on/off when the mouse is on/off the learning path.
     * Prevents viewport changes on both graphs at the same time.
     * @param on 
     */
    private toggleMainGraphEvents(on: boolean){
        this.cy.zoomingEnabled(on);
        this.cy.panningEnabled(on);
        toggleLassoSelection(this.cy, on);
    }

    private initKeyboardListeners = (on: boolean) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("keydown", this.onKeydown);
	};

	private onKeydown = (e: KeyboardEvent) => {
		if (e.code === "KeyL" && e.ctrlKey) {
			e.preventDefault();
			e.stopPropagation();

			this.toggleView()
		}
	};
    
}