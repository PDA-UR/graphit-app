import cytoscape from "cytoscape";
import { stylesheet } from "../design/stylesheet";
import { GLOBALS } from "../global/config";
import { INFO_NODES } from "../global/data/infoNodes";
import { StyleController } from "../utils/StyleController";

// Dagre ?? u/o taxi edges

export class PathViz {

    private readonly cy: cytoscape.Core;
    private readonly $container: HTMLElement;
    private readonly styler: any;

    constructor() {
        this.$container = document.getElementById("path") as HTMLElement;
        this.cy = cytoscape({
            container: this.$container,
            style: stylesheet,
            elements: INFO_NODES,
            layout: GLOBALS.breadthLayout,
        });  
        this.styler = new StyleController(this.cy);
    }

    public setElements(
        pathElements: cytoscape.Collection,
        futureEles: cytoscape.Collection,
    ) { 
        // Style the elements
        this.styler.ghost(false, pathElements);
        this.styler.ghost(false, futureEles);

        this.styler.setConnectedColor(pathElements[0], pathElements);
        // const pathers = pathElements.filter("node[weight]");
        this.styler.styleEdgesAndNodes(true, pathElements, ["direct", "edge-direct"], true); // style the Learn-path elemets
        this.styler.styleEdgesAndNodes(true, futureEles, ["connect", "edge-connect"]); // style the rest elements

        this.styler.hide(true, this.cy.$("node[url]")); // hide resources

        this.cy.remove(this.cy.elements());
        this.cy.add(pathElements);
        this.cy.add(futureEles);

        this.cy.elements().removeClass("hover"); // remove hover style

        this.cy.layout(GLOBALS.dagre).run();
    }

    public setPreview(eles:cytoscape.Collection) {

        this.styler.ghost(false, eles);
        eles.removeClass("hover");
        this.styler.hide(true, eles.filter("node[url]")); // hide resources

        this.cy.remove(this.cy.elements());
        this.cy.add(eles);

        // this.cy.fit(eles);

        // keep a SIMILAR layout as the grap
        this.cy.layout(GLOBALS.courseLayout).run();
        //this.cy.layout(GLOBALS.dagre).run();
    }

    public setRedString(eles: cytoscape.Collection) {
        console.log("r", eles.nodes().connectedEdges().classes(), eles.nodes().classes());
        console.log("r", eles);
        
        // const pathEdges = eles.nodes().connectedEdges(".path-edges");

        this.styler.ghost(false, eles);
        eles.removeClass("hover");

        this.cy.remove(this.cy.elements());
        this.cy.add(eles);
        // this.cy.add(pathEdges);

        this.cy.layout(GLOBALS.dagre).run();
    }

    // Anzeige für Sinks??

    public getCore(){
        return this.cy;
    }

}