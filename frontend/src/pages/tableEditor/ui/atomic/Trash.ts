import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Component } from "./Component";
import { DragController } from "../controllers/DragController";
import { dragControllerContext } from "../../data/contexts/DragControllerContext";
import { consume } from "@lit-labs/context";

/**
 * <trash-component> is the trash can that appears when dragging an item.
 */
@customElement("trash-component")
export class Trash extends Component {
	// ------ Contexts ------ //

	@consume({ context: dragControllerContext })
	private dragController!: DragController;

	// ------ Listeners ------ //

	ondrop = (e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		this.classList.remove("isHovering");
		this.dragController.onDrop("trash", false);
	};

	ondragover = (e: DragEvent) => {
		e.preventDefault();
		this.classList.add("isHovering");
	};

	ondragleave = (e: DragEvent) => {
		e.preventDefault();
		this.classList.remove("isHovering");
	};

	ondragenter = (e: DragEvent) => {
		e.preventDefault();
		this.classList.add("isHovering");
	};

	// ------ Rendering ------ //

	render() {
		return html`Remove`;
	}

	static styles = css`
		:host {
			height: 4rem;
			background-color: var(--bg-color);
			margin: 0.5rem;
			border-radius: 5px;
			border: 1px solid black;
			text-align: center;
			line-height: 4rem;
			font-size: 1.3rem;
			padding: 0 0.5rem;
		}
		:host(.isHovering) {
			background-color: var(--bg-danger);
			color: var(--fg-danger);
		}
	`;
}
