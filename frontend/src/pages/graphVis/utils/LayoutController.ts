import cytoscape from "cytoscape";
import { DataManager } from "./DataManager";
import { GLOBALS } from "../global/config";
import { StyleController } from "./StyleController";

export class LayoutController {

    private readonly cy: cytoscape.Core;
    private readonly dataManager: any;
    private readonly styler: any;
    private tempEdges: any = null;
    private tempConnect : any = null;

    constructor(
        cy: cytoscape.Core
    ) {
        this.cy = cy;
        this.dataManager = new DataManager(this.cy);
        this.styler = new StyleController(this.cy);
        // this.tempEdges = this.cy.elements().edges("edge[temp]");
        
    }

    /* ---- LAYOUT MAIN GRAPH ---- */

    // The main layout function
    private layoutGraph() {
        this.tempEdges = this.cy.elements().edges("edge[temp]");

        console.log("temp-edges", this.tempEdges);

        this.cy.layout(GLOBALS.graphLayout).run();
        this.styler.styleGraph(this.cy.elements());
    }

    // Layout the full graph
    public layoutFullGraph() {
        this.dataManager.addCourses();
        this.layoutGraph();
    }

    // BUG: EIMI looses its edges
    public relayoutFullGraph() {
        const eles = this.cy.elements();

        this.cy.remove(this.tempConnect); //remove temporary connection btw course and first red string elements
        this.cy.add(this.tempEdges);
        this.styler.hide(false, this.tempEdges); // unhide hidden temp edges

        // Restyle graph to initial styling
        this.styler.ghost(false, eles, true);
        this.styler.hide(false, eles);
        this.styler.styleEdgesAndNodes(
            false, this.cy.elements(), ["connect", "edge-connect"]
        ); // hide connected style
        eles.edges().removeClass("path-edges"); // remove path style
        this.layoutGraph();
    }

    /* ---- LAYOUT COURSE --- */

    public layoutCourse(courseNodes: cytoscape.Collection) {
        this.styler.ghost(false, courseNodes); // unghost all elements
        this.styler.hide(true, this.cy.elements().not(courseNodes)); // hide other
        
        courseNodes.layout(GLOBALS.courseLayout).run();

        this.styler.styleCourse(courseNodes)
    }

    /**
     * Create a learning path for the entered course
     * @param courseNodes The nodes of the current course
     */
    public layoutRedString(courseNodes: cytoscape.Collection) {
        console.log("layout red string", courseNodes.classes(), courseNodes);

        this.styler.hide(true, this.cy.elements().not(courseNodes)); // hide other
        
        // remove temporary edges, i.e. edges that connect nodes to the course
        this.cy.remove(this.tempEdges);

        // set the path through the course
        const pathNodes = courseNodes.filter("node[important]");
        let paths = this.setCoursePath(courseNodes, pathNodes);

        // Layout the courses
        const course = this.cy.$id(courseNodes.data("course"));
        // this.setCoursesAfterPath(course, pathNodes[0]);
        // TODO: set in data -> make dynamic
        console.log("pathNodes[0]", pathNodes[0].id());
        const pixel = pathNodes.filter("[label = 'Pixels']");
        if (pixel.length > 0) {
            console.log("pixel", pixel);
            this.setCoursesAfterPath(course, pathNodes.filter("[label = 'Pixels']"))
        } else this.setCoursesAfterPath(course, pathNodes[0]);
        console.log("pathNodes[0]", pathNodes[0]);
        // this.setCoursesAfterPath(course, pathNodes.filter("[label = 'Pixels']"));

        // TRY -> not that great
        // Set a constraint to put first path node top left & last n bot-ri
        // let layoutoptions = GLOBALS.courseLayout;
        // const w = this.cy.width();
        // const h = this.cy.height();
        // layoutoptions.fixedNodeConstraint = [
        //     {nodeId: pathNodes[0].id() , position: {x: -900, y: -500}},
        //     {nodeId: pathNodes[pathNodes.length-4].id(), position: {x: 300, y: 800}}
        // ]

        console.log("layout", GLOBALS.courseLayout);

        // WORKS
        courseNodes.layout(GLOBALS.courseLayout).run();
        // pathNodes.layout(GLOBALS.breadthLayout).run();
        // pathNodes.layout(GLOBALS.courseLayout).run();

        // console.log(pathNodes[0].position());

        paths = paths.union(this.tempConnect); // Add the temporary connected btw course and first path

        return paths; // return redString-path for PathViz

    }


    /**
     * Creates a learning path for the current course
     * @param nodes All the current course nodes
     * @param pathNodes The nodes to include in the learning path
     */
    private setCoursePath(nodes: cytoscape.Collection, pathNodes: cytoscape.Collection) {
        let paths: cytoscape.Collection = pathNodes;
        for (let i = 0; i < pathNodes.length - 1; i++) {
            let aStar = nodes.aStar({
                root: pathNodes[i],
                goal: pathNodes[i+1],
                directed: false,
            });
            if(aStar.path) {
                this.styler.ghost(false, aStar.path);
                aStar.path.nodes().data("important", true);
                aStar.path.edges().addClass("path-edges");
                // aStar.path.edges().data("redString", true);

                paths = paths.union(aStar.path.nodes());
                paths = paths.union(aStar.path.edges());
            }
        }
        return paths;
    }

    /**
     * Connect the course to the first node of the path
     * @param course The current course
     * @param start The first node of the path through the course
     */
    private setCoursesAfterPath(course: cytoscape.NodeSingular, start: cytoscape.NodeSingular){
        // const courses = this.cy.$(".course");
        // Connect the courses to the first node of the red string
        // let startID;
        // if(start.id()) startID = start.id();
        // else startID = start.data("label");

        const edge = this.cy.add({ group: "edges",
            data: {
                id: `${start.id()}-${course.id()}`,
                source: start.id(),
                target: course.id(),
                temp: true,
                }
        });
        // connect courses between each other -> done in coursedata.ts
        // + connect this course to the first path node
        // course.position({x:200, y: 50});
        // courses.layout(GLOBALS.breadthLayout).run();
        this.tempConnect = edge;
    }

}