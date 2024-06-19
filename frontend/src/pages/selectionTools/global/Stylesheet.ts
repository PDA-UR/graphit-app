import { Stylesheet} from "cytoscape"

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
	let size = nodeSize(ele) / 2;
	// let size = ele.degree() * 2;
	if (size > maxFont) return maxFont
	if (size < minFont) return minFont;
	return size;
    return nodeSize(ele) / 2;
}

const lineLength = (ele:any) => {
	let label = ele.data("label")
	let len =  nodeSize(ele) + (fontSize(ele)*5)

	if (label.length > 30) { // if label too long, longer line length
		return (len * 2).toString();
	}
	return len.toString()
}


const selectedFontSize = (ele:any) => {
	return fontSize(ele) + 5;
}

const nodeDarken = (ele:any) => {
	const degree = ele.degree()
	if (degree > 8) return 0.8;
	if (degree < 2) return 0.2;
	return ele.degree() / 10;

}

const switchTextColor = (ele:any) => {
	if(nodeDarken(ele) > 0.5) return "white"
	return "black"
}

export const stylesheet: Stylesheet[] = [ 
    {
        selector: "node",
        style: {
            "background-color": "#999", //"#666", //"#D6D6D6",
            "background-opacity": nodeDarken,
            "label": "data(label)",
            "width": nodeSize,
            "height": nodeSize,
            "shape": "ellipse",
            "text-justification": "center",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": fontSize,
            "text-events": "yes",
            "text-wrap": "wrap",
            "text-max-width": lineLength, //px -> use size of node
            "text-background-color": "#C2C2C2",
            "text-background-opacity": nodeDarken, //0.75,
            // @ts-ignore
            "text-background-shape": "round-rectangle",
            "text-background-padding": "3px",
        },
    },
    {
        selector: "node:selected",
        style: { // BLUE select
            "background-color": "#257AFD",
            "text-background-color": "#81b3ff",
            "text-background-opacity": 1,
            "text-background-shape": "roundrectangle",
            "text-background-padding": "3px",
            "color": "black"
        },
    },
    // edges of selected nodes
    {
        selector: "node[label]",
        style: {
            // @ts-ignore
            "text-margin-y": "-8px",
        },
    },
    {
        selector: "node.indicated[label]",
        style: {
            "z-index": 9999999999,
            "font-size": selectedFontSize,
        },
    },
    {
        selector: "node[completed = 'true']",
        style: {
            "background-color": "#6DBB6D",
            "text-background-color": "#6DBB6D",
            "text-border-color": "#6DBB6D",
            // "background-blacken": 0, 
        },
    },
    {
        selector: "node[interested = 'true']",
        style: { // NOTE: background-image handled in CytoscapeExtension.ts
            "shape": "star",
            'text-halign': 'center',
            'text-valign': 'center',
            "width": nodeSize,
            "height": nodeSize,
            "text-border-opacity": 1,
            "text-border-width": 2,
            "text-border-color": "#6340E3",
            "text-border-style": "dashed",
        }
    },
    {
        selector: "node[goal = 'true']",
        style: { 
            "background-color": "#2473BC", //"#BE234F", //#FF5484
            "text-background-color": "#2473BC", // "#BE234F",
            "color": switchTextColor,
            "z-index": 0,
        },
    },
    { // style goals that have been completed (othwise doesn't style)
        selector: "node[goal = 'true'][completed = 'true']",
        style: {
            "text-border-opacity": 1,
            "text-border-width": 2,
            "text-border-color": "#6DBB6D", //"#BE234F",
            "background-color": "#6DBB6D", 
            "z-index": 0,
        },
    },
    {
        selector: "node[goal = 'true'][interest = 'true']",
        style: {
            "text-border-color": "#6340E3", //"#BE234F",
        },
    },
    {
        selector: "edge",
        style: {
            width: 3,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
        },
    },

    {
        selector: "node.last-clicked",
        style: {
            backgroundColor: "#474747",
            "border-width": "7px",
            "border-color": "black",
        },
    },
    {
        selector: "node:selected.last-clicked",
        style: {
            backgroundColor: "#4377c6",
        },
    },
    {
        selector: "node.indicated",
        style: {
            "border-color": "#FEDD00",
            "border-width": "3px",
            "text-background-color": "#FEDD00",
            "text-background-opacity": 1,
            "z-index": 10,
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

]