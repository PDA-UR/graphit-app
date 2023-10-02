import { Stylesheet } from "cytoscape";
import { connectColors, nodeColors } from "../global/colorsCofig";

let amount : number = 4;

/* ---- Utility Functions ---- */

const minFont = 18;
const maxFont = 40;
export const setFontSize = (node:any) => {
    const degree = node.degree();
    if(node.hasClass("ghost")) {
        return minFont;
    } else if(node.hasClass("course")){
        return degree < maxFont ? maxFont : degree;
    }
    return degree > maxFont ? degree : minFont + degree;
}

const ghostSize = (ele:any) => {
    return nodeSize(ele) / 2;
}

const nodeSize = (ele: any) => {
	const degree = ele.degree();
    const res = 7 + degree * 7;
	return res > 100 ? 100 : res;
};

// Make font white for the first two gradient colors
const getFontColor = (ele:any) => {
    // console.log(ele.style("background-color"));
    const bg = ele.style("background-color");
    if (bg == "rgb(119, 103, 134)" || bg == "rgb(142, 127, 158)") {
        return "white"
    } else return "black";
}

export const stylesheet: Stylesheet[] =  [

    /* NODES */
    
    // Default node styling
    { selector: 'node',
    style: { 
        'label': 'data(label)',
        'background-color': nodeColors.grey1, 
        'text-wrap': 'wrap',
        "text-max-width": '180',
        'width': 'label',
        'height': 'label',
        'shape': 'rectangle',
        'text-halign': 'center',
        'text-valign': 'center',
        'font-size': setFontSize, 
        // @ts-ignore
        'padding': 5,
        'text-events': 'yes',
        }
    },

    { selector: '.ghost',
        style: {
            //'opacity': 0.3, 
            'opacity': 0.75, 
            'shape': 'ellipse',
            'background-color': nodeColors.lightgrey2,
            'label': 'data(label)', //Label doesn't take up space
            'text-opacity': 0,
            'z-compound-depth': 'bottom',
            //'events': 'no',
            'width': ghostSize,
            'height': ghostSize,
        }
    },

    // Show connected
    { selector: '.connect',
    style: {
        'background-color': nodeColors.lightgrey,
        'text-opacity': 1,
        'width': 'label',
        'height': 'label',
        'shape': 'rectangle',
        }
    },

    // HIGHLIGHT learning path -> i.e direct connected
    { selector: '.direct',
    style: {
        'background-color': 'mapData(weight, 0,' 
            + amount + ','
            + connectColors.close + ',' 
            + connectColors.far + ')',
        'color': getFontColor,
        // 'color': 'mapData(weight, 0 ,'
        //     + 1 + ', white, black)',
        }
    },

    { selector: '.target-connect',
    style: {
        'border-color': connectColors.tBorder,
        'border-width': 5,
        'border-opacity': 1,
        'background-color': connectColors.target,
        'color': 'white',
        'text-opacity': 1,
        'width': 'label',
        'height': 'label',
        'shape': 'rectangle',
        "z-index": 100,
        }
    },

    // HIGHLIGHT on HOVER
    { selector: ".hover",
    style: {
        'border-width': 5,
        'border-color': 'black',
        'label': 'data(label)',
        // 'font-weight': 'bold',
        'text-opacity': 1,
        'width': 'label',
        'height': 'label',
        'shape': 'rectangle',
        'font-size': setFontSize,
        //'text-background-color': 'white',
        // 'text-background-opacity': 1, 
        'text-wrap': 'wrap',
        'z-compound-depth': 'top',
        'z-index': 1000,
        }   
    },


    // incoming node
    { selector: '.node-incoming',
    style: {
        'background-color': nodeColors.grey1,
        // 'border-color': 'black',
        'text-wrap': 'wrap',
        'text-opacity': 1,
        'font-size': setFontSize,
        'color': 'black',
        'width': 'label',
        'height': 'label',
        'shape': 'rectangle',
        // @ts-ignore
        'padding': 5,
        'z-compound-depth': 'top',
        }
    },
    // outgoing node
    { selector: '.node-outgoing',
    style: {
        //'background-color': hoverColors.outgoing,
        'text-wrap': 'wrap',
        'text-opacity': 1,
        'font-size': setFontSize,
        'color': 'black',
        'width': 'label',
        'height': 'label',
        'shape': 'rectangle',
        // @ts-ignore
        'padding': 5,
        'z-compound-depth': 'top',
        }
    },

    // COURSES:
    { selector: '.course',
        style: {
        'width': 'label',
        'height': 'label',
        'label': 'data(label)',
        'font-weight': 'bold',
        'font-size': setFontSize,
        'text-transform': 'uppercase',
        'text-halign': 'center',
        'text-valign': 'center',
        'text-wrap': 'wrap',
        'border-color': 'black',
        'border-opacity': 1,
        'border-width': 5,
        }
    },

/* ---------------------------------------- */

    /* EDGES */

    // Default edge styling
    { selector: 'edge',
    style: {
        'source-arrow-shape': 'triangle',
        'line-color': nodeColors.grey1,
        'source-arrow-color': nodeColors.grey1,
        'curve-style': 'straight',
        'events': 'no',
        'z-compound-depth': 'auto',
        'width': 5,
        'line-opacity': 1, 
        'label': '',
        }
    },

    { selector: '.ghost-edges',
    style: {
        'line-opacity': 0.3,
        'line-color': nodeColors.lightgrey,
        'source-arrow-color': nodeColors.lightgrey,
        'z-compound-depth': 'bottom',
        'source-arrow-shape': 'none',
        'label': '',
        }
    },

    { selector: '.edge-connect',
    style: {
        'line-color': nodeColors.lightgrey05,
        'source-arrow-color': nodeColors.lightgrey05,
        'z-compound-depth': 'auto',
        'label': '',
        }
    },

    { selector: '.path-edges',
    style: {
        'line-color': nodeColors.grey,
        'source-arrow-color': nodeColors.grey,
        }
    },

    { selector: '.edge-direct',
    style: {
        'line-color': 'mapData(weight, 0, '
            + amount +',' 
            + connectColors.close + ',' 
            + connectColors.far + ')',
        'source-arrow-color': 'mapData(weight, 0, '
            + amount +','  
            + connectColors.close + ',' 
            + connectColors.far + ')',
        'z-compound-depth': 'auto',
        'label': '',
        }
    },
        

]