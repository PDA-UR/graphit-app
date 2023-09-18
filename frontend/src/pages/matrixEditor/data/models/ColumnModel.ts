import { ColumnItemModel, WikibaseItem } from "./ColumnItemModel";
import { WikibasePropertyModel } from "./WikibasePropertyModel";
import { v4 as uuidv4 } from "uuid";

export interface ColumnModel {
	viewId: string;
	item: WikibaseItem;
	property: WikibasePropertyModel;
	items: ColumnItemModel[];
}

export const newColumnModel = (
	item: WikibaseItem,
	property: WikibasePropertyModel
): ColumnModel => ({
	viewId: uuidv4(),
	item,
	property,
	items: [
		{
			viewId: uuidv4(),
			itemId: "Q1",
			text: "Item 1",
		},
	],
});
