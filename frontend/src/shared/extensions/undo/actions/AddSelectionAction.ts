import { Core } from "cytoscape";
import { SelectionAction, SelectionActionData } from "./SelectionAction";

import { getCyElementsByIds } from "../../../../pages/selectionTools/ui/graph/CytoscapeElements";
import {
	SelectionTool,
	SelectionActionDataMap,
} from "../../../../pages/selectionTools/global/SelectionTool";
import { SelectionType } from "../../../../pages/selectionTools/global/SelectionType";

export class AddSelectionAction<
	T extends SelectionTool
> extends SelectionAction<T> {
	constructor(
		cy: Core,
		tool: T,
		type: SelectionType,
		data: SelectionActionDataMap[T]
	) {
		super(cy, tool, type, data);
	}

	onDo(): void {
		const elements = getCyElementsByIds(this.data.elementIds, this.cy);
		elements.forEach((el) => el.select());
	}
	onUndo(): void {
		const elements = getCyElementsByIds(this.data.elementIds, this.cy);
		elements.forEach((el) => el.unselect());
	}

	getName(): string {
		return "AddSelectionAction";
	}
}
