import cytoscape from "cytoscape";
import viewUtilities from  "cytoscape-view-utilities";


export class StyleController {

    private readonly cy: any;
    private api : any;

    constructor(cy: cytoscape.Core) {
        this.cy = cy;
        this.initViewUtilities();
    }

    private initViewUtilities() {
        viewUtilities(cytoscape);
        this.api = this.cy.viewUtilities();
    }


    /**
     * Applies to ghost style to nodes and edges in the collection
     * @param ghost if true: ghost | if false: unghost
     * @param eles the elements(nodes) to style
     * @param connected Default=false | if true: styles the connectedEdges()
     */
    public ghost(
        ghost: boolean=true, 
        eles: cytoscape.Collection,
        connected:Boolean=false
    ) {
        this.styleEdgesAndNodes(ghost, eles, ["ghost", "ghost-edges"], connected);
        ghost ? eles.nodes().ungrabify() : eles.nodes().grabify();
        //ghost ? eles.nodes().lock() : eles.nodes().unlock(); //Lock their positions
    }

    /**
     * Hides all given nodes and their edges
     * @param hide wether to hide or not
     * @param eles the collection of elements
     */
    public hide(
        hide: boolean=true,
        eles: cytoscape.Collection,
    ) {
        hide ? this.api.hide(eles) : this.api.show(eles);
    }

    public styleGraph(eles: cytoscape.Collection) {
        const displayed = this.cy.$(".course").neighborhood("[[degree >"+ 4 + "]]");
        displayed.data("important", "true"); // added for easier access
        const notDisplayed = eles.not(displayed);
        this.ghost(true, notDisplayed, true);
        this.hide(true, this.cy.$("node[url]"));
    }

    public styleCourse(eles: cytoscape.Collection) {
        const ghost = eles.not("node[important]");
        this.ghost(true, ghost, true);
    }

    // BUG: sometimes Edges stay as labels
    public styleConnected(
        target:cytoscape.NodeSingular,
        eles: cytoscape.Collection
    ) {

        // console.log("connected in StyleController", eles);

        // (re)ghost all nodes that are not important
        const ghost = this.cy.elements().not(eles).not("node[important]");
        this.ghost(true, ghost, true);
        ghost.removeClass("node-outgoing");

        // Unghost elements in the collection
        this.ghost(false, eles, false);

        // Remove previous connected Style on all elements
        this.styleEdgesAndNodes(false, this.cy.elements(), ["direct", "edge-direct"], true);
        this.styleEdgesAndNodes(false, this.cy.elements(), ["connect", "edge-connect"]);
        this.cy.elements().removeClass("target-connect");

        
        // Highlight the learning path with color
        let path = target.successors(); 
        // filter for only successors in eles
        let weights = eles.intersection(path); // GEHT NICHT

        this.setConnectedColor(target, weights);
        this.styleEdgesAndNodes(true, weights, ["direct", "edge-direct"], true);

        // Style all connected edges and nodes that aren't in the learning path or red string
        const unstyle = weights.union("node[important]");
        this.styleEdgesAndNodes(true, eles.not(unstyle), ["connect", "edge-connect"]);
        target.addClass("target-connect");

        // this.cy.center(target); // nur wenn click auf Pathviz

    }

    /* ---- Utility Functions ---- */

    /**
    * A function that bundles a simple styling action for both nodes and edges
    * @param add If true: add a style | if false: remove a style
    * @param collection the collection of nodes and edges to perform the styling on 
    * @param style A string array of the node style and the edge style
    * @param connected Default=false | if true: styles the connectedEdges()
    */
    public styleEdgesAndNodes(
        add:Boolean, 
        collection: cytoscape.Collection, 
        style:string[],
        connected:Boolean=false,
    ) {
        const nodes = collection.nodes();
        let edges;
        connected ? edges = nodes.connectedEdges() : edges = collection.edges();
        if(add) {
            nodes.addClass(style[0]);
            edges.addClass(style[1]);
        } else {
            nodes.removeClass(style[0]);
            edges.removeClass(style[1]);
        }
    }

    /**
    * Set a weight for every node that will later map the style
    * @param target The first node
    * @param eles The rest of the node collection
    */
    // TODO: only dependents !!
    public setConnectedColor(target: cytoscape.NodeSingular, eles:cytoscape.Collection) {
        //target.data("weight", 0);
        // set maxDepth for mapper ??
        // let maxDepth = 0;
        eles.bfs({
            roots: target,
            //@ts-ignore
            visit: function(v, e, u, i, depth) {
                if(e?.isEdge) {
                    e.data("weight", depth);
                }
                if(v.isNode()){
                    v.data("weight", depth);
                    // v.connectedEdges().data("weight", depth); //??
                }
                // if(depth > maxDepth) maxDepth = depth
            },
            directed: true,
        });
        // eles.data("maxDepth", maxDepth); // probably needs custom mapper
    }


}