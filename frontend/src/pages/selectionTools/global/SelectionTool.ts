import { SelectionActionData } from "../../../shared/extensions/undo/actions/SelectionAction";

export enum SelectionTool {
	CLICK = "click",
	NEIGHBORS = "neighbors",
	PATH = "path",
	LASSO_RECT = "lasso-rect",
	RECT_ONLY = "rect-only",
	SEARCH = "search",
	ALL = "all",
	INVERT = "invert",
}

export interface SelectionActionDataMap {
	[SelectionTool.CLICK]: ClickSelectionActionData;
	[SelectionTool.NEIGHBORS]: NeighborsSelectionActionData;
	[SelectionTool.PATH]: PathSelectionActionData;
	[SelectionTool.LASSO_RECT]: LassoRectSelectionActionData;
	[SelectionTool.RECT_ONLY]: RectOnlySelectionActionData;
	[SelectionTool.SEARCH]: SearchSelectionActionData;
	[SelectionTool.ALL]: AllSelectionActionData;
	[SelectionTool.INVERT]: InvertSelectionActionData;
}

export interface ClickSelectionActionData extends SelectionActionData {
	didClickCanvas: boolean;
}

export interface NeighborsSelectionActionData extends SelectionActionData {
	isDirectNeighbors: boolean;
}

export interface PathSelectionActionData extends SelectionActionData {
	toggleCount: number;
}

export interface LassoRectSelectionActionData extends SelectionActionData {
	isLasso: boolean;
}

export interface RectOnlySelectionActionData extends SelectionActionData {}

export interface SearchSelectionActionData extends SelectionActionData {
	query: string;
	property: string;
}

export interface AllSelectionActionData extends SelectionActionData {}

export interface InvertSelectionActionData extends SelectionActionData {}
