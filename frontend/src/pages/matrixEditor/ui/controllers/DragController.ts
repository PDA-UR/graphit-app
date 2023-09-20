import { ReactiveController, ReactiveControllerHost } from "lit";
import { ColumnItemModel } from "../../data/models/ColumnItemModel";
import { ColumnModel } from "../../data/models/ColumnModel";
import { ItemMoverController, MoveItemInfo } from "./ItemMoverController";
import { ConvertClaimModel } from "../../../../shared/client/ApiClient";
import WikibaseClient from "../../../../shared/WikibaseClient";

export interface DragitemInfo {
	item: ColumnItemModel;
	column: ColumnModel;
}

export class DragController implements ReactiveController {
	host: ReactiveControllerHost;

	private draggedItems: DragitemInfo[] = [];
	private itemMover: ItemMoverController;

	constructor(host: ReactiveControllerHost, wikibaseClient: WikibaseClient) {
		(this.host = host).addController(this);
		this.itemMover = new ItemMoverController(host, wikibaseClient);
	}
	hostConnected() {}

	onItemDragStart({ item, column }: DragitemInfo) {
		this.draggedItems.push({ item, column });
	}

	onItemDragEnd({ item, column }: DragitemInfo) {
		this.draggedItems = this.draggedItems.filter(
			(draggedItem) =>
				draggedItem.item !== item && draggedItem.column !== column
		);
	}

	onDrop(column: ColumnModel) {
		const convertClaimModels: MoveItemInfo[] = this.draggedItems.map(
			(draggedItem) => ({
				from: draggedItem.column.item.itemId,
				to: column.item.itemId,

				property: draggedItem.column.property.propertyId,
				value: draggedItem.item.itemId,

				newClaim: {
					property: column.property.propertyId,
					value: draggedItem.item.itemId,
				},
			})
		);
		this.itemMover.moveItems(convertClaimModels);
	}
}
