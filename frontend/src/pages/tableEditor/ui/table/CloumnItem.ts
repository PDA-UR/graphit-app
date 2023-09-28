import { html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Component } from "../atomic/Component";
import { consume } from "@lit-labs/context";
import { selectionControllerContext } from "../../data/contexts/SelectionControllerContext";
import { SelectionController } from "../controllers/SelectionController";

import { ColumnItemInfo, ItemOrigin } from "../controllers/DragController";

/**
 * <column-item> is a single, draggable item in a column.
 */
@customElement("column-item")
export class ColumnItem extends Component {
	@consume({ context: selectionControllerContext })
	selectionController!: SelectionController;

	@property({ type: Object, attribute: false })
	private columnItemInfo!: ColumnItemInfo;

	@property({ type: Object, attribute: false })
	origin!: ItemOrigin;

	// unregisters the selection callback
	// when the component is disconnected
	private unregisterSelectionCallback: () => void = () => {};

	// ------- Lifecycle ------ //
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

	// ------- Listeners ------ //

	ondblclick = (e: MouseEvent) => {
		window.open(this.columnItemInfo.item.url, "_blank");
		e.stopPropagation();
	};

	onclick = (e: MouseEvent) => {
		e.stopPropagation();

		if (e.shiftKey) {
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

	// ------- Rendering ------ //

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

	static styles = css`
		:host {
			width: 100%;
			height: 5rem;
			display: flex;
			cursor: grab;
		}
		:host(.selected) > card-component {
			background-color: var(--bg-selected);
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
}
