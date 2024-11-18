import * as layouts from "../design/layouts";

const DEFAULT_FCOSE = {
    name: 'fcose',
    quality: "default",
    randomize: false,
    animate: false,
    fit: true, 
    padding: 30,
    nodeDimensionsIncludeLabels: true,
    avoidOverlap: true,
    nodeSeparation: 100, 
    nodeRepulsion: 1500,
    // @ts-ignore
    idealEdgeLength: 10,
    // @ts-ignore
    edgeElasticity: 0.25,
    nestingFactor: 0.1,
    tile: true,
    gravity: 0.25,
    gravityRange: 3.8,
    // via: layoutUtilities: https://github.com/iVis-at-Bilkent/cytoscape.js-layout-utilities
    packComponents: true,
    componentSpacing: 10,   
}


// The most default layout.
const DEFAULT_LAYOUT = {
    name: "fcose",
    // padding: 30,
    packComponents: true,
    componentSpacing: 20,
    fit: true,
}

const STANDARD_LAYOUT = {
    name: "fcose",
}

export const GLOBALS = {
    // Layout-Options:
    // graphLayout: layoutOptions.fcose,
    graphLayout: layouts.graphLayout,
    courseLayout: layouts.fcoseCourse,
    noLayout: layouts.noLayout,
    gridLayout: layouts.grid,
    breadthLayout: layouts.breadthfirst,
    dagre: layouts.dagre,
    // default_layout: DEFAULT_LAYOUT,
    default_layout: DEFAULT_FCOSE,
}