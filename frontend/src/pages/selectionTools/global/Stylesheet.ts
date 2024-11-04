import { Stylesheet} from "cytoscape"

const colors = {
    default: "#999",
    completed: "#6DBB6D",
    goal: "#B7B10F",
    interested: "#6340E3",
    indicated: "#FEDD00",
    lastClicked: "#77aeff",
    selected: "#92b0dd", //"#4377c6",
    parent: "#f7f7f7"
}

const getHeight = (ele: any) => {
    // get linelength + if text longer than it
    // use fontSize
    let label = ele.data("label")
    // length dependent on fontsize
    // console.log("h",  label.length)
    if (label.length > 25) { // get multiplier (%)
        console.log("h",  Math.ceil(label.length / 25))
        return fontSize(ele) * Math.ceil(label.length / 25) // + line distance(?)
        
    } 
    return fontSize(ele);
}

const nodeSize = (ele: any) => {
	let degree = ele.degree();
	if(degree == 0) {
		degree = 1;
	}
	return 7 + degree * 7;
};

const maxFont = 32
const minFont = 12
const fontSize = (ele: any) => {
	let size = nodeSize(ele) / 3;
	// let size = ele.degree() * 2;
	if (size > maxFont) return maxFont
	if (size < minFont) return minFont;
	return size;
    // return nodeSize(ele) / 2;
}

const lineLength = (ele:any) => {
	let label = ele.data("label");
	let len =  nodeSize(ele) + (fontSize(ele)*5);

	if (label.length > 30) { // if label too long, longer line length
		return (len * 2).toString();
	}
	return len.toString();
}


const selectedFontSize = (ele:any) => {
	return fontSize(ele) + 2;
}

const nodeDarken = (ele:any) => {
	const degree = ele.degree()
	if (degree > 8) return 0.8;
	if (degree < 2) return 0.4;
	return ele.degree() / 10;

}

const switchTextColor = (ele:any) => {
	if(nodeDarken(ele) > 0.5) return "white"
	return "black"
}

export const stylesheet: Stylesheet[] = [ 
    { // Default node style
        selector: "node",
        style: {
            "background-color": colors.default, //"#666", //"#D6D6D6",
            "background-opacity": nodeDarken,
            "label": "data(label)",
            // NOTE: "label" is deprecated,, but still works
            "width": "label",
            "height": "label",
            "shape": "round-rectangle",

            'text-halign': 'center',
            'text-valign': 'center',
            // @ts-ignore
            "padding": 5,
            "font-size": fontSize,
            "text-events": "yes",
            "text-wrap": "wrap",
            "text-max-width": lineLength, //px -> use size of node
            "text-background-padding": "3px",
            "z-index": nodeSize,

            "border-width": "2px",
            "border-opacity": 0,
            "opacity": 1,
        },
    },
    { // Default edge style
        selector: "edge",
        style: {
            width: 3,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "opacity": 0.5,
        },
    },
    {
        selector: "node[completed = 'true']",
        style: {
            "background-color": colors.completed,
            "border-color": colors.completed,
            "border-opacity": 1, 
        },
    },
    {
        selector: "node[interested = 'true']",
        style: { // NOTE: background-image handled in CytoscapeExtension.ts
            "background-color": colors.interested,
            "border-color": colors.interested,
            "border-opacity": 1, 
        }
    },
    {
        selector: "node[interested = 'true'][completed = 'true']",
        style: { 
            "background-color": colors.completed,
            "border-color": colors.interested,
            "border-opacity": 1,
        },
    },
    {
        selector: "node[goal = 'true']",
        style: { 
            "border-color": colors.goal,
            "border-style": "double",
            "border-opacity": 1,
            "border-width": "4px",
            "z-index": 50, 
        },
    },

    {
        selector: "node:selected",
        style: { // BLUE select, e.g. lasso
            "z-index": 1,
            "border-width": "2px",
            "border-color": colors.lastClicked,
            "border-opacity": 1,
        },
    },
    {
        selector: "node.last-clicked",
        style: { 
            "border-width": "4px",
            "border-color": colors.lastClicked,
            "border-opacity": 1,
        },
    },

    {
        selector: "node:selected.last-clicked",
        style: {
            "border-width": "4px",
            "border-color": colors.lastClicked,
            "border-opacity": 1,
        },
    },

    {
        selector: "node.indicated",
        style: {
            "background-color": colors.indicated,
            "background-opacity": 1,
            "z-index": 500,
        },
    },
    {
        selector: "node.indicated[label]",
        style: {
            "z-index": 9999999999,
            "font-size": selectedFontSize,
            "font-weight": "bold",
        },
    },

    {
        selector: ".dimmed, .path-dimmed",
        style: {
            opacity: 0.4,
        },
    },
    {
        selector: ".filter-fade",
        style: {
            opacity: 0.4,
        },
    },


    // STYLES FOR THE PATH-CORE (for easier separation)
    {
		selector: "edge.path-incoming, edge.path-outgoing",
		style: {
			"line-fill": "linear-gradient",
			// @ts-ignore
			"line-gradient-stop-positions": "0 100%",
			// @ts-ignore
			"line-gradient-stop-colors": "black #FEDD00",
			"target-arrow-color": "#FEDD00",
			"width": 4,
			"z-index": 1000,
			"line-opacity": 1,
		},
	},
	{
		selector: ".path-neighbor",
		style: {
			"z-index": 10,
			"border-color": "#FEDD00",
			"border-opacity": 1,
		},
	},
    {
        selector: ".neighbor-preview",
        style: {
            "backgroundColor": "#FFF",
            "border-color": colors.default,
        }
    },
    {
        selector: ":parent",
        style: {
            "background-color": colors.parent,
        }
    },
    {
        selector: ":parent.indicated",
        style: {
            "background-color": colors.parent,
            "background-blacken": 0.05, 
            "z-index": 500,
        }
    },
    {
        selector: ".path-selected",
        style: { // BLUE select, e.g. lasso
            "background-color": colors.selected,
            "background-opacity": 0.7,
            "z-index": 1,
        },
    },
    {
        selector: ".path-indicated",
        style: {
            "background-color": colors.indicated,
            "background-opacity": 1,
            "z-index": 500,
        },
    },
    {
        selector: ".path-opener",
        style: {
            "border-color": "black",
            "border-opacity": 1,
            "border-width": 2,
        }
    }
]