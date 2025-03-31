import { html, css, PropertyValueMap, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Component } from "../atomic/Component";
import { consume } from "@lit-labs/context";
import { selectionControllerContext } from "../../data/contexts/SelectionControllerContext";
import { SelectionController } from "../controllers/SelectionController";

import { ColumnItemInfo, ItemOrigin } from "../controllers/DragController";
import { WikibaseQualifierModel } from "../../data/models/ColumnItemModel";

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

	/**
	 * Parses the existing qualifiers of an item into displayable html strings.
	 * @param qualifier -dictionary from the item
	 * @returns an array of html TemplateResults or nothing (if no qualifiers exist)
	 */
	parseQualifiers(qualifier: any): TemplateResult[] | undefined {
		if (qualifier == undefined) return;
		let htmlArr : TemplateResult[] = [];

		for (const [key, value] of Object.entries(qualifier)) {
			let entry = value as any;
			let val = entry.value as any | string;

			if (val.time != undefined) { // is +2024-11-11T00:00:00Z
				val = val.time.match(/(\d*-\d*-\d*)/g)
			}
			let str = html`<div class="text">${entry.label} (${key}): ${val} </div>`
			htmlArr.push(str)
		}
		return htmlArr
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
					<div class="qualifier-container">
						${this.parseQualifiers(this.columnItemInfo.item.qualifiers)}
					</div>
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
		.qualifier-container {
			overflow: scroll;
			font-size: small;
		}
		.qualifier {
			text-align: left;
			user-select: none;
		}
	`;
}
