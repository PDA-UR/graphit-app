import tippy from "tippy.js";
import { experimentEventBus } from "../../global/ExperimentEventBus";
import "./nodeInfo.css"
import { PathViewControllerEvents } from "../learnpath/PathViewController";
import WikibaseClient from "../../../../shared/WikibaseClient";


export class NodeInfoController {

    private readonly cy: cytoscape.Core | any;
    private readonly client: WikibaseClient;
    private readonly $container: HTMLDivElement;
    private readonly $nodeName: HTMLDivElement;
    private readonly $dropdownBtn: HTMLDivElement;
    private readonly $content: HTMLDivElement;
    private readonly $pathBtn: HTMLDivElement;
    private readonly $pathContainer: HTMLDivElement;

    private isHidden: boolean | undefined = true;
    private currentSelection: cytoscape.NodeSingular | any;

    constructor(cy: cytoscape.Core, client: WikibaseClient) {
        this.cy = cy;
        this.client = client;

        this.$container = document.getElementById("node-info-container") as HTMLDivElement;
        this.$nodeName = document.getElementById("node-info-name") as HTMLDivElement;
        this.$dropdownBtn = document.getElementById("info-dropdown-btn") as HTMLDivElement;
        this.$content = document.getElementById("info-content") as HTMLDivElement;
        this.$pathBtn = document.getElementById("path-toggle-button") as HTMLDivElement;
        this.$pathContainer = document.getElementById("path-container") as HTMLDivElement;

        tippy(this.$dropdownBtn, {
            content: "Zusätzliche Informationen (alt + '+')",
            placement: "top",
            duration: 300,
            theme: "dark",
        });
    }

    private setInfo(target: any) {
        if(target.isNode) {
            this.currentSelection = target;
            this.setName(target);
            this.setResources();
        } else {
            this.currentSelection = null;
            this.$content.innerHTML = "";
            this.$nodeName.innerText = "Item";
        }
    }

    private setName(node: cytoscape.NodeSingular) {
        let str = node.data("label") + this.getStatus(node)
        this.$nodeName.innerText = str;
    }

    // ??: Expand idea
    private getStatus(node: cytoscape.NodeSingular) {
        const data = node.data()
        let status = ""

        if (data["completed"] == "true")
            status += "🟢"
        if (data["interested"] == "true")
            status += "🟡"
        if (data["goal"] == "true")
            status += "🟣"
        return status as string
    }

    private async setResources() {
        this.$content.innerHTML = "";
        if (this.isHidden) return
        if (this.currentSelection == null) return;

        const id = this.currentSelection.id()
        const qid = id.match(/(Q\d+)/g)
        console.log("show res for", qid)

        // for dev
        // const result = [
        //     {   resource: { type: "uri", value: "https://graphit.ur.de/entity/Q230" },
        //         resourceLabel: { "xml:lang": "en", type: "literal", 
        //             value: "Video-Snippet: Vectors" },
        //         url: { type: "uri", value: "https://mediathek2.uni-regensburg.de/playthis/618ea4d763d011.14489599" },
        //     },
        //     {   resource: { type: "uri", value: "https://graphit.ur.de/entity/Q293" },
        //         resourceLabel: { "xml:lang": "en", type: "literal", 
        //             value: "Wikipedia: Vector" },
        //         url: { type: "uri", value: "https://en.wikipedia.org/wiki/Vector_(mathematics_and_physics)" }
        //     }
        // ]

        // // works
        let result;
        if (qid != null)
            result = await this.client.getItemResource(qid[0])    
        console.log("[RES]", result)

        this.createResourceList(result)
    }

    private createResourceList(resources: any) {
        resources.forEach((res: any) => {
            const div = this.createResourceDiv(res)
            this.$content.appendChild(div)  
        }); 
    }

    private createResourceDiv(res: any) {
        // const item = res.resource.value;
        const label = res.resourceLabel.value;
        const url = res.url.value;

        const linkDiv = document.createElement("a")
        linkDiv.classList.add("resource-link")
        linkDiv.href = url

        const labelDiv = document.createElement("div")
        labelDiv.classList.add("resource-label")
        labelDiv.innerText = label

        const container = document.createElement("div")
        container.classList.add("resource-item")
        container.appendChild(linkDiv)
        container.appendChild(labelDiv)

        return container
    }

    // Toggle on all events
    public toggle(on: boolean): void {
        this.$dropdownBtn.addEventListener("click", this.toggleDropDown); 
        this.$content.addEventListener("mouseenter", () => this.toggleScrollEvents(false));
        this.$content.addEventListener("mouseleave", () => this.toggleScrollEvents(true))
        
        this.cy.on("click", (event:any) => this.setInfo(event.target))

        this.initKeyboardListeners(on);
    }

    private toggleDropDown = () => {
        let hide = false;
        if (this.$content.classList.contains("invisible")) {
            this.$dropdownBtn.innerText = "-";
            this.isHidden = false
            this.setResources()
            // TODO: show resources for last selected
        } else {
            this.$dropdownBtn.innerText = "+";
            hide = true;
            this.isHidden = true
        }
        this.$content.classList.toggle("invisible", this.isHidden);
    }

    /**
     * Toggle on/off the scroll events of the graph container. So that the graph doesn't move
     * @param on or off
     */
    private toggleScrollEvents = (on: boolean) => {
        this.cy.zoomingEnabled(on)
    }

    private initKeyboardListeners = (on: boolean) => {
		const fn = on ? window.addEventListener : window.removeEventListener;
		fn("keydown", this.onKeydown);
	};

	private onKeydown = (e: KeyboardEvent) => {
        console.log(e.code)
        if (e.code === "BracketRight" && e.altKey) {
            this.toggleDropDown()
        }
	};
    
}