import cytoscape, { EventObject } from "cytoscape";
import { eventBus } from "../global/EventBus";
import { setFontSize } from "../design/stylesheet";

export class GraphEvents {

    private readonly $cy : cytoscape.Core;
    private readonly $cyPath: cytoscape.Core; // For path view

    constructor(cy: cytoscape.Core, cyPath: cytoscape.Core) {
        this.$cy = cy;
        this.$cyPath = cyPath;
        this.initListeners();
    }

    private initListeners() {
        this.$cy.on("click", "node", this.onClick);
        this.$cy.on("mouseover", "node", this.onMouseOver);
        this.$cy.on("mouseout", "node", this.onMouseOut);
        // this.$cy.on("zoom", this.onZoom);
        document.getElementById("graph")?.addEventListener("wheel", this.onZoom);

        this.$cyPath.on("click", "node", this.onClick);
        this.$cyPath.on("mouseover", "node", this.onMouseOver);
        this.$cyPath.on("mouseout", "node", this.onMouseOut);
        document.getElementById("path")?.addEventListener("wheel", this.onZoom);

        this.initDoubleClick();
        this.$cy.on("dblclick", this.onDoubleClick);
    }

    /* ---- EVENTS ---- */
    
    private onClick = (e:EventObject) => {
        eventBus.emit("click", e.target);
    }

    private onMouseOver = (e:EventObject) => {
        eventBus.emit("mouseover", e.target);
    }

    private onMouseOut = (e:EventObject) => {
        eventBus.emit("mouseout", e.target);
    }

    /**
    * Handle Zooming -> elements change size according to the zoom factor
    * (altered:) via: https://github.com/cytoscape/cytoscape.js/issues/789#issuecomment-1311479154
    */
    private onZoom = () => {
        console.log("zooming...");
        let defaultEdgeSize = 5;
        let currentZoom = this.$cy.zoom();
        let zoomFactor = 1 / currentZoom;
        let edgeSize = zoomFactor * defaultEdgeSize;

        // Only change size for detailed zoom-in 
        if(currentZoom > 0.8) {
            this.$cy.style()
            // @ts-ignore
            .selector('edge')
            // @ts-ignore
            .style('width', edgeSize)
            .selector('node')
            // @ts-ignore
            .style('font-size',  function (node:any) {
                const fontSize:any = setFontSize(node);
                let size = zoomFactor * fontSize;
                return size;
            })
            .style('text-valign', 'center')
            .style('text-halign', 'center')
            .update();
        }
    }

    private initDoubleClick() {
        var doubleClickDelayMs = 350;
        var previousTapStamp:any;
        this.$cy.on("mouseup", function(e:any) {
            var currentTapStamp = e.timeStamp;
            var msFromLastTap = currentTapStamp - previousTapStamp;
        
            if (msFromLastTap < doubleClickDelayMs) {
                e.target.trigger('doubleClick', e);
            }
            previousTapStamp = currentTapStamp;
        });
    } // via: https://stackoverflow.com/a/50446842

    private onDoubleClick = (e:EventObject) => {
        eventBus.emit("dblclick", e.target);
    }

}