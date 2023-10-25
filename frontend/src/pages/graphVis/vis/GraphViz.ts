import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import dagre from "cytoscape-dagre";
import { GLOBALS } from "../global/config";
import { stylesheet } from "../design/stylesheet";
import { LayoutController } from "../utils/LayoutController";
import { eventBus } from "../global/EventBus";
// import { vizEventBus } as eventbus from "../global/VizEventBus";
import { GraphEvents } from "../events/GraphEventController";
import { StyleController } from "../utils/StyleController";
import { PathViz } from "./PathViz";
import { MenuEventController } from "../events/MenuEventController";

// INIT EXTENSIONS
cytoscape.use(fcose);
cytoscape.use(dagre)

/* Displays the Main Graph */
export class MainGraph {

    private readonly cy: cytoscape.Core;
    private readonly $container: HTMLElement;
    private layouter: any;
    private styler: any;
    private pathViz: any
    // private menuer: any;

    private willEnter: Boolean = true;

    constructor(
        graphElements: cytoscape.ElementDefinition[],
        $container: HTMLElement,
    ) {
        // init graph with cy
        this.$container = $container;
        this.cy = cytoscape({
            container: this.$container,
            elements: graphElements,
            style: stylesheet,
            layout: GLOBALS.noLayout,
            zoom: 1,
        });
        this.cy.ready(this.layoutGraph);
        this.pathViz = new PathViz();
        new MenuEventController(this.cy);
        // this.menuer.populateSideBar();
        
        this.initGraphEvents();
    }

    // Initial layout-function
    private layoutGraph = () => {
        console.log("load the graph and start the layout");

        this.layouter = new LayoutController(this.cy);
        this.layouter.layoutFullGraph();
    }

    private initGraphEvents() {
        new GraphEvents(this.cy, this.pathViz.getCore());
        eventBus.on("click", this.onClick);
        eventBus.on("sidebarSelect", this.onClick);
        eventBus.on("mouseover", this.hightlightNodeOnHover);
        eventBus.on("mouseout", this.noHightlightNodeOnHover);
        eventBus.on("dblclick", this.onDblClick);
        // eventBus.on("zoom", this.onZoomChange);
    }

    /* ---- GRAPH FUNCTIONS ---- */
    private enterCourse(target:any) {
        let courseNodes = this.cy.$("[course =" + "'" + target.id() + "'" + "]");
        courseNodes = courseNodes.not(".course"); // remove all supernodes
        courseNodes = courseNodes.union(target);

        console.log("course", courseNodes);

        // this.layouter.layoutCourse(courseNodes);
        const redString = this.layouter.layoutRedString(courseNodes);

        //TEST -> PathViz -> show the red String on enter
        this.pathViz.setRedString(redString);

        this.willEnter = false;
    }

    private leaveCourse() {
        this.layouter.relayoutFullGraph();
        this.willEnter = true;
    }

    /* ---- UTIL FUNCTIONS ---- */

    // Show the connected Elements
    private showConnected(target: cytoscape.NodeSingular) {
        console.log("show Connected-Nodes for:", target.data("label"));
        target = this.cy.$id(target.id());
        this.styler = new StyleController(this.cy);
        let connected: cytoscape.Collection;
        if(this.willEnter){
            console.log("style only neightbors");
            connected = target.neighborhood();
        } else {
            console.log("style all connected");
            connected = this.getConnected(target);
        }
        this.styler.styleConnected(target, connected);
    }

    private showPath(target: cytoscape.NodeSingular) {
        console.log("show learning path for:", target.data("label"), target);

        // Funktioniert nicht in Course-View
        if(target.data("important") == "true") { // works for outside the graph inside == true
            let preview = target.neighborhood();
            preview = target.union(preview);
            console.log("prev", preview);
            // this.pathViz.setPreview(preview);
            return;
        }

        // Remove edges that want to have the course: wissarb as a source/target
        let learners = target.successors()
            .not(".course")
            .not("edge[target=" + "'" + target.data("course") + "'" + "]")
            .not("edge[source=" + "'" + target.data("course") + "'" + "]")//;
            .not("edge[source=" + "'" + "wissArb" + "'" + "]")
            .not("edge[target=" + "'" + "wissArb" + "'" + "]");
            // NOTE: ISUUE: somewhere edges  are added that want "wissArb" as a source/target
        learners = target.union(learners); // target is first item

        let futureLs = target.incomers()
            .not("node[url]") //filter out resources and their edges
            .not(target.incomers().filter("node[url]").connectedEdges());
        // learners = learners.union(futureLs); // include first incoming -> next learn target
        
        //TEST -> here Problem with edges -> 
        console.log("!! pathViz:", this.pathViz);
        this.pathViz.setElements(learners, futureLs);
    }


