import { GraphController } from "./ui/graph/GraphController";

import "./style.css";
import { ToolbarViewController } from "./ui/toolbar/ToolbarController";
import { state } from "./global/State";
import { getElements } from "./global/DataManager";

async function main() {
	const elements = await getElements();
	const toolbarController = new ToolbarViewController();
	const graphController = new GraphController(elements);
}

state.init();
main();
