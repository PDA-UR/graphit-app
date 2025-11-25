import create, { StoreApi, createStore } from "zustand";
import { TableModel, newTableModel } from "./models/TableModel";
import { ColumnModel } from "./models/ColumnModel";
import { ColumnItemModel } from "./models/ColumnItemModel";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Credentials } from "../../../shared/WikibaseEditConfig";
import { getCredentials } from "../../../shared/util/GetCredentials";
import { WikibasePropertyModel } from "../../../shared/client/ApiClient";

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
	toggleSidebar: (isOpen?: boolean) => void;
	setIsDarkMode: (isDarkMode: boolean) => void;
	setIsAdmin: (isAdmin: boolean) => void;
	setUserQID: (userQID: string) => void;
}

export interface Store extends StoreActions {
	table: TableModel;
	credentials?: Credentials;
	isDarkMode?: boolean;
	sidebarIsOpen: boolean;
	isAdmin?: boolean;
	userQID: string|undefined;
}

/**
 * Zustand store for the table editor.
 * This is the main state store for the table editor.
 */
export const zustandStore = createStore<Store>(
	// @ts-ignore
	persist(
		immer((set, get) => ({
			credentials: undefined,
			sidebarIsOpen: true,
			isAdmin: false,
			userQID: undefined,
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
			toggleSidebar: (isOpen?: boolean) =>
				set((state: Store) => {
					state.sidebarIsOpen = isOpen ?? !state.sidebarIsOpen;
				}),
			setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),
			setUserQID: (userQID: string) => set({userQID}),
			setIsDarkMode: (isDarkMode: boolean) => set({ isDarkMode }),
		})),
		{
			name: "table-storage", // unique name
		}
	)
);

export default zustandStore;
