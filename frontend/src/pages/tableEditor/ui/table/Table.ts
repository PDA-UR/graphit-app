import { css, html, unsafeCSS } from "lit";
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
import { isDraggingContext } from "../../data/contexts/IsDraggingContext";

@customElement("table-view")
export class Table extends Component {
	@consume({ context: dragControllerContext })
	private dragController!: DragController;

	@property()
	private isDragging!: boolean;

	@property({ type: Object, attribute: true })
	tableModel!: TableModel;

	@consume({ context: tableContext })
	public tableActions!: StoreActions;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	removeColumn(viewId: string) {
		this.tableActions.removeColumn(viewId);
	}

	onItemDragStart = (e: CustomEvent) => {
		this.dragController.onItemDragStart(e.detail);
	};

	onItemDragEnd = (e: CustomEvent) => {
		this.dragController.onItemDragEnd(e.detail);
	};

	onItemDropped = (colummnModel: ColumnModel | "trash", doCopy: boolean) => {
		this.dragController.onDrop(colummnModel, doCopy);
	};

	render() {
		console.log("rendering table");
		return html`
			${this.tableModel.columns.map((columnModel) => {
				return html`
					<column-component
						.columnModel="${columnModel}"
						@onRemove="${() => this.removeColumn(columnModel.viewId)}"
						@itemDropped="${(e: any) =>
							this.onItemDropped(e.detail.data, e.detail.doCopy)}"
						@itemDraggedStart="${(e: any) => this.onItemDragStart(e)}"
						@itemDraggedEnd="${(e: any) => this.onItemDragEnd(e)}"
					>
					</column-component>
				`;
			})}
			<new-column-dropzone
				class="${when(
					this.isDragging,
					() => "isDragging",
					() => ""
				)}"
				@itemDropped="${(e: any) => this.onItemDropped(e.detail.data, false)}"
			></new-column-dropzone>
		`;
	}

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
			padding: 1rem;
		}
		#add-column-container {
			display: flex;
			flex-direction: row;
			justify-content: center;
			align-items: center;
		}
	`;
}
