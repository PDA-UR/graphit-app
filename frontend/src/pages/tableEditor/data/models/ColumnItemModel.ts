import { v4 as uuidv4 } from "uuid";

export interface WikibaseItem {
	itemId: string;
	text: string;
	url: string;
}

export interface ColumnItemModel extends WikibaseItem {
	viewId: string;
}

export const newColumnItemModel = (
	itemId: string,
	text: string,
	url: string
): ColumnItemModel => ({
	itemId,
	text,
	viewId: uuidv4(),
	url,
});
