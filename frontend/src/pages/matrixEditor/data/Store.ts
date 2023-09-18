import { Exome } from "exome";
import { TableModel, newTableModel } from "./models/TableModel";
import { ColumnModel } from "./models/ColumnModel";
import { ColumnItemModel } from "./models/ColumnItemModel";
import { StoreController } from "exome/lit";
import { WikibasePropertyModel } from "./models/WikibasePropertyModel";

export interface TableStoreActions {
	setTable(table: TableModel): void;
	addColumn(column: ColumnModel): void;
	removeColumn(columnViewId: string): void;
	addItem(columnViewId: string, item: ColumnItemModel): void;
	removeItem(columnViewId: string, item: ColumnItemModel): void;
	moveItem(
		fromColumnViewId: string,
		toColumnViewId: string,
		itemViewId: string,
		doCopy?: boolean
	): void;
	copyItem(
		fromColumnViewId: string,
		toColumnViewId: string,
		itemViewId: string
	): void;
	setColumnProperty(
		columnViewId: string,
		property: WikibasePropertyModel
	): void;
}

export class Store extends Exome implements TableStoreActions {
	public table = newTableModel();

	public setTable(table: TableModel) {
		this.table = table;
	}

	public addColumn(column: ColumnModel) {
		this.table.columns.push(column);
		this.table = { ...this.table };
	}

	public removeColumn(columnViewId: string) {
		this.table.columns = this.table.columns.filter(
			(column) => column.viewId !== columnViewId
		);
		this.table = { ...this.table };
	}

	public addItem(columnViewId: string, item: ColumnItemModel) {
		const column = this.table.columns.find(
			(column) => column.viewId === columnViewId
		);
		if (column) {
			column.items.push(item);
			this.table = { ...this.table };
		}
	}

	public removeItem(columnViewId: string, item: ColumnItemModel) {
		const column = this.table.columns.find(
			(column) => column.viewId === columnViewId
		);
		if (column) {
			column.items = column.items.filter((i) => i.viewId !== item.viewId);
			this.table = { ...this.table };
		}
	}

	public moveItem(
		fromColumnViewId: string,
		toColumnViewId: string,
		itemViewId: string,
		doCopy = false
	) {
		const fromColumn = this.table.columns.find(
			(column) => column.viewId === fromColumnViewId
		);
		const toColumn = this.table.columns.find(
			(column) => column.viewId === toColumnViewId
		);
		if (fromColumn && toColumn) {
			const item = fromColumn.items.find((i) => i.viewId === itemViewId);
			if (item) {
				if (!doCopy)
					fromColumn.items = fromColumn.items.filter(
						(i) => i.viewId !== itemViewId
					);
				toColumn.items.push(item);
				this.table = { ...this.table };
			}
		}
	}

	public copyItem(
		fromColumnViewId: string,
		toColumnViewId: string,
		itemViewId: string
	) {
		this.moveItem(fromColumnViewId, toColumnViewId, itemViewId, true);
	}

	public setColumnProperty(
		columnViewId: string,
		property: WikibasePropertyModel
	) {
		const column = this.table.columns.find(
			(column) => column.viewId === columnViewId
		);
		if (column) {
			column.property = property;
			this.table = { ...this.table };
			console.log("setColumnProperty");
		}
	}
}

export const store = new Store();
