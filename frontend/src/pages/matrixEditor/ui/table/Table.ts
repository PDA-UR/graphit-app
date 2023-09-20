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
import { parseEntitiesConnectedByProperty } from "./Column";
import {
	MATRIX_PROPERTIES,
	WikibasePropertyModel,
} from "../../data/models/WikibasePropertyModel";
import { newColumnItemModel } from "../../data/models/ColumnItemModel";
import { Task, TaskStatus } from "@lit-labs/task";
import { choose } from "lit/directives/choose.js";

@customElement("table-view")
export class Table extends Component {
	static styles = css`
		:host {
			display: flex;
			flex-direction: row;
			width: 100%;
			gap: 0.5rem;
			padding: 0.5rem;
			flex-grow: 1;
			overflow-y: hidden;
			overflow-x: auto;
		}
		#add-column-container {
			display: flex;
			flex-direction: row;
			justify-content: center;
			align-items: center;
		}
	`;

	@property({ type: Object, attribute: true })
	tableModel!: TableModel;

	@consume({ context: tableContext })
	@property({ attribute: false })
	public tableActions!: StoreActions;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	private addCloumnTask = new Task(this, {
		task: async ([{ wikibaseClient, addColumn }]) => {
			const input = prompt("Item ID (e.g. Q1234)");
			if (!input) return;
			const entity = await wikibaseClient.getEntities([input]);
			const wikibaseItem = {
				itemId: entity.data.entities[input].id,
				text:
					entity.data.entities[input].labels?.en?.value ??
					entity.data.entities[input].labels?.de?.value ??
					"",
			};
			const columnModel = newColumnModel(wikibaseItem, MATRIX_PROPERTIES[0]);
			addColumn(columnModel);
		},
		args: () => [
			{
				wikibaseClient: this.wikibaseClient,
				addColumn: this.tableActions.addColumn,
			},
		],
		autoRun: false,
	});

	removeColumn(viewId: string) {
		this.tableActions.removeColumn(viewId);
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
			<div id="add-column-container">
				<button
					id="add-column-button"
					@click="${() => this.addCloumnTask.run()}"
				>
					Add Column
				</button>
			</div>
		`;
	}
}
