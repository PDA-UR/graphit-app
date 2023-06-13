export enum Tool {
	GRAB = "grab",
	MOUSE = "mouse",
}

export const DEFAULT_TOOL = Tool.GRAB;

export class ToolbarModel {
	activeTool: Tool = DEFAULT_TOOL;
	lastTool: Tool = DEFAULT_TOOL;
}
