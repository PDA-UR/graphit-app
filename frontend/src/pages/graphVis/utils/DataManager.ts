import cytoscape from "cytoscape";

import EIMI from "../global/data/eimi.json"; 
import { COURSES, EDUCATORS } from "../global/data/courseData";

// Manage additional Data that is to be added to the cy-core
export class DataManager {

    private readonly cy: cytoscape.Core;

    constructor(
        cy: cytoscape.Core
    ){
        this.cy = cy;
    }

    /**
     * Adds additional courses
     * Currently only EIMI
     */
    public addCourses() {
        this.cy.add(COURSES);
    
        this.connectCourse(this.cy, this.cy.elements(), "cgbv");
        this.cy.elements().data("course", "cgbv"); // add data field for access (magical "number"!)
        
        // Eimi -> knoten sind nicht mit kurs verbinden -> manchmal keine Sinks
        // TODO: Hier: die maxDegrees mit Kurs verbinden + Knoten ohne verbindungen
        const eimiData = this.cy.add(EIMI as cytoscape.ElementDefinition[]);
        eimiData.move({parent: null}); //move Eimi out of parents
        this.connectCourse(this.cy, eimiData, "eimi");
        eimiData.data("course", "eimi");

        this.cy.add(EDUCATORS);

    }

    /**
     * A function that connects all Sources/Origins of a Course to the Course-Node (additionally)
     * NOTE: a source is a node that has no outgoing edges (only incomming) -> good starting point
     * @param cy The cytoscape core object
     * @param eles A collection of all elements to be connected
     * @param courseId The course to which they should connect
     */
    // TODO: Hier: die maxDegrees mit Kurs verbinden + Knoten ohne Verbindungen
    private connectCourse(
        cy:cytoscape.Core, 
        eles:cytoscape.Collection,
        courseId:String,
    ) {
        const maxD = eles.nodes().maxDegree(false);

        eles.nodes().forEach(ele => {
            if(ele.outdegree(false) == 0) { // If node is source/origin
                // connect to course-node
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