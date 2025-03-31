import { html, css, PropertyValueMap, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Component } from "../atomic/Component";
import { consume } from "@lit-labs/context";
import { selectionControllerContext } from "../../data/contexts/SelectionControllerContext";
import { SelectionController } from "../controllers/SelectionController";

import { ColumnItemInfo, ItemOrigin } from "../controllers/DragController";
import WikibaseClient from "../../../../shared/WikibaseClient";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import { WikibasePropertyModel } from "../../../../shared/client/ApiClient";

/**
 * <column-item> is a single, draggable item in a column.
 */
@customElement("column-item")
export class ColumnItem extends Component {
	@consume({ context: selectionControllerContext })
	selectionController!: SelectionController;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	@property({type: Object, attribute: false})
	private cachedProperties: any;
	
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
		console.log("first updated");

		this.cachedProperties = this.wikibaseClient.getCachedProperties();

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

			let label = key;
			if (this.cachedProperties != undefined) {
				this.cachedProperties.forEach((element: WikibasePropertyModel) => {
					if(element.propertyId == key) label = element.label;
				});
			}

			let entry = value as String[];
			let val = "";
			entry.forEach(element => {	
				let v = element;		
				if (element.includes("T00:00:00Z")) {
					v = element.match(/(\d*-\d*-\d*)/g)![0];
				}
				val += v + ", ";
			});
			val = val.slice(0, -2); // rm last ", "
			let str = html`<div class="text"> <i>${label}</i> (${key}): ${val} </div>`
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
			max-height: 10rem;
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
			font-size: 9pt;
			max-height: 5em;
		}
		.qualifier {
			text-align: left;
			user-select: none;
		}
	`;
}
