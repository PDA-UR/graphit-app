import { Stylesheet} from "cytoscape"

const colors = {
    parentText: "#828282",
    path: "#62B2FC",
    hover: "#66C8FE", 
    selected: "white",
    parent: "#f7f7f7",
}

const NODE_SIZE = 80;

const setSize = (ele:any) => {
    const imp = ele.data("relative_importance");
    if (imp === undefined) return NODE_SIZE;
    return ( NODE_SIZE * imp );    
}

export const STYLESHEET: Stylesheet[] = [ 
    { // Default NODE style
        selector: "nodes",
        style: {
            "label": "data(name)",
            "color": "white",
            "font-size": 50,
            "text-wrap": "wrap",
            "text-max-width": "200",
            "width": setSize,
            "height": setSize,
            "opacity": 0.7,
            "z-index": 2,
        }
    },

    {
        selector: ":selected",
        style: {
            "background-color": colors.selected,
            "opacity": 1,
        }
    },

    {
        selector: ".hover",
        style: {
            "background-color": colors.hover,
            "opacity": 1, 
            "font-weight": "bold",
        }
    },

    {
        selector: ".path",
        style: {
            "background-color": colors.path,
            "line-color": colors.path,
            "target-arrow-color": colors.path,
            "mid-target-arrow-color": colors.path,
        }
    },

    { // Default PARENT style
        selector: ":parent", // == "[nodetype='field']"
        style: {
            "background-color": "data(colour)",
            "shape": "round-rectangle",
            "label": "data(name)",
            "opacity": 1,
            "text-halign": "center",
            "text-valign": "center",
            "font-size": 150,
            "color": colors.parentText,
            "z-index": 1, 
            "events": "no",
        }
    },

    { // Default EDGE style
        selector: "edges",
        style: {
            "width": 10,
            "target-arrow-shape": "triangle",
            "mid-target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "opacity": 0.7,
        }
    }

]