    /**
     * Gets all connected nodes
     * @param target The node for which to get connected
     * @returns A collection of nodes
     */
    private getConnected (target:any) {
        const course = target.data("course")
        target = target.union(target.predecessors(course));
        target = target.union(target.successors(course));
        return target;
    }

    private displayInfo(target:any) {
        const nodeDiv = document.getElementById("node-name") as HTMLElement; 
        const courseDiv = document.getElementById("course-name") as HTMLElement;
        const resDiv = document.getElementById("resource-container") as HTMLElement;
        // const resParent = document.getElementById("resources") as HTMLElement;

        // Node-name
        const name : string = target.data("label");
        name ? nodeDiv!.innerText = target.data("label") : null;

        // Course-name
        const course : string = target.data("course");
        const courseName = this.cy.$id(course).data("label");
        const courseStr : string = `in Kurs: ${courseName}`;
        courseName ? courseDiv!.innerText = courseStr : "ohne Kurs";

        // Resource + Resource-names
        const res = target.neighborhood("node[url]") as cytoscape.Collection;
        resDiv.innerHTML = "";

        if(res.length == 0) resDiv.innerHTML="<small>Nothing yet</small>";
        // console.log("res", res);
        
        res.forEach(r => {
            let div = document.createElement("div");
            div.setAttribute("class", "resource-items");

            let icon = document.createElement("div");
            icon.setAttribute("class", "resource-icon");
            icon.addEventListener("click", () => eventBus.emit("menuClick", r));;

            let name = document.createElement("div");
            name.setAttribute("class", "resource-name");
            name.innerHTML = r.data("label");

            div.appendChild(icon)
            div.appendChild(name);

            resDiv.appendChild(div);
        });

    }

    /* ---- EVENT FUNCTIONS ---- */

    // NOTE: Better? -> if course entered -> click different course -> enter this course
    private onClick = (target:cytoscape.NodeSingular) => {
        console.log("click", target.data("label"), target.position(), target.classes());
        console.log("click", target.cy());

        const targetCore = target.cy() as cytoscape.Core;
        console.log(targetCore.container()?.id);
        if(targetCore.container()?.id == "path") {
            target = this.cy.$id(target.id()); // use the target in the full dataset
            this.cy.fit(target.neighborhood(), 200);
        }
        
        this.displayInfo(target);

        if(target.hasClass("course") && this.willEnter) {
            console.log("enter course ", target.id());
            toggleHoverStyle(target, false); // unhover all elements on enter
            this.enterCourse(target);
        } else if(target.hasClass("course") && !this.willEnter) {
            console.log("leave course");
            this.leaveCourse()
        } else {
            this.showConnected(target);
            this.showPath(target);  
        }
    }

    private hightlightNodeOnHover (target:any) {
        toggleHoverStyle(target, true);
        //this.styleController.toggleHoverStyle(target, true);
    }

    private noHightlightNodeOnHover (target:any) {
        toggleHoverStyle(target, false);
        // this.styleController.toggleHoverStyle(target, false);
    }


    // Open the Wikibase-page for the target item
    private onDblClick(target:any) {
        console.log("dblclick: open page:", target.id());
        let url = target.id();
        // Check if page is a functional url, e.g. https://graphit.ur.de/entity/Q608
        if(isValidUrl(url)) {
            window.open(target.id(), "_blank")?.focus();
        } else {
            console.log("no valid url");
            // Give alert, e.g.: https://stackoverflow.com/a/30747020
        }
    }


}

//--- short ADDITIONAL UTIL FUNCTIONS ----

function isValidUrl(url:string){
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
} // via: https://www.freecodecamp.org/news/how-to-validate-urls-in-javascript/ 

// Temporary ("move" to/use from Stylemanager.ts)
function toggleHoverStyle (target:any, show:boolean) {
    target.toggleClass("hover", show);
    if(!target.hasClass("ghost")){
        const outNodes = target.outgoers();
        const inNodes = target.incomers();
        styleEdgesAndNodes(show, outNodes, ["node-incoming", "edge-incoming"]);
        styleEdgesAndNodes(show, inNodes, ["node-outgoing", "edge-outgoing"]);
    }
}

function styleEdgesAndNodes(
    add:Boolean, 
    collection: cytoscape.Collection, 
    style:string[]
) {
    if(add){
        collection.nodes().addClass(style[0]);
    } else {
        collection.nodes().removeClass(style[0]);
    }
}