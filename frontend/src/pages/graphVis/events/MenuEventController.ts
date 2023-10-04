import cytoscape from "cytoscape";
import { eventBus } from "../global/EventBus";

export class MenuEventController {

    private readonly cy: cytoscape.Core;
    // private pathInfo: HTMLElement;
    // private graphInfo: HTMLElement;
    // private sidebarBtn: HTMLElement;
    private container: HTMLElement;
    // private closeBtn: HTMLElement
    private openMenu: boolean = true;
    private populated: boolean = false;

    constructor(cy: cytoscape.Core){
        this.cy = cy;

        // eventBus.on("menuClick", this.openResource);
        // eventBus.on("hotlistClick", this.clickSideBar);

        // this.pathInfo = document.getElementById("path-info") as HTMLElement;
        // this.graphInfo = document.getElementById("graph-info") as HTMLElement;
        // this.sidebarBtn = document.getElementById("sidebar-icon") as HTMLElement;
        this.container = document.getElementById("sidebar") as HTMLElement;
        //this.closeBtn = document.getElementsByClassName("info-box-close")

        this.initListeners();
        this.initEvents();
        // this.populateSideBar();

    }

    public initEvents() { // Call at the first ini
        eventBus.on("menuClick", this.openResource);
        eventBus.on("hotlistClick", this.clickSideBar);
    }

    private initListeners() {
        // this.pathInfo.addEventListener("click", this.onClick);
        // this.graphInfo.addEventListener("click", this.onClick)
        // this.sidebarBtn.addEventListener("click", this.onClick)
    }

    public populateSideBar(){
        if(this.populated) return;
        const courses = this.cy.$(".course") as cytoscape.Collection;
        courses.forEach(course => {
            const childs = course.neighborhood().not(".ghost").not(".course");
            this.addDivs(course, childs, this.container);
        });
        this.populated = true;
    }

    public updateSideBarForCourse(){
        // When enter course add all course nodes to sidebar
    }


    /* ---- EVENTS  AND EVENT FUNCTIONS ---- */

    private openResource = (res:any) => { //buggy(why?)
        window.open(res.data("url"), "_blank")?.focus();
        console.log("openRes");
    }

    // TDOD: separte click on course + nodes
    private clickSideBar = (e: MouseEvent) => {
        console.log(e.target); //has attribute "sidebar-items"
        const target = e.target as HTMLElement;
        
        // Remove previous highlight
        const previous = document.getElementsByClassName("highlight-childs");
        previous[0]?.setAttribute("class", "sidebar-childs"); // should only ever be one
        const previousP = document.getElementsByClassName("highlight-parents");
        previousP[0]?.setAttribute("class", "sidebar-parents");

        if(target.className == "sidebar-parents"){
            console.log("clicked parent");
            target.setAttribute("class", "highlight-parents");
        } else target.setAttribute("class", "highlight-childs");
        
        // Synk changes to graph -> works
        const targetNode = this.cy.$("node[label ='" + target.id + "']" );
        eventBus.emit("sidebarSelect", targetNode);
    }

    private onClick = (e: MouseEvent) => {
        const t = e.target as HTMLElement;
        console.log("t", t.id);
        switch (t.id){
            case "graph-info":
                this.createInfoBox(GRAPH_INFO);
                break;
            case "path-info":
                this.createInfoBox(PATH_INFO);
                break;
            case "sidebar-icon":
                this.toggleSideBar();
                break;
            default:
                console.log("no info-box available");
                break;  
        }
    }

    private toggleSideBar(){
        const sidebar = document.getElementById("sidebar") as HTMLElement;
        if(this.openMenu){
            console.log("open sidebar");
            this.openMenu = false;
            sidebar.style.width = "250px";
            this.container.style.display = "block";
        } else {
            this.openMenu = true;
            sidebar.style.width = "25px";
            this.container.style.display = "none";
        }
    }


