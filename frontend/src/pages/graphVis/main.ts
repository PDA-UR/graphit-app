import "./style.css";
// import CGBV from "./global/data/cgbv.json";
// import { ElementDefinition } from "cytoscape";
import { MainGraph } from "./vis/GraphViz";
import { dragElement } from "./utils/Splitter";
import { getElements } from "./global/DataManager";

async function main() {
    console.log("start");

    // init Splitter
    const hSplit = document.getElementById("separatorH") as HTMLElement;
    const vSplit = document.getElementById("separatorV") as HTMLElement;
    dragElement(hSplit, "H");
    dragElement(vSplit, "V");

    //init Graph
    initGraph();
    
}
main();

async function initGraph() {
    const elements = await getElements(); // currently only Cv&Bg
    console.log("elements", elements);
    const app = document.getElementById("graph")!;
    const graphViz = new MainGraph(elements, app);
}
