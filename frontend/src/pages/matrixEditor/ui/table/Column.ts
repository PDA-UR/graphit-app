import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ColumnModel } from "../../data/models/ColumnModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { map } from "lit/directives/map.js";
import {
	MATRIX_PROPERTIES,
	getWikibasePropertyById,
} from "../../data/models/WikibasePropertyModel";
import { Component } from "../atomic/Component";
import { StoreActions } from "../../data/ZustandStore";

@customElement("column-component")
export class ColumnComponent extends Component {
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			background-color: #f5f5f5;
			border-radius: 5px;
			padding: 0.5rem;
			gap: 0.5rem;
		}
	`;

	@property({ type: Object, attribute: false })
	columnModel!: ColumnModel;

	@consume({ context: tableContext })
	@property({ attribute: false })
	public tableActions!: StoreActions;

	handlePropertyChange(event: Event) {
		const newValue = (event.target as HTMLSelectElement).value,
			newProperty = getWikibasePropertyById(newValue);

		if (newProperty)
			this.tableActions?.setColumnProperty(
				this.columnModel.viewId,
				newProperty
			);
	}

	firstUpdated() {
		this.addEventListener("drop", this.handleDrop);
		this.addEventListener("dragover", this.handleDragOver);
	}

	private handleDrop(event: DragEvent) {
		event.preventDefault();
		const viewId = event.dataTransfer?.getData("text/plain");

		console.log("dropped", viewId);
		// Call the moveItem method
		if (viewId) {
			this.tableActions.moveItem(this.columnModel.viewId, viewId);
		}
	}

	protected shouldUpdate(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): boolean {
		console.log("shouldUpdate", _changedProperties);
		return super.shouldUpdate(_changedProperties);
	}

	handleDragOver(event: DragEvent) {
		// Prevent default to allow drop
		event.preventDefault();
	}

	// ... styles and other properties

	render() {
		console.log(
			"rendering column with property",
			this.columnModel.property.propertyId
		);
		return html`
			<div>${this.columnModel.property.name}</div>
			<select @change="${this.handlePropertyChange}">
				${map(
					MATRIX_PROPERTIES,
					(property) => html`
						<option
							value="${property.propertyId}"
							?selected="${property.propertyId ===
							this.columnModel.property.propertyId}"
						>
							${property.name}
						</option>
					`
				)}
			</select>
			<div class="items" data-column-id="${this.columnModel.viewId}">
				${map(
					this.columnModel.items,
					(item) =>
						html` <column-item .columnItemModel="${item}"></column-item> `
				)}
			</div>
		`;
	}
}
