import { createContext } from "@lit-labs/context";
import { StoreActions, Store } from "../ZustandStore";

export const tableContext = createContext<StoreActions>("tableContext");

export const fromStore = (store: Store): StoreActions => {
	return {
		setTable: store.setTable,
		addColumn: store.addColumn,
		removeColumn: store.removeColumn,
		setColumnProperty: store.setColumnProperty,
		logout: store.logout,
		setCredentials: store.setCredentials,
		toggleSidebar: store.toggleSidebar,
	};
};
