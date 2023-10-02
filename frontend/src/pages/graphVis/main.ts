import "./style.css";
import CGBV from "./global/data/cgbv.json";
import { ElementDefinition } from "cytoscape";
import { MainGraph } from "./vis/GraphViz";
import { dragElement } from "./utils/Splitter";

async function main() {
    console.log("start");

    // init Splitter
    const hSplit = document.getElementById("separatorH") as HTMLElement;
    const vSplit = document.getElementById("separatorV") as HTMLElement;
    dragElement(hSplit, "H");
    dragElement(vSplit, "V");

    //init Graph
    const app = document.getElementById("graph")!;
    new MainGraph(CGBV as ElementDefinition[], app);
    
}
main();