    private createInfoBox(text:string){
        const infoDiv = document.createElement("div");
        infoDiv.setAttribute("class", "info-box");
        infoDiv.innerHTML = text;

        const closeBtn = document.createElement("div");
        closeBtn.setAttribute("class", "info-box-close");
        closeBtn.addEventListener("click", this.closeInfoBox);

        infoDiv.appendChild(closeBtn);
        document.body.appendChild(infoDiv);
    }

    private closeInfoBox = (e:MouseEvent) => {
        const div = e.target as HTMLElement;
        console.log("p", div.parentNode);
        document.body.removeChild(div.parentNode as HTMLElement);

        //this.closeBtn.removeEventListener("click", this.closeInfoBox);

    }

    /* UTILS */

    /**
     * Creates a tree-view of parent and their childs
     * @param parent The parent to create
     * @param childs The childs to append to the parent
     * @param div The div to append the parent and then the childs
     */
    private addDivs(
        parent:cytoscape.NodeSingular, 
        childs:cytoscape.Collection, 
        div:HTMLElement
    ) {
        console.log("!! add divs");
        var container = document.createElement("div");
        container.setAttribute("class", "sidebar-items");
        div.appendChild(container);

        var pDiv = document.createElement("div");
        pDiv.setAttribute("class", "sidebar-parents");
        pDiv.setAttribute("id", parent.data("label"));
        pDiv.innerText = parent.data("label");
        container.appendChild(pDiv);

        // container.innerText = parent.data("label");
        // div.appendChild(container);

        childs.forEach(child => {
            if(child.data("label") != undefined) {
                var cDiv = document.createElement("div");
                cDiv.setAttribute("class", "sidebar-childs");
                cDiv.setAttribute("id", child.data("label"));
                cDiv.innerText = child.data("label");
                container.appendChild(cDiv);
                cDiv.addEventListener("click", (e:MouseEvent) => eventBus.emit("hotlistClick", e));
            }
            //child.addListener("click", (e:EventObject) => eventBus.emit("hotlistClick", e));

        });
        container.addEventListener("click", (e:MouseEvent) => eventBus.emit("hotlistClick", e));

        // TODO: add click-event listeners !!!
        console.log("!!", eventBus.listenerCount("hotlistClick"))

    }

}

const GRAPH_INFO = `<b> Zeigt den aktuellen Graphen an. </b> <br/>
Hier werden die Kurse und ihre jeweiligen Knoten angezeigt. 
Und wie diese voneinander anbhängen. <br/>
Innerhalb dieser Ansicht kann mit dem Graphen interagiert werden.
Es gibt zwei Ansichten die die gleiche Interaktionsmöglichkeiten haben.<br/>
<ul>
<li>Die Ansicht des gesamten Graphen</li>
<li>Die separierte Ansicht eines Kurses 
<small>(etwa: Computergrafik und Bildverarbeitung)</small></li>
</ul> 
Der eizige Unterschied besteht in dem Abstraktionsgrad der Anzeige. 
So werden im gesamten Graphen weniger Informationen auf einmal angezeigt.
<br/>
<br/>
Die Interaktionsmöglichkeiten sind:
<ul>
<li>Klick auf einen Kurs öffnet oder schließt die separate Kursansicht</li>
<li>Klick auf einen Knoten zeigt 
    <ul>
    <li> die Verbundenen Knoten an </li> 
    <li> einen Lernpfad zu dem selektierten Knoten an</li>
    <li> zusätzliche Informationen und verknüpfte Ressourcen an (oben rechts) </li>
    </ul>
<li>Hover über einem Knoten zeigt dessen direkte Nachbarn an</li>
<li>Hover über einem versteckten Knoten (grauer Kreis) zeigt dessen Namen an</li>
</ul> 
<br/>
Die Größe eines Knotens stellt die Wichtigkeit dar.
`

const PATH_INFO = `<b> Zeigt den Lernpfad zu einem Knoten an. </b> <br/>
Der zu erlernende Knoten befindet sich oben 
und das benötigte Vorwissen wird unterhalb angesiedelt. <br/>
<small> Innerhalb dieser Ansicht, kann auch mit dem Graphen interagiert werden.</small>
`