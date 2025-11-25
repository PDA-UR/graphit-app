import { experimentEventBus } from "../../selectionTools/global/ExperimentEventBus";
import { SearchViewControllerEvents } from "../../selectionTools/ui/experiment/search/SearchController";
import "./nodeInfo.css";
import cytoscape from "cytoscape";

export class NodeInfo {
    
    private readonly cy: cytoscape.Core;
    private readonly $container: HTMLDivElement;
    private readonly $name: HTMLDivElement;
    private readonly $desc: HTMLDivElement;
    private readonly $urlContainer: HTMLUListElement;
    public isLinkClick = false;

    constructor(cy: cytoscape.Core) {
        this.cy = cy;
        this.$container = document.getElementById("node-info-container") as HTMLDivElement;
        this.$name = document.getElementById("node-name") as HTMLDivElement;
        this.$desc = document.getElementById("node-description") as HTMLDivElement;
        this.$urlContainer = document.getElementById("url-container") as HTMLUListElement;

        this.$urlContainer.addEventListener("mouseenter", this.onMouseEnter);
        this.$urlContainer.addEventListener("mouseleave", this.onMouseLeave);   

    }

    private onMouseEnter = () => {
        this.isLinkClick = true;
    }

    private onMouseLeave = () => {
        this.isLinkClick = false;
    }

    public open(id: string) {
        this.$container.classList.remove("hidden");
        this.addInfo(id)
    }

    public close(){
        this.$container.classList.add("hidden");
    }

    private addInfo(id: string){
        const node = this.cy.$id(id)
        this.$name.innerText = node.data("name")
        this.$desc.innerText = node.data("description")

        this.addLinks(node.data("urls"))
    }


    private addLinks(urls:Array<string>) {
        this.$urlContainer.innerHTML = "Resources:";
        urls.forEach((url: string) => {
            const item = document.createElement("li");
            const div = document.createElement("a");            
            div.href = url;
            div.rel = "noopener noreferrer";
            div.target = '_blank';
            div.title = "link";

            const link = document.createTextNode(url);                
            div.appendChild(link);
            item.appendChild(div);

            this.$urlContainer.appendChild(item);
        });
    }



}