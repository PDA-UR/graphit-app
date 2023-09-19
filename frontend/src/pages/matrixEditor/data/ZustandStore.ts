import create, { StoreApi, createStore } from "zustand";
import { TableModel, newTableModel } from "./models/TableModel";
import { ColumnModel } from "./models/ColumnModel";
import { ColumnItemModel } from "./models/ColumnItemModel";
import { WikibasePropertyModel } from "./models/WikibasePropertyModel";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface StoreActions {
	setTable: (table: TableModel) => void;
	addColumn: (column: ColumnModel) => void;
	removeColumn: (columnViewId: string) => void;
	addItem: (columnViewId: string, item: ColumnItemModel) => void;
	removeItem: (columnViewId: string, item: ColumnItemModel) => void;
	moveItem: (
		toColumnViewId: string,
		itemViewId: string,
		doCopy?: boolean
	) => void;
	copyItem: (toColumnViewId: string, itemViewId: string) => void;
	setColumnProperty: (
		columnViewId: string,
		property: WikibasePropertyModel
	) => void;
}

export interface Store extends StoreActions {
	table: TableModel;
}

export const zustandStore = createStore<Store>(
	// @ts-ignore
	persist(
		immer((set) => ({
			table: newTableModel(),
			setTable: (table: TableModel) => set({ table }),
			addColumn: (column: ColumnModel) =>
				set((state: Store) => {
					state.table.columns.push(column);
				}),
			removeColumn: (columnViewId: string) =>
				set((state: Store) => {
					state.table.columns = state.table.columns.filter(
						(column) => column.viewId !== columnViewId
					);
				}),
			addItem: (columnViewId: string, item: ColumnItemModel) =>
				set((state: Store) => {
					const column = state.table.columns.find(
						(column) => column.viewId === columnViewId
					);
					if (column) {
						column.items.push(item);
					}
				}),
			removeItem: (columnViewId: string, item: ColumnItemModel) =>
				set((state: Store) => {
					const column = state.table.columns.find(
						(column) => column.viewId === columnViewId
					);
					if (column) {
						column.items = column.items.filter((i) => i.viewId !== item.viewId);
					}
				}),
			moveItem: (toColumnViewId, itemViewId, doCopy = false) =>
				set((state: Store) => {
					const fromColumn = state.table.columns.find((column) =>
						column.items.find((item) => item.viewId === itemViewId)
					);
					const toColumn = state.table.columns.find(
						(column) => column.viewId === toColumnViewId
					);

					if (fromColumn && toColumn) {
						const item = fromColumn.items.find(
							(item) => item.viewId === itemViewId
						);
						if (item) {
							toColumn.items.push(item);
							if (!doCopy) {
								fromColumn.items = fromColumn.items.filter(
									(item) => item.viewId !== itemViewId
								);
							}
						}
					}
				}),
			copyItem: (toColumnViewId, itemViewId) =>
				set((state: Store) => {
					state.moveItem(toColumnViewId, itemViewId, true);
				}),
			setColumnProperty: (columnViewId, property) =>
				set((state: Store) => {
					const column = state.table.columns.find(
						(column) => column.viewId === columnViewId
					);
					if (column) {
						column.property = property;
					}
				}),
		})),
		{
			name: "table-storage", // unique name
		}
	)
);

export default zustandStore;
