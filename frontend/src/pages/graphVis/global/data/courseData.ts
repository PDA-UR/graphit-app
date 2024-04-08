import { NodeDefinition } from "cytoscape";

// Parent nodes for the courses depicted in the graph
// Currently static
export const COURSES : NodeDefinition[] = [

    // WissArb.
    { group: "nodes",
        data: {
            id: "wissArb",
            label: "Wissenschaftliches Arbeiten",
            courseLabel :"Wissenschaftliches Arbeiten 24SS"
        },
        classes: "course"
    },

    //CGBV
    { group: "nodes", 
        data: {
            id: "cgbv",
            label: "Computergraphik und Bildverarbeitung",
            courseLabel: 'CGBV 24SS',
        },
        classes: "course",
    },
    //EIMI
    // { group: "nodes",
    //     data: {
    //         id: "eimi",
    //         label: "Einführung in die Medieninformatik",
    //     },
    //     classes: "course"
    // },

    // { group: "edges",
    // data: {
    //     id: "wissArb-cgbv",
    //     source: "wissArb",
    //     target: "cgbv",
    //     course: "true",
    //     },
    //     classes: "course",
    // },
    // { group: "edges",
    // data: {
    //     id: "cgbv-wissArb",
    //     source: "cgbv",
    //     target: "wissArb",
    //     course: "true",
    //     },
    //     classes: "course"
    // },

    //OLD
    /*{ group: "nodes",
        data: {
            id: "math1",
            label: "Mathematik für Medieninformatik 1",
        },
        classes: "course"
    },
    { group: "nodes",
    data: {
        id: "math2",
        label: "Mathematik für Medieninformatik 2",
    },
    classes: "course"
    },
    { group: "nodes",
        data: {
            id: "prop",
            label: "Propädeutikum",
        },
        classes: "course"
    },
    { group: "nodes",
        data: {
            id: "oop",
            label: "Objektorientierte Programmierung",
        },
        classes: "course"
    },


    // EDGES
    { group: "edges",
    data: {
        id: "math1-math2",
        source: "math2",
        target: "math1",
        }
    },
    { group: "edges",
    data: {
        id: "oop-cgbv",
        source: "cgbv",
        target: "oop",
        }
    }, */

];

// for Test purposes
// TODO: make dynamic
export const EDUCATORS : NodeDefinition[] = [
    { group: "nodes",
        data: {
            id: "rw",
            label: "Raphael Wimmer",
            site: "https://www.uni-regensburg.de/sprache-literatur-kultur/medieninformatik/sekretariat-team/raphael-wimmer/index.html"
        },
        classes: "educator",
    },
    { group: "edges",
        data: {
            id: "rw-cgbv",
            source: "rw",
            target: "cgbv",
        }
    }
];