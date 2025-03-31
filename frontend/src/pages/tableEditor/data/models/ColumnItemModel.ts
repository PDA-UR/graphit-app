import { v4 as uuidv4 } from "uuid";

export interface WikibaseItem {
	itemId: string;
	text: string;
	url: string;
	qualifiers: String[];
}

export interface WikibaseQualifierModel {
	[propertyID: string] : WikibaseQualifier,
}

export interface WikibaseQualifier {
	label: string;
	value: string | any;
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
