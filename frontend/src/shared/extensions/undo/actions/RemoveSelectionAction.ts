import { Core, ElementDefinition } from "cytoscape";

import { getCyElementsByIds } from "../../../../pages/selectionTools/ui/graph/CytoscapeElements";
import {
	SelectionTool,
	SelectionActionDataMap,
} from "../../../../pages/selectionTools/global/SelectionTool";
import { SelectionAction } from "./SelectionAction";
import { SelectionType } from "../../../../pages/selectionTools/global/SelectionType";

export class RemoveSelectionAction<
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
		elements.forEach((el) => el.unselect());
	}

	onUndo(): void {
		const elements = getCyElementsByIds(this.data.elementIds, this.cy);
		elements.forEach((el) => el.select());
	}
	getName(): string {
		return `RemoveSelectionAction`;
	}
}
