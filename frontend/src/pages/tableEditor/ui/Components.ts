import AppRoot from "./App";
import { CardComponent } from "./atomic/Card";
import { ColumnComponent } from "./table/Column";
import { ColumnItem } from "./table/CloumnItem";
import { Table } from "./table/Table";
import { ColumnItemList } from "./table/ColumnItemList";
import { Trash } from "./atomic/Trash";

export {
	AppRoot,
	CardComponent,
	ColumnComponent,
	ColumnItem as ColumnItem,
	Table as TableView,
	ColumnItemList,
	Trash,
};

declare global {
	interface HTMLElementTagNameMap {
		"app-root": AppRoot;
		"card-component": CardComponent;
		"column-component": ColumnComponent;
		"column-item": ColumnItem;
		"table-view": Table;
		"column-item-list": ColumnItemList;
		"trash-component": Trash;
	}
}
