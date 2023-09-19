import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property } from "lit/decorators.js";
import { map } from "lit/directives/map.js";

import { TableModel } from "../../data/models/TableModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { newColumnModel } from "../../data/models/ColumnModel";
import { Component } from "../atomic/Component";
import { StoreActions } from "../../data/ZustandStore";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import WikibaseClient from "../../../../shared/WikibaseClient";

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
	public tableActions?: StoreActions;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	addColumn() {
		// text input
		const input = prompt("Item ID (e.g. Q1234)");
		if (!input) return;
		this.wikibaseClient
			.getEntities([input])
			.then((entities) => {
				console.log("got entities", entities);
			})
			.catch((err) => {
				console.error(err);
			});
	}

	removeColumn(viewId: string) {
		this.tableActions?.removeColumn(viewId);
	}

	render() {
		console.log("rendering table");
		return html`
			${this.tableModel.columns.map((columnModel) => {
				console.log("rendering column", columnModel.viewId);
				return html`
					<column-component
						.columnModel="${columnModel}"
						@onRemove="${() => this.removeColumn(columnModel.viewId)}"
					>
					</column-component>
				`;
			})}
			<button @click="${this.addColumn}">Add Column</button>
		`;
	}
}
