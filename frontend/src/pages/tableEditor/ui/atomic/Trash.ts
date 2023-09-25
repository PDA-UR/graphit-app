import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Component } from "./Component";

@customElement("trash-component")
export class Trash extends Component {
	static styles = css`
		:host {
			height: 4rem;
			background-color: white;
			margin: 0.5rem;
			border-radius: 5px;
			border: 1px solid black;
			text-align: center;
			line-height: 4rem;
			font-size: 1.3rem;
			padding: 0 0.5rem;
		}
		:host(.isHovering) {
			background-color: red;
			color: white;
		}
	`;

	ondrop = (e: DragEvent) => {
		e.preventDefault();
		this.dispatchEvent(new CustomEvent("dropped-items"));
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

	render() {
		return html`Remove`;
	}
}
