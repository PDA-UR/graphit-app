import { ColumnModel, newColumnModel } from "./ColumnModel";

export interface TableModel {
	columns: ColumnModel[];
}

export const newTableModel = (): TableModel => ({
	columns: [
		newColumnModel(
			{ itemId: "Q1", text: "Item 1" },
			{ propertyId: "P0", label: "Property 0" }
		),
	],
});
