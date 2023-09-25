import { ReactiveController, ReactiveControllerHost } from "lit";
import { ColumnItemModel } from "../../data/models/ColumnItemModel";
import { ColumnModel } from "../../data/models/ColumnModel";
import {
	ItemOperationController,
	MoveItemInfo,
} from "./ItemOperationController";
import { ConvertClaimModel } from "../../../../shared/client/ApiClient";
import WikibaseClient from "../../../../shared/WikibaseClient";

export interface DragitemInfo {
	item: ColumnItemModel;
	column: ColumnModel;
}

export class DragController implements ReactiveController {
	host: ReactiveControllerHost;

	private draggedItems: DragitemInfo[] = [];
	private itemOperator: ItemOperationController;

	constructor(host: ReactiveControllerHost, wikibaseClient: WikibaseClient) {
		(this.host = host).addController(this);
		this.itemOperator = new ItemOperationController(host, wikibaseClient);
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

	onDrop(column: ColumnModel | "trash", doCopy = false) {
		if (column === "trash") {
			this.itemOperator.removeItems(
				this.draggedItems.map((draggedItem) => {
					return {
						id: draggedItem.column.item.itemId,
						property: draggedItem.column.property.propertyId,
						value: draggedItem.item.itemId,
					};
				})
			);
			return;
		}

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
		this.itemOperator.moveItems(convertClaimModels, doCopy);
	}
}
