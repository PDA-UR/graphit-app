import { html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Component } from "../atomic/Component";
import { consume } from "@lit-labs/context";
import { selectionControllerContext } from "../../data/contexts/SelectionControllerContext";
import { SelectionController } from "../controllers/SelectionController";

import { ColumnItemInfo, ItemOrigin } from "../controllers/DragController";

@customElement("column-item")
export class ColumnItem extends Component {
	static styles = css`
		:host {
			width: 100%;
			height: 5rem;
			display: flex;
			cursor: grab;
		}
		:host(.selected) > card-component {
			background-color: #e0e0e0;
		}
		.content {
			padding: 0.5rem;
			display: flex;
			flex-direction: column;
			flex-grow: 1;
			justify-content: center;
		}
		.text {
			text-align: center;
			user-select: none;
		}
	`;

	@property({ type: Object, attribute: false })
	private columnItemInfo!: ColumnItemInfo;

	@consume({ context: selectionControllerContext })
	selectionController!: SelectionController;

	@property({ type: Object, attribute: false })
	origin!: ItemOrigin;

	private unregisterSelectionCallback: () => void = () => {};

	protected firstUpdated(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): void {
		console.log("first updated", this.origin);

		this.setAttribute("draggable", "true");
		this.unregisterSelectionCallback =
			this.selectionController.registerSelectionChangeCallback(() => {
				console.log("selection changed");
				if (this.selectionController.isSelected(this.columnItemInfo)) {
					this.classList.add("selected");
				} else {
					this.classList.remove("selected");
				}
			});
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this.unregisterSelectionCallback();
	}

	ondblclick = (e: MouseEvent) => {
		window.open(this.columnItemInfo.item.url, "_blank");
		e.stopPropagation();
	};

	onclick = (e: MouseEvent) => {
		e.stopPropagation();

		if (e.shiftKey) {
			// emit custom event
			this.dispatchEvent(
				new CustomEvent("shift-click", {
					detail: {
						item: this.columnItemInfo,
					},
				})
			);
			return;
		}
		this.selectionController.handleClick(this.columnItemInfo!, e);
	};

	render() {
		return html`
			<card-component>
				<div class="content">
					<div class="text">${this.columnItemInfo.item.itemId}</div>
					<div class="text">${this.columnItemInfo.item.text}</div>
				</div>
			</card-component>
		`;
	}
}
