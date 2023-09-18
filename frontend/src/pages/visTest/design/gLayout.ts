// .ts wegen Kommentaren
// .json besser?

export const fcoseOptions = {
    //https://github.com/iVis-at-Bilkent/cytoscape.js-fcose
    name: 'fcose',
    quality: 'default',
    radomize: false,
    animate: true,
    fit: true, 
    padding: 15,
    nodeDimensionsIncludeLabels: true,
    uniformNodeDimensions: false, // for simple nodes (non-compound)
    packComponents: (document.getElementById("toggle2") as HTMLInputElement).checked,
    // packComponents: true, // needs: layout-utilities (test), see no change
    /*  Incremental Layout options */

    idealEdgeLenght: 1,
    gravity: 100,
    gravityCompound: 2.5,
    tile: true,
    // Constraints: -> lock position of node with most outgoers (outdegree) to middle of parent
    // -> parent.boundingbox()/width()/height()/ /2 -> position

};

// Needs el: "level" in json-object
export const concOptions = {
    name: 'concentric',
    fit: true,
    minNodeSpacing: 60,
    avoidOverlap: true,
    nodeDimensionsIncludeLabels: false,
    concentric: function(node: any){
        return node.parent().data("level");
        //return node.data("parent");
    },
    levelWidth: function(nodes: any){ 
        return nodes.maxDegree() / 10;
    },
};

export const concOptions2 = {
    name: 'concentric',
    fit: true,
    minNodeSpacing: 50,
    avoidOverlap: true,
    nodeDimensionsIncludeLabels: false,
    concentric: function(node: any){
        return node.data("parent");
    },
};

export const breadthOptions = {
    name: "breadthfirst",
    padding: 0,
    nodeDimensionsIncludeLabels: true,
    avoidOverlap: true,
    spacingFactor: 0.6,
};

// Run multiple layouts within one layout: 
//https://stackoverflow.com/questions/52200858/cytoscape-js-multiple-layouts-different-layout-within-compound-nodes

// https://blog.js.cytoscape.org/2020/05/11/layouts/
// https://stackoverflow.com/questions/51073254/cytoscape-js-how-to-use-one-layout-for-compound-nodes-and-another-for-children 