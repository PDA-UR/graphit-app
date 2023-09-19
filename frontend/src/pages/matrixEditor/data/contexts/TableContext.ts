import { createContext } from "@lit-labs/context";
import { StoreActions, Store } from "../ZustandStore";

export const tableContext = createContext<StoreActions>("tableContext");

export const fromStore = (store: Store): StoreActions => {
	return {
		setTable: store.setTable,
		addColumn: store.addColumn,
		removeColumn: store.removeColumn,
		addItem: store.addItem,
		removeItem: store.removeItem,
		moveItem: store.moveItem,
		copyItem: store.copyItem,
		setColumnProperty: store.setColumnProperty,
		getItemByViewId: store.getItemByViewId,
		logout: store.logout,
		setCredentials: store.setCredentials,
	};
};
