import tippy from "tippy.js";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import "./path.css"
import { PathViewGraph } from "./PathViewGraph";

export enum PathViewControllerEvents {
    NODE_CLICK = "nodeClick"
}

export class PathViewController {

    private readonly cy: cytoscape.Core | any;
    private readonly graph: PathViewGraph;
    private readonly $container: HTMLDivElement;
    private readonly $toggleBtn: HTMLButtonElement;
    private isOpen: boolean;
    private selectedNode: any | null = null;

    constructor(cy: cytoscape.Core) {
        this.cy = cy
        this.graph = new PathViewGraph()

        this.$container = document.getElementById("path-view") as HTMLDivElement;
        this.$toggleBtn = document.getElementById("path-toggle-button") as HTMLButtonElement; 
        this.isOpen = false;

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
		this.$container.classList.toggle("path-view", isVisible);
        this.$toggleBtn.classList.toggle("active", isVisible);
        this.isOpen = isVisible;
    }

    public toggleView() {
        console.log("toggle path view", this.isVisible())
        if(this.isVisible()) {
            this.onOpen(true);
        } else {
            this.onOpen(false);
        }
    }

    private setSelectedNode(target:any) {
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
        this.graph.showPath(this.selectedNode)
        // get all path nodes, from the selected on
    }


    // Toggle on all events
    public toggle(on: boolean): void {
        console.log("toggle:", on)
        this.$toggleBtn.addEventListener("click", () => {
            this.toggleView()
        })

        experimentEventBus.on(
            PathViewControllerEvents.NODE_CLICK, 
            (target) => this.setSelectedNode(target))
        
        this.initKeyboardListeners(on)
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