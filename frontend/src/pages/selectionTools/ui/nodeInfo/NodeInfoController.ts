import tippy from "tippy.js";
import "./nodeInfo.css"
import WikibaseClient from "../../../../shared/WikibaseClient";
import cytoscape from "cytoscape";
import { LoadingSpinner } from "../../../../shared/ui/LoadingSpinner/SpinnerManager";

const ResourceTypes : any  = {
    "Q233": "📑", // Article
	"Q159":"🔍", // Tutorial
    "Q160" : "📌", // Code example
	"Q161" : "📚", // Library
    "Q162" : "🧠", // Quiz
    "Q164" : "📖", // Book
    "Q165" : "📲", // eBook
    "Q421" : "🔊", // Lecture
    "Q346" : "💿", // Software
    "LINK" : "🔗", // Link
}

export class NodeInfoController {

    private readonly cy: cytoscape.Core | any;
    private readonly client: WikibaseClient;
    private readonly $container: HTMLDivElement;
    private readonly $nodeName: HTMLDivElement;
    private readonly $nodeNameContainer: HTMLDivElement;
    // private readonly $wikibaseLink: HTMLLinkElement
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
        this.$nodeNameContainer = document.getElementById("node-info-name-container") as HTMLDivElement;
        // this.$wikibaseLink = document.getElementById("wikibase-item-link") as HTMLLinkElement;
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
            // this.$nodeName.classList.remove("disabled-link");
            // this.$wikibaseLink.classList.add("resouce-link");
        } else {
            console.log("click on canvas")
            this.currentSelection = null;
            this.$content.innerHTML = "";
            this.$nodeName.innerText = "Item";
            // this.$wikibaseLink.classList.add("disabled-link");
            // this.$wikibaseLink.classList.remove("resouce-link");
        }
    }

    private setName(node: cytoscape.NodeSingular) {
        let str = node.data("label")
        this.$nodeName.innerText = str;
        this.getStatus(node); // works
        
        // 

    }

    // ??: Expand idea
    // TODO: add icon-symbols in front of Label 
    private getStatus(node: cytoscape.NodeSingular) {
        const $typeIcon = document.getElementById("node-info-icon") as HTMLDivElement;
        
        $typeIcon.classList.remove("complete-icon");
        $typeIcon.classList.remove("interest-icon");
        $typeIcon.classList.remove("goal-icon");
        $typeIcon.classList.remove("no-icon");

        const data = node.data()
        if (data["completed"] == "true") {
            $typeIcon.classList.add("complete-icon");
            this.$nodeNameContainer.style.backgroundColor = "#82C482";
        } else if (data["interested"] == "true") {
            $typeIcon.classList.add("interest-icon");
            this.$nodeNameContainer.style.backgroundColor = "#A895EF";
        } else {
            this.$nodeNameContainer.style.backgroundColor = "#77aeff";
        }
        
        // if (data["goal"] == "true")
        //     $typeIcon.classList.add("goal-icon");
        // currently only works with 1 icon


        
    }

    private async setResources() {
        this.$content.innerHTML = "";
        if (this.isHidden) return
        if (this.currentSelection == null) return;

        const id = this.currentSelection.id();
        const qid = id.match(/(Q\d+)/g);
        
        // add a small spinner to the info object
        const spinner = new LoadingSpinner();
        spinner.setResourceSpinner(true);
        spinner.start();
        this.$dropdownBtn.innerText = ""; //remove temporarily (looks better)

        let result;
        if (qid != null)
            result = await this.client.getItemResource(qid[0]);   
        // console.log("[RES]", result)
        this.createResourceList(result);

        // rm spinner
        spinner.stop();
        spinner.setResourceSpinner(false);
        this.$dropdownBtn.innerText = "-";
    }

    private createResourceList(resources: any) {
        resources.forEach((res: any) => {
            const div = this.createResourceDiv(res)
            this.$content.appendChild(div)  
        }); 
    }

    private parseResourceType(link:string) {
        const qid = link.match(/[Q]\d+/g)!;
        let type = ResourceTypes[qid[0]];
        if(type == null) {
            type = ResourceTypes.LINK;
        }
        return type;
    }

    private createResourceDiv(res: any) {
        let label = res.resourceLabel.value;
        // console.log("label", label);
        if (res.alias !== undefined) {
            label = res.alias.value;
        }
        const url = res.url.value;

        const headContainer = document.createElement("div");

        const typeDiv = document.createElement("span");
        typeDiv.innerText = this.parseResourceType(res.type.value);

        const linkDiv = document.createElement("a")
        linkDiv.classList.add("resource-link") // create links symbol
        linkDiv.innerText = label;
        linkDiv.href = url;
        linkDiv.target = "_blank";

        const labelDiv = document.createElement("div");
        labelDiv.classList.add("resource-label");
        labelDiv.innerText = label;
        
       
        const container = document.createElement("div")
        container.classList.add("resource-item")
        headContainer.appendChild(typeDiv);
        headContainer.appendChild(linkDiv);
        container.appendChild(headContainer);
        
        if (res.description !== undefined) {
            const descDiv = document.createElement("div");
            descDiv.innerText = res.description.value;
            descDiv.classList.add("resource-description");
            container.appendChild(descDiv);
        }

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
        if (e.code === "BracketRight" && e.altKey) {
            this.toggleDropDown()
        }
	};
    
}



/* Article, Code example, Tutorial, Library, Quiz, Book, eBook, Lecture, Software
    📑 Article (&#128209;)
    📎 Tutorial (&#128206;)  🔍 (128270;)
    📌 Code Example (&#128204;) (💻 &#128187;)
    📚 Library (&#128218;)
    🧠 Quiz (&#129504;)
    📖 Book (&#128214;)
    📲 eBook (&#128242;)
    🔊 Lecture (&#128266;) 
    💿 Software (&#128191;)
    🔗 Link (&#128279;)

    | ✅ OpenGL Basic Concepts |
    -----------------------------
    |📎 Anton's OpenGL 4 Tutorials |
        -> A collection of multiple OpenGL 4 Tutorials
        Dr Anton Gerdelan

*/