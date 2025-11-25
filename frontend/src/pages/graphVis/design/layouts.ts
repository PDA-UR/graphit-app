import cytoscape from "cytoscape";

const setInclude = (node:cytoscape.NodeSingular) => {
    return node.hasClass("ghost") ? false : true;
}

// keine wirkliche Veränderung
const setRepulsion = (node:cytoscape.NodeSingular) => {
    if(node.hasClass("ghost")) {
        return 1000;
    } else if (node.hasClass("course")) {
        return 50000;
    } else {
        const degree = node.degree(false);
        return degree * 100;
    }
}

const setLength = (edge:cytoscape.EdgeSingular) => {
    if(edge.hasClass("ghost-edges")) {
        return 0;
    } else {
        //Longer edge for bigger degree
        const degree = edge.target().degree(false);
        return degree < 25 ? 2 : degree * 5 ;
        //return degree < edge.target().maxDegree(false) ? 5 : degree  * 5;
    }
    //return edge.hasClass("ghost-edges") ? 1 : 100;
}

export const graphLayout = {
    name: "fcose",
    quality: "proof",
    // Use random node positions at beginning of layout
    // if this is set to false, then quality option must be "proof"
    randomize: false, 
    // Whether or not to animate the layout
    animate: true, 
    // Duration of animation in ms, if enabled
    animationDuration: 1000, 
    // Easing of animation, if enabled
    animationEasing: undefined, 
    // Fit the viewport to the repositioned nodes
    fit: true, 
    // Padding around layout
    padding: 15,
    // Whether to include labels in node dimensions. Valid in "proof" quality
    nodeDimensionsIncludeLabels: setInclude,
    // Whether or not simple nodes (non-compound nodes) are of uniform dimensions
    uniformNodeDimensions: false,
    // Whether to pack disconnected components - cytoscape-layout-utilities extension should be registered and initialized
    packComponents: false,
    // Layout step - all, transformed, enforced, cose - for debug purpose only
    step: "all",
    
    /* incremental layout options */
    
    // Node repulsion (non overlapping) multiplier
    nodeRepulsion: setRepulsion,
    // Ideal edge (non nested) length
    idealEdgeLength: setLength,
    // Divisor to compute edge forces
    edgeElasticity: 0.2, // 10
    // Nesting factor (multiplier) to compute ideal edge length for nested edges
    nestingFactor: 0.1,
    // Maximum number of iterations to perform - this is a suggested value and might be adjusted by the algorithm as required
    numIter: 2500,
    // For enabling tiling
    tile: true,
    // The comparison function to be used while sorting nodes during tiling operation.
    // Takes the ids of 2 nodes that will be compared as a parameter and the default tiling operation is performed when this option is not set.
    // It works similar to ``compareFunction`` parameter of ``Array.prototype.sort()``
    // If node1 is less then node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return a negative value
    // If node1 is greater then node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return a positive value
    // If node1 is equal to node2 by some ordering criterion ``tilingCompareBy(nodeId1, nodeId2)`` must return 0
    tilingCompareBy: undefined,
    // Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
    tilingPaddingVertical: 10,
    // Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
    tilingPaddingHorizontal: 10,
    // Gravity force (constant)
    gravity: 0.25,
    // Gravity range (constant) for compounds
    gravityRangeCompound: 1.5,
    // Gravity force (constant) for compounds
    gravityCompound: 1.0,
    // Gravity range (constant)
    gravityRange: 3.8, 
    // Initial cooling factor for incremental layout  
    initialEnergyOnIncremental: 0.3,
  
    /* constraint options */
  
    // Fix desired nodes to predefined positions
    // [{nodeId: 'n1', position: {x: 100, y: 200}}, {...}]
    fixedNodeConstraint: undefined,
    // Align desired nodes in vertical/horizontal direction
    // {vertical: [['n1', 'n2'], [...]], horizontal: [['n2', 'n4'], [...]]}
    alignmentConstraint: undefined,
    // Place two nodes relatively in vertical/horizontal direction
    // [{top: 'n1', bottom: 'n2', gap: 100}, {left: 'n3', right: 'n4', gap: 75}, {...}]
    relativePlacementConstraint: undefined,
  
    /* layout event callbacks */
    ready: () => {}, // on layoutready
    stop: () => {} // on layoutstop
};
// Source: https://github.com/iVis-at-Bilkent/cytoscape.js-fcose 

// keine wirkliche veränderung
const setRepulsionCourse = (node:cytoscape.NodeSingular) => {
    const weight = node.data("weight");
    return weight ? weight * 200 : 200;
}

const setLengthCourse = (edge:cytoscape.EdgeSingular) => {
    const weight = edge.target().data("weight");
    return weight ? weight * 150 : 200;
    //return edge.hasClass("ghost-edges") ? 1 : 100;
}

