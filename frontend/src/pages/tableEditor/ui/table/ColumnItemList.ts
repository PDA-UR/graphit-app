import { css, html } from "lit";
import { Component } from "../atomic/Component";
import { customElement, property } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { ColumnItemModel } from "../../data/models/ColumnItemModel";
import { ItemOrigin } from "../controllers/DragController";

@customElement("column-item-list")
export class ColumnItemList extends Component {
	@property({ type: Object, attribute: true })
	origin!: ItemOrigin;

	@property({ type: Array, attribute: true })
	items: ColumnItemModel[] = [];

	@property({ type: String })
	filter: string = "";

	render() {
		return html`
			${map(
				this.items.filter(
					(item) =>
						item.text.includes(this.filter) || item.itemId.includes(this.filter)
				),
				(item) =>
					html`
						<column-item
							.columnItemModel="${item}"
							.origin="${this.origin}"
							@dragstart="${(e: DragEvent) => {
								this.dispatchEvent(
									new CustomEvent("itemDraggedStart", {
										detail: {
											item,
											origin: this.origin,
										},
										bubbles: true,
										composed: true,
									})
								);
							}}"
							@dragend="${(e: DragEvent) => {
								this.dispatchEvent(
									new CustomEvent("itemDraggedEnd", {
										detail: {
											item,
											origin: this.origin,
										},
										bubbles: true,
										composed: true,
									})
								);
							}}"
						></column-item>
					`
			)}
		`;
	}

	static styles = css`
		:host {
			height: 100%;
			overflow-x: hidden;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			padding: 0.5rem;
		}
		:host(.loading) {
			background-color: #e5e5e5;
			pointer-events: none;
			cursor: not-allowed;
			opacity: 0.3;
		}
		:host(.error) {
			background-color: #ffa1a1;
			pointer-events: none;
			cursor: not-allowed;
			opacity: 0.7;
		}
		#item-container {
		}
	`;
}
