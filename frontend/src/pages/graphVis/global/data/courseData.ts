import { NodeDefinition } from "cytoscape";

// Parent nodes for the courses depicted in the graph
// Currently static
export const COURSES : NodeDefinition[] = [
    { group: "nodes", 
        data: {
            id: "cgbv",
            label: "Computergraphik und Bildverarbeitung",
        },
        classes: "course",
    },
    { group: "nodes",
        data: {
            id: "eimi",
            label: "Einführung in die Medieninformatik",
        },
        classes: "course"
    },

    { group: "edges",
    data: {
        id: "eimi-cgbv",
        source: "cgbv",
        target: "eimi",
        course: "true",
        }
    },

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