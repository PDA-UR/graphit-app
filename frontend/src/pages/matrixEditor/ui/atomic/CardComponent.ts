import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("card-component")
export class CardComponent extends LitElement {
	static styles = css`
		:host {
			position: relative;
			display: flex;
			overflow: hidden;

			width: 100%;
			height: 100%;

			border-radius: 5px;
			border: 1px solid #000;
			background: #fff;
			box-shadow: 2px 2px 0px 0px rgba(0, 0, 0, 0.25);
		}

		:host(:hover) {
			transform: translate(-1px, -1px);
			border-radius: 5px;
			border: 1px solid #000;
			background: #fff;
			box-shadow: 3px 3px 0px 0px #000;
		}

		::slotted(*) {
			display: block;
		}
	`;

	render() {
		return html`<slot></slot> `;
	}
}
