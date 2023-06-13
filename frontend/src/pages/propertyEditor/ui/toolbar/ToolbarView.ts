import { View } from "../../../../shared/ui/View";
import { Tool } from "./ToolbarModel";
import "./toolbar.css";

export enum ToolbarViewEvents {
	GRAB_TOOL_CLICK = "grabToolClick",
	MOUSE_TOOL_CLICK = "mouseToolClick",
	RECTANGLE_TOOL_CLICK = "rectangleToolClick",
}

export class ToolbarView extends View {
	private readonly $container: HTMLDivElement;

	private readonly $grabTool: HTMLDivElement;
	private readonly $mouseTool: HTMLDivElement;

	constructor() {
		super();
		this.$container = document.getElementById("toolbar") as HTMLDivElement;
		this.$grabTool = this.$container.querySelector("#grab") as HTMLDivElement;
		this.$mouseTool = this.$container.querySelector("#mouse") as HTMLDivElement;

		this.$initListeners();
	}

	private $initListeners() {
		this.$grabTool.addEventListener("click", this.onGrabToolClick);
		this.$mouseTool.addEventListener("click", this.onMouseToolClick);
	}

	private onGrabToolClick = () => {
		console.log("grab tool click");
		this.emit(ToolbarViewEvents.GRAB_TOOL_CLICK);
	};
	private onMouseToolClick = () => {
		this.emit(ToolbarViewEvents.MOUSE_TOOL_CLICK);
	};

	private $getToolElement(tool: Tool): HTMLDivElement {
		switch (tool) {
			case Tool.GRAB:
				return this.$grabTool;
			case Tool.MOUSE:
				return this.$mouseTool;
		}
	}

	public setTool(tool: Tool, isActive: boolean) {
		const $tool = this.$getToolElement(tool);
		if (isActive) {
			$tool.classList.add("active");
			const otherTools = Object.values(Tool).filter((t) => t !== tool);
			otherTools.forEach((t) => {
				this.$getToolElement(t).classList.remove("active");
			});
		} else {
			$tool.classList.remove("active");
		}
	}
}
