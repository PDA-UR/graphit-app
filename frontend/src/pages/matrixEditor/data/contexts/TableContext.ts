import { StoreController } from "exome/lit";
import { TableStoreActions, Store } from "../Store";
import { ColumnItemModel } from "../models/ColumnItemModel";
import { ColumnModel } from "../models/ColumnModel";
import { TableModel } from "../models/TableModel";
import { createContext } from "@lit-labs/context";
import { WikibasePropertyModel } from "../models/WikibasePropertyModel";

export const tableContext = createContext<TableStoreActions>("tableContext");

export const fromStore = (store: StoreController<Store>): TableStoreActions => {
	return {
		setTable: (table: TableModel) => store.store.setTable(table),
		addColumn: (column: ColumnModel) => store.store.addColumn(column),
		removeColumn: (columnViewId: string) =>
			store.store.removeColumn(columnViewId),
		addItem: (columnViewId: string, item: ColumnItemModel) =>
			store.store.addItem(columnViewId, item),
		removeItem: (columnViewId: string, item: ColumnItemModel) =>
			store.store.removeItem(columnViewId, item),
		moveItem: (
			fromColumnViewId: string,
			toColumnViewId: string,
			itemViewId: string,
			doCopy?: boolean
		) =>
			store.store.moveItem(
				fromColumnViewId,
				toColumnViewId,
				itemViewId,
				doCopy
			),
		copyItem: (
			fromColumnViewId: string,
			toColumnViewId: string,
			itemViewId: string
		) => store.store.copyItem(fromColumnViewId, toColumnViewId, itemViewId),
		setColumnProperty: (
			columnViewId: string,
			property: WikibasePropertyModel
		) => store.store.setColumnProperty(columnViewId, property),
	};
};
