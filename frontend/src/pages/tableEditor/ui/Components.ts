import AppRoot from "./App";
import { CardComponent } from "./atomic/Card";
import { ColumnComponent } from "./table/Column";
import { ColumnItem } from "./table/CloumnItem";
import { Table } from "./table/Table";
import { ColumnItemList } from "./table/ColumnItemList";
import { Trash } from "./atomic/Trash";
import SearchSidebar from "./SearchSidebar";
import NewColumnDropzone from "./table/NewColumnDropzone";
import { InfoBox } from "./atomic/InfoBox";
import { LoginPrompt } from "./atomic/Login";
import { ItemCreator } from "./atomic/ItemCreator";

/**
 * Components are the building blocks of the UI.
 * If you define a new component, you must add it to this list.
 * OTHERWISE, it will not be available in the UI.
 */

export {
	AppRoot,
	CardComponent,
	ColumnComponent,
	ColumnItem as ColumnItem,
	Table as TableView,
	ColumnItemList,
	Trash,
	SearchSidebar,
	NewColumnDropzone,
	InfoBox,
	LoginPrompt,
	ItemCreator,
};

// Optional type declarations for TypeScript consumers
declare global {
	interface HTMLElementTagNameMap {
		"app-root": AppRoot;
		"card-component": CardComponent;
		"column-component": ColumnComponent;
		"column-item": ColumnItem;
		"table-view": Table;
		"column-item-list": ColumnItemList;
		"trash-component": Trash;
		"search-sidebar": SearchSidebar;
		"new-column-dropzone": NewColumnDropzone;
		"info-box": InfoBox;
		"login-prompt": LoginPrompt;
		"item-creator-component": ItemCreator;
	}
}
