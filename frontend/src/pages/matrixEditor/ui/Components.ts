import AppRoot from "./App";
import { CardComponent } from "./atomic/CardComponent";
import { ColumnComponent } from "./table/Column";
import { ColumnItem } from "./table/CloumnItem";
import { Table } from "./table/Table";

export {
	AppRoot,
	CardComponent,
	ColumnComponent,
	ColumnItem as ColumnItem,
	Table as TableView,
};

declare global {
	interface HTMLElementTagNameMap {
		"app-root": AppRoot;
		"card-component": CardComponent;
		"column-component": ColumnComponent;
		"column-item": ColumnItem;
		"table-view": Table;
	}
}
