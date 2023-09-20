import create, { StoreApi, createStore } from "zustand";
import { TableModel, newTableModel } from "./models/TableModel";
import { ColumnModel } from "./models/ColumnModel";
import { ColumnItemModel } from "./models/ColumnItemModel";
import { WikibasePropertyModel } from "./models/WikibasePropertyModel";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Credentials } from "../../../shared/WikibaseEditConfig";
import { getCredentials } from "../../../shared/util/GetCredentials";

export interface StoreActions {
	setTable: (table: TableModel) => void;
	addColumn: (column: ColumnModel) => void;
	removeColumn: (columnViewId: string) => void;
	setColumnProperty: (
		columnViewId: string,
		property: WikibasePropertyModel
	) => void;
	logout: () => void;
	setCredentials: (credentials: Credentials) => void;
}

export interface Store extends StoreActions {
	table: TableModel;
	credentials?: Credentials;
}

export const zustandStore = createStore<Store>(
	// @ts-ignore
	persist(
		immer((set, get) => ({
			credentials: undefined,
			table: newTableModel(),
			setTable: (table: TableModel) => set({ table }),
			setCredentials: (credentials: Credentials) => {
				set({ credentials });
			},
			logout: () => {
				set({ credentials: undefined });
			},
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
