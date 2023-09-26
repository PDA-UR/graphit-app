import cytoscape from "cytoscape-select";
import { ActionManager } from "./ActionManager";

export default function undo(cy?: any): void {
	if (!cy) return;

	cy("core", "undoRedo", function (cy: cytoscape.Core) {
		const actionManager = new ActionManager();
		return actionManager;
	});
}

if (typeof window.cytoscape !== "undefined") {
	undo(window.cytoscape as any);
}
