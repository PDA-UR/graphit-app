import { css, html } from "lit";
import { Component } from "../atomic/Component";
import { customElement, property } from "lit/decorators.js";
import { map } from "lit/directives/map.js";
import { ColumnItemModel } from "../../data/models/ColumnItemModel";
import { ItemOrigin } from "../controllers/DragController";
import { consume } from "@lit-labs/context";
import { selectionControllerContext } from "../../data/contexts/SelectionControllerContext";
import { SelectionController } from "../controllers/SelectionController";

@customElement("column-item-list")
export class ColumnItemList extends Component {
	@consume({ context: selectionControllerContext })
	selectionController!: SelectionController;

	@property({ type: Object, attribute: true })
	origin!: ItemOrigin;

	@property({ type: Array, attribute: true })
	items: ColumnItemModel[] = [];

	@property({ type: String })
	filter: string = "";

	onItemShiftClicked = (item: ColumnItemModel) => {
		const lastSelectedItem = this.selectionController.getLastSelectedItem();
		const colItemInfo = {
			item: item,
			origin: this.origin,
		};
		const lastSelectedIndex =
			lastSelectedItem === undefined
				? -1
				: this.items.findIndex(
						(i) => i.viewId === lastSelectedItem.item.viewId
				  );

		if (lastSelectedItem === undefined || lastSelectedIndex === -1) {
			this.selectionController.addItem(colItemInfo);
			return;
		}

		const currentIndex = this.items.findIndex((i) => i.viewId === item.viewId);
		const minIndex = Math.min(lastSelectedIndex, currentIndex);
		const maxIndex = Math.max(lastSelectedIndex, currentIndex);
		const selectedItems = this.items.slice(minIndex, maxIndex + 1);

		console.log("ss", currentIndex, lastSelectedIndex);

		const itemsToAdd = selectedItems
			.map((item) => ({ item, origin: this.origin }))
			.filter((item) => !this.selectionController.isSelected(item));

		console.log("items to add", itemsToAdd);

		this.selectionController.addItems(itemsToAdd);
	};

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
							.columnItemInfo="${{
								item,
								origin: this.origin,
							}}"
							@shift-click="${(e: MouseEvent) => {
								this.onItemShiftClicked(item);
							}}"
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
			background-color: var(--bg-loading-progress);
			pointer-events: none;
			cursor: not-allowed;
			opacity: 0.3;
		}
		:host(.error) {
			background-color: var(--bg-loading-error);
			pointer-events: none;
			cursor: not-allowed;
			opacity: 0.7;
		}
		#item-container {
		}
	`;
}
