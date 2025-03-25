import { v4 as uuidv4 } from "uuid";

export interface WikibaseItem {
	itemId: string;
	text: string;
	url: string;
	qualifiers: String[];
}

export interface WikibaseQualifier {
	[propertyID: string] : string | any;
	// TODO: better?
}

export interface ColumnItemModel extends WikibaseItem {
	viewId: string;
}

export const newColumnItemModel = (
	itemId: string,
	text: string,
	url: string,
	qualifiers: any
): ColumnItemModel => ({
	itemId,
	text,
	viewId: uuidv4(),
	url,
	qualifiers,
});
