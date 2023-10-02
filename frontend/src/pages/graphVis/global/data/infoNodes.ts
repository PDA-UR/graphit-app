export const INFO_NODES : cytoscape.NodeDefinition[] = [

    { group: "nodes", 
        data: {
            id: "info1",
            label: "Vorwissen",
        },
        classes: "info",
    },
    { group: "nodes", 
        data: {
            id: "info2",
            label: "Lerninhalt",
        },
        classes: "info",
    },

    { group: "edges",
        data: {
            id: "info1-info2",
            source: "info2",
            target: "info1",
            label: "wird vorausgesetzt von",
        },
        classes: "info-edge",
    },

]