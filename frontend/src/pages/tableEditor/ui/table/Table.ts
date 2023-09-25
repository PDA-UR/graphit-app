import { html, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import { TableModel } from "../../data/models/TableModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { ColumnModel, newColumnModel } from "../../data/models/ColumnModel";
import { Component } from "../atomic/Component";
import { StoreActions } from "../../data/ZustandStore";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import WikibaseClient from "../../../../shared/WikibaseClient";

import { Task } from "@lit-labs/task";
import { DragController } from "../controllers/DragController";
import { dragControllerContext } from "../../data/contexts/DragControllerContext";
import { when } from "lit/directives/when.js";

@customElement("table-view")
export class Table extends Component {
	static styles = unsafeCSS`
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
	@consume({ context: dragControllerContext })
	private dragController!: DragController;

	@property({ type: Object, attribute: true })
	tableModel!: TableModel;

	@consume({ context: tableContext })
	public tableActions!: StoreActions;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	@state()
	isDragging = false;

	private addCloumnTask = new Task(this, {
		task: async ([{ wikibaseClient, addColumn }]) => {
			const _input = prompt("Item ID (e.g. Q1234)");
			if (!_input) return;
			const input = _input.trim().toUpperCase();
			const entity = await wikibaseClient.getEntities([input]);
			const wikibaseItem = {
				itemId: entity.data.entities[input].id,
				text:
					entity.data.entities[input].labels?.en?.value ??
					entity.data.entities[input].labels?.de?.value ??
					"",
				url: wikibaseClient.getEntityUrl(entity.data.entities[input].id),
			};
			const columnModel = newColumnModel(
				wikibaseItem,
				wikibaseClient.getCachedProperties()[0]
			);
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

	onItemDragStart = (e: CustomEvent) => {
		this.isDragging = true;
		this.dragController.onItemDragStart(e.detail);
	};

	onItemDragEnd = (e: CustomEvent) => {
		this.isDragging = false;
		this.dragController.onItemDragEnd(e.detail);
	};

	onItemDropped = (colummnModel: ColumnModel, doCopy: boolean) => {
		this.isDragging = false;
		this.dragController.onDrop(colummnModel, doCopy);
	};

	render() {
		console.log("rendering table");
		return html`
			${this.tableModel.columns.map((columnModel) => {
				console.log("rendering column", columnModel.viewId);
				return html`
					<column-component
						.columnModel="${columnModel}"
						@onRemove="${() => this.removeColumn(columnModel.viewId)}"
						@itemDropped="${(e: any) =>
							this.onItemDropped(columnModel, e.detail.doCopy)}"
						@itemDraggedStart="${(e: any) => this.onItemDragStart(e)}"
						@itemDraggedEnd="${(e: any) => this.onItemDragEnd(e)}"
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
			<trash-component
				class="${when(
					this.isDragging,
					() => "",
					() => "hidden"
				)}"
				@dropped-items="${() => this.dragController.onDrop("trash", false)}"
			></trash-component>
		`;
	}
}
