import { WikibasePropertyModel } from "../../../../shared/client/ApiClient";
import { WikibaseItem } from "./ColumnItemModel";
import { v4 as uuidv4 } from "uuid";

export interface ColumnModel {
	viewId: string;
	item: WikibaseItem;
	property: WikibasePropertyModel;
}

export const newColumnModel = (
	item: WikibaseItem,
	property: WikibasePropertyModel
): ColumnModel => ({
	viewId: uuidv4(),
	item,
	property,
});
