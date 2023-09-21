import { ColumnModel } from "./ColumnModel";

export interface TableModel {
	columns: ColumnModel[];
}

export const newTableModel = (): TableModel => ({
	columns: [],
});
