import cytoscape from "cytoscape";

// import EIMI from "../global/data/eimi.json"; 
import EIMI from "../../../data/eimi.json";
import { COURSES, EDUCATORS } from "../global/data/courseData";
import { getCircularReplacer } from "../global/DataManager";

// Manage additional Data that is to be added to the cy-core
export class DataManager {

    private readonly cy: cytoscape.Core;

    constructor(
        cy: cytoscape.Core
    ){
        this.cy = cy;
    }

    /**
     * Adds additional courses (super- and sub-nodes). INFO: Needs rework
     */
    public addCourses() {
        // BUG: adds the COURSES-nodes, but also not really -> needs edges
        const courseNodes = this.cy.add(COURSES);
        console.log("hi1", courseNodes)
        console.log("hi", this.cy.elements("#wissArb").data(), this.cy.elements("#wissArb").id())
        console.log("cl", this.cy.elements("#wissArb").classes())
        // console.log(JSON.stringify(this.cy.elements(), getCircularReplacer()))

        // TODO: check for edges, that want wissArb as source/target
        // These cause issues (temp fixed) later on

        // NOTE: wissArb-Elemente have no nodeClass!! BUT this also gets other eles
        // let nodes = this.cy.elements().nodes()
        // .filter('[^nodeClass]')
        //     .not('[label="Python Basics"]')
        //     .not('[label="2D Vector Graphics"]')
        //     .not('[label="Neural Radiance Fields (NeRFs)"]')
        //     .not('[label="Exam: CGBV SS23"]')
        //     .not('[label="Mathematical Foundations"]')
        //     .not('[label="SL: Mini-Gimp"]'); 


        // NOTE: get all nodes part of the specific course
        let wissArbData = this.cy.elements().nodes().filter('[courseLabel="Wissenschaftliches Arbeiten 24SS"]');
        wissArbData = wissArbData.union(wissArbData.connectedEdges());

        this.connectCourse(this.cy, wissArbData, "wissArb");
        // this.cy.elements().data("course", "wissArb");
        wissArbData.data("course", "wissArb");


        // CGBV
        // let cgbvData = this.cy.elements().nodes().not(wissArbData);
        let cgbvData = this.cy.elements().nodes().filter("[courseLabel='CGBV 24SS']")
        cgbvData = cgbvData.union(cgbvData.connectedEdges());

        this.connectCourse(this.cy, cgbvData, "cgbv");
        cgbvData.data("course", "cgbv"); // add data field for access (magical "number"!)
        console.log("cgbvData", cgbvData)

        // console.log("hi", this.cy.elements("#wissArb").data())
        // console.log("cl", this.cy.elements("#wissArb").classes())

        // // Eimi (only works with eimi.js) + courseData.ts (uncomment eimi-section)
        // const eimiData = this.cy.add(EIMI as cytoscape.ElementDefinition[]);
        // eimiData.move({parent: null}); //move Eimi out of parents
        // this.connectCourse(this.cy, eimiData, "eimi");
        // eimiData.data("course", "eimi");

        // this.cy.add(EDUCATORS);

        // TEST remove edges between courses //wissArb wissArb, cgbv wissArb, eimi wissArb, wissArb cgbv
        // this.cy.remove("#wissArb-wissArb");
    }

    //NEW: for Testing
    // Connect only to the course and not the courses to each other

    /**
     * Connects all Sources/Origins of a Course to the Course-Node
     * NOTE: hides edges between supernodes (i.e courses)
     * @param cy The cytoscape core for the graph
     * @param eles The collection of elements to connect (includes course)
     * @param courseId The course to connect to
     */
    private connectCourse(
        cy:cytoscape.Core, 
        eles:cytoscape.Collection,
        courseId:String,
    ) {
        // const maxD = eles.nodes().maxDegree(false);

        eles.nodes().forEach(ele => {
            if(ele.outdegree(false) <= 1) { // if no sources
                let edge = cy.add(this.newCourseEdge(ele.id(), courseId));
                // console.log(edge.style())
                if(ele.hasClass("course")) { // hide the edges between supernodes (courses)
                    console.log("edge", edge.id());
                    edge.style("visibility", "hidden");
                }
            }
        })

    }


    /**
     * A function that connects all Sources/Origins of a Course to the Course-Node (additionally)
     * NOTE: a source is a node that has no outgoing edges (only incomming) -> good starting point
     * @param cy The cytoscape core object
     * @param eles A collection of all elements to be connected
     * @param courseId The course to which they should connect
     */
    // TODO: Hier: die maxDegrees mit Kurs verbinden + Knoten ohne Verbindungen
    private connectCourseOLD(
        cy:cytoscape.Core, 
        eles:cytoscape.Collection,
        courseId:String,
    ) {
        const maxD = eles.nodes().maxDegree(false);

        // TEST: Do not make edges between the courses

        eles.nodes().forEach(ele => {
            if(ele.outdegree(false) == 0) { // If node is source/origin connect to course-node
                // Here: edge problems later on -> don't connect courses together
                if(ele.hasClass("course")) console.log("eles", ele.id(), courseId);
                cy.add(this.newCourseEdge(ele.id(), courseId));
            } else if(ele.outdegree(false) == 0 && ele.indegree(false) == 0) { // If node is orphan ??
                cy.add(this.newCourseEdge(ele.id(), courseId));
            } else if(ele.degree(false) == maxD ) {
                cy.add(this.newCourseEdge(ele.id(), courseId));
            }
        });
    }

    /**
     * Make a new edge pointing from a source to a target (course)
     * @param eleSource specify the id of the origin 
     * @param eleTarget specify the id of the target, i.e the course-node
     * @returns a new edge-element
     */
    private newCourseEdge(eleSource:String, eleTarget:String) {
        return [ { group: "edges",
        data: {
            id: `${eleSource}-${eleTarget}`,
            source: eleSource,
            target: eleTarget,
            temp: true,
            }
        }
    ] as cytoscape.ElementDefinition[];
    }
}