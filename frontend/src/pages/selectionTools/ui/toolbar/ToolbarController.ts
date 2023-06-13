import { eventBus } from "../../global/EventBus";
import { Tool, ToolbarModel } from "./ToolbarModel";
import { ToolbarView, ToolbarViewEvents } from "./ToolbarView";

export enum ToolbarViewControllerEvents {
	SWITCH_TOOL = "switchTool",
}

export class ToolbarViewController {
	private readonly toolbarView: ToolbarView;
	private readonly toolbarModel: ToolbarModel;

	constructor() {
		this.toolbarModel = new ToolbarModel();
		this.toolbarView = new ToolbarView();
		this.toolbarView.setTool(this.toolbarModel.activeTool, true);

		this.toolbarView.on(
			ToolbarViewEvents.GRAB_TOOL_CLICK,
			this.onGrabToolClick
		);
		this.toolbarView.on(
			ToolbarViewEvents.MOUSE_TOOL_CLICK,
			this.onMouseToolClick
		);

		document.addEventListener("keydown", (e) => {
			if (e.code === "Space") {
				this.changeTool(Tool.GRAB, true);
			}
		});

		document.addEventListener("keyup", (e) => {
			if (e.code === "Space") {
				this.changeTool(this.toolbarModel.lastTool, true);
			}
		});
	}

	private onGrabToolClick = () => {
		this.changeTool(Tool.GRAB);
	};

	private onMouseToolClick = () => {
		this.changeTool(Tool.MOUSE);
	};

	private changeTool(tool: Tool, isTemporary = false) {
		if (tool === this.toolbarModel.activeTool) return;
		if (isTemporary) this.toolbarModel.lastTool = this.toolbarModel.activeTool;

		this.toolbarModel.activeTool = tool;
		this.toolbarView.setTool(tool, true);
		eventBus.emit(ToolbarViewControllerEvents.SWITCH_TOOL, tool);
	}
}
