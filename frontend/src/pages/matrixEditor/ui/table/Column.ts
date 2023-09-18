import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ColumnModel } from "../../data/models/ColumnModel";
import { tableContext } from "../../data/contexts/TableContext";
import { TableStoreActions } from "../../data/Store";
import { consume } from "@lit-labs/context";
import { map } from "lit/directives/map.js";
import {
	MATRIX_PROPERTIES,
	getWikibasePropertyById,
} from "../../data/models/WikibasePropertyModel";
import { Component } from "../atomic/Component";

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
	public tableActions!: TableStoreActions;

	handlePropertyChange(event: Event) {
		const newValue = (event.target as HTMLSelectElement).value,
			newProperty = getWikibasePropertyById(newValue);

		if (newProperty)
			this.tableActions?.setColumnProperty(
				this.columnModel.viewId,
				newProperty
			);
	}

	// ... styles and other properties

	render() {
		console.log("rendering column");
		return html`
			<div>${this.columnModel.property.name}</div>
			<select
				.value="${this.columnModel.property.name}"
				@change="${this.handlePropertyChange}"
			>
				${map(
					MATRIX_PROPERTIES,
					(property) => html`
						<option value="${property.propertyId}">${property.name}</option>
					`
				)}
			</select>
			${map(
				this.columnModel.items,
				(item) => html` <column-item .columnItemModel="${item}"></column-item> `
			)}
		`;
	}
}