// Layout for inside course, when showConnected()
export const fcoseCourse = {
    name: 'fcose',
    //quality: 'default',
    randomize: false,
    animate: true,
    fit: true, 
    packComponents: false,
    padding: 5,
    nodeDimensionsIncludeLabels: true,
    avoidOverlap: true,
    /* incremental layout options */
    // Node repulsion (non overlapping) multiplier
    nodeRepulsion: setRepulsionCourse, // 200 
    // Ideal edge (non nested) length
    idealEdgeLength: setLengthCourse, // 100 -> 150
    // Divisor to compute edge forces
    edgeElasticity: 0.2,

    nestingFactor: 0.1,
    tile: true,

    // relativePlacementConstraint: null as any,
    // fixedNodeConstraint: null as any,
}


export const noLayout = {
    name: 'null',
}

export const grid = {
    name: 'grid',
    fit: true,
    avoidOverlap: true,
    // cols: 2,
    condense: false,
}

export const breadthfirst = {
    name: 'breadthfirst',
    fit: true,
    directed: true, // whether the tree is directed downwards (or edges can point in any direction if false)
    padding: 5, // padding on fit
    circle: false,
    grid: true, // whether to create an even grid into which the DAG is placed (circle:false only)
    spacingFactor: 1, // positive spacing factor, larger => more space between nodes (N.B. n/a if causes overlap)
    boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
    avoidOverlap: true, 
    nodeDimensionsIncludeLabels: false, 
    roots: undefined, // the roots of the trees
    depthSort: undefined, // a sorting function to order nodes at equal depth. e.g. function(a, b){ return a.data('weight') - b.data('weight') }
    animate: false, 
    animationDuration: 500, // duration of animation in ms if enabled
    animationEasing: undefined, // easing of animation if enabled,
    //animateFilter: function ( node, i ){ return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
    ready: undefined, // callback on layoutready
    stop: undefined, // callback on layoutstop
    // transform a given node position. 
    //transform: function (node, position ){ return position; }
};

let count = 0;

export const dagre = {
    name: "dagre",
     // dagre algo options, uses default value on undefined
    nodeSep: undefined, // the separation between adjacent nodes in the same rank
    edgeSep: undefined, // the separation between adjacent edges in the same rank
    rankSep: undefined, // the separation between each rank in the layout
    rankDir: "TB", // 'TB' for top to bottom flow, 'LR' for left to right,
    align: undefined,  // alignment for rank nodes. Can be 'UL', 'UR', 'DL', or 'DR', where U = up, D = down, L = left, and R = right
    acyclicer: undefined, // If set to 'greedy', uses a greedy heuristic for finding a feedback arc set for a graph.
                            // A feedback arc set is a set of edges that can be removed to make a graph acyclic.
    ranker: 'tight-tree', // Type of algorithm to assign a rank to each node in the input graph. Possible values: 'network-simplex', 'tight-tree' or 'longest-path'
    // @ts-ignore
    minLen: function( edge ){ return 1; }, // number of ranks to keep between the source and target of the edge
    // @ts-ignore
    edgeWeight: function( edge ){ return 1; }, // higher weight edges are generally made shorter and straighter than lower weight edges

    // general layout options
    fit: true, // whether to fit to viewport
    padding: 5, // fit padding
    spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
    nodeDimensionsIncludeLabels: false, // whether labels should be included in determining the space used by a node
    animate: false, // whether to transition the node positions
    animateFilter: false, // whether to animate specific nodes when animation is on; non-animated nodes immediately go to their final positions
    animationDuration: 500, // duration of animation in ms if enabled
    animationEasing: undefined, // easing of animation if enabled
    boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
    // transform: function( node, pos ){ return pos; }, // a function that applies a transform to the final node position
    transform: function(node: cytoscape.NodeSingular, pos:any) {
        // TODO: verbessern
        // currently staggers the connected nodes, so that the PathViz-graph is not as wide
        if(node.hasClass("connect")) {
            if(count % 2 != 0) {
                pos.y = pos.y * 0.5;
                // pos.x = pos.x - 200;
            } else {
                pos.y = pos.y * 2;
                // pos.x = pos.x * 0.5;
            }
        }
        count++;
        return pos;
    },
    ready: function(){}, // on layoutready
    sort: undefined, // a sorting function to order the nodes and edges; e.g. function(a, b){ return a.data('weight') - b.data('weight') }
                    // because cytoscape dagre creates a directed graph, and directed graphs use the node order as a tie breaker when
                    // defining the topology of a graph, this sort function can help ensure the correct order of the nodes/edges.
                    // this feature is most useful when adding and removing the same nodes and edges multiple times in a graph.
    stop: function(){} // on layoutstop
}