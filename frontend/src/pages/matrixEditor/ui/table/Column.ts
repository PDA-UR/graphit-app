import { html, css } from "lit";
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
		:host(.highlight) {
			background-color: #e5e5e5;
		}
		.items {
			display: flex;
			flex-direction: column;
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

	ondrop = (event: DragEvent) => {
		event.preventDefault();
		const viewId = event.dataTransfer?.getData("text/plain");
		if (viewId) {
			const isAlreadyInColumn = this.columnModel.items.find(
				(item) => item.viewId === viewId
			);
			if (isAlreadyInColumn) return;
			this.tableActions.moveItem(this.columnModel.viewId, viewId);
		}
		this.classList.remove("highlight");
	};

	ondragover = (event: DragEvent) => {
		event.preventDefault();
		this.classList.add("highlight");
	};

	ondragleave = (event: DragEvent) => {
		event.preventDefault();
		this.classList.remove("highlight");
	};

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
