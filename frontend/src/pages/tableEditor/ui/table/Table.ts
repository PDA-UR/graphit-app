import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import { TableModel } from "../../data/models/TableModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { ColumnModel } from "../../data/models/ColumnModel";
import { Component } from "../atomic/Component";
import { StoreActions } from "../../data/ZustandStore";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import WikibaseClient from "../../../../shared/WikibaseClient";

import { DragController } from "../controllers/DragController";
import { dragControllerContext } from "../../data/contexts/DragControllerContext";
import { when } from "lit/directives/when.js";

/**
 * <table-view> is the table that displays the columns and items.
 */
@customElement("table-view")
export class Table extends Component {
	// ------ Contexts ------ //

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	@consume({ context: dragControllerContext })
	private dragController!: DragController;

	// ------ Properties ------ //

	@property({ type: Boolean })
	private isDragging!: boolean;

	@property({ type: Boolean})
	private isCopyToggleOn!: boolean;

	@property({ type: Object, attribute: true })
	tableModel!: TableModel;

	@consume({ context: tableContext })
	public tableActions!: StoreActions;

	// ------ Methods ------ //

	removeColumn(viewId: string) {
		this.tableActions.removeColumn(viewId);
	}

	// ------ Listeners ------ //

	onItemDropped = (colummnModel: ColumnModel | "trash", doCopy: boolean) => {
		this.dragController.onDrop(colummnModel, doCopy);
	};

	// ------ Rendering ------ //

	render() {
		return html`
			${this.tableModel.columns.map((columnModel) => {
				return html`
					<column-component
						.isDragging="${this.isDragging}"
						.columnModel="${columnModel}"
						.isCopyToggleOn="${this.isCopyToggleOn}"
						@onRemove="${() => this.removeColumn(columnModel.viewId)}"
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
		`; // false -> doCopy is default false?
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
