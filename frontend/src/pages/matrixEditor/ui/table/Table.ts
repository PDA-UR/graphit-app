import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { map } from "lit/directives/map.js";

import { TableModel } from "../../data/models/TableModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { TableStoreActions } from "../../data/Store";
import { newColumnModel } from "../../data/models/ColumnModel";
import { Component } from "../atomic/Component";

@customElement("table-view")
export class Table extends Component {
	static styles = css`
		:host {
			display: flex;
			flex-direction: row;
			width: 100%;
			height: 100%;
			gap: 0.5rem;
		}
	`;

	@property({ type: Object, attribute: true })
	tableModel!: TableModel;

	@consume({ context: tableContext })
	@property({ attribute: false })
	public tableActions?: TableStoreActions;

	addColumn() {
		this.tableActions?.addColumn(
			newColumnModel(
				{
					itemId: "TODO",
					text: "TODO",
				},
				{
					name: "TODO",
					propertyId: "TODO",
				}
			)
		);
	}

	removeColumn(viewId: string) {
		this.tableActions?.removeColumn(viewId);
	}

	render() {
		console.log("rendering table");
		return html`
			${map(
				this.tableModel?.columns ?? [],
				(columnModel) => html`
					<column-component
						.columnModel="${columnModel}"
						@onRemove="${() => this.removeColumn(columnModel.viewId)}"
					>
					</column-component>
				`
			)}
			<button @click="${this.addColumn}">Add Column</button>
		`;
	}
}
