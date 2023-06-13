// Zuzeit noch .ts wegen Kommentaren
// Besser als json?

import { EdgeSingular, NodeSingular } from "cytoscape";

// Select color of parent for child nodes
function getParentColor(node:NodeSingular){
    var parent = node.parent();
    if(parent.data("parentcolor") != null) {
        return parent.data("parentcolor");
    } else {
        //when parent is collapsed, parent is target node
        //console.log(node.data("parentcolor"));
        console.log(node.id());
        return node.data("parentcolor");
        //return "black";
        //!! Works, but returns warning that node.data is null
    }
}

export default [
    // NODE
    { selector: "node",
        style: { // Show node with label
            'label': 'data(label)',
            'text-wrap': 'wrap',
            'text-max-width': '100',
            'border-color': "#666",
            'background-color': getParentColor.bind(this),
            'background-blacken': "0.3",
        }
    },

    //Collapsing all child nodes to one parent
    { selector: '.collapsed-child',
        style: {
            //'opacity': '0',
            'display': 'none'
        }
    },

    //PARENT 
    // -> needs own data-object in json-file: {"data": {"id:" "parentID"}}
    { selector: ":parent",
        style: {
            'label': 'data(id)',
            'text-valign': 'top',
            'text-halign': 'center',
            'background-color': 'data(parentcolor)',
            'shape': 'roundrectangle',
            'border-opacity': '0',
            'compound-sizing-wrt-labels': 'include',
            'background-opacity': '0.7',
            'background-blacken': "0"
        }
    },

    // EDGE
    { selector: 'edge',
        style: {
            'width': 4,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
        }
    }, 

    // Highlight class
    { selector: '.highlight-node-out',
        style: {
            'background-color': '#fc6262',
            //light-red
        }
    },
    { selector: '.highlight-node-in',
        style: {
            'background-color': '#5d5dfc',
            //light-blue
        }
    },

    { selector: '.highlight-edge-out',
        style: {
            'line-color': 'red',
            'target-arrow-color': 'red',
            'width': 5,
            'z-compound-depth': 'top',
        }
    }, 
    { selector: '.highlight-edge-in',
        style: {
            'line-color': 'blue',
            'target-arrow-color': 'blue',
        }
    },
    
    // Selector for both edge and node -> TEST
    { selector: ":selected", 
        style: { 
            'overlay-color': "#6c757d",
            'overlay-opacity': "0.3",
            'background-color': "red",
        }
    },
    { selector: ".collapsedNode",
        style:{
            'shape': 'round-rectangle',
        }
    },

    { selector: 'edge.cy-expand-collapse-collapsed-edge',
        style:
        {
          "text-outline-color": "#ffffff",
          "text-outline-width": "2px",
          'label': (e:NodeSingular) => {
            return '(' + e.data('collapsedEdges').length + ')';
          },
          'width': function (edge:EdgeSingular) {
            const n = edge.data('collapsedEdges').length;
            return (3 + Math.log2(n)) + 'px';
          },
          'line-style': 'dashed',
          //'line-color': setColor4CompoundEdge.bind(this),
          //'target-arrow-color': setColor4CompoundEdge.bind(this),
          //'target-arrow-shape': setTargetArrowShape.bind(this),
          //'source-arrow-shape': setSourceArrowShape.bind(this),
          //'source-arrow-color': setColor4CompoundEdge.bind(this),
          //From expand-collapsed compound demo
        }
      },
    /*{ selector: '.unhighlight-edge',
        style: {
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
        }
    },  */ 

    { selector: '.searched',
        style: {
            'border-color': "red",
            'border-width': 3,
            'border-style': "dashed",
            
        }
    },
];