import { ReactiveController, ReactiveControllerHost } from "lit";
import { ColumnItemModel } from "../../data/models/ColumnItemModel";
import { ColumnModel } from "../../data/models/ColumnModel";
import {
	ItemOperationController,
	MoveItemInfo,
	RemoveItemInfo,
} from "./ItemOperationController";
import { ConvertClaimModel } from "../../../../shared/client/ApiClient";
import WikibaseClient from "../../../../shared/WikibaseClient";

export interface DragitemInfo {
	item: ColumnItemModel;
	dragFromInfo?: ColumnModel;
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

	onItemDragStart({ item, dragFromInfo }: DragitemInfo) {
		this.draggedItems.push({ item, dragFromInfo });
	}

	onItemDragEnd({ item, dragFromInfo }: DragitemInfo) {
		this.draggedItems = this.draggedItems.filter(
			(draggedItem) =>
				draggedItem.item !== item && draggedItem.dragFromInfo !== dragFromInfo
		);
	}

	onDrop(column: ColumnModel | "trash", doCopy = false) {
		if (column === "trash") {
			this.itemOperator.removeItems(
				this.draggedItems
					.map((draggedItem) => {
						if (draggedItem.dragFromInfo === undefined) return undefined;
						return {
							id: draggedItem.dragFromInfo.item.itemId,
							property: draggedItem.dragFromInfo.property.propertyId,
							value: draggedItem.item.itemId,
						};
					})
					.filter((item) => item !== undefined) as RemoveItemInfo[]
			);
			return;
		}

		const convertClaimModels: MoveItemInfo[] = this.draggedItems.map(
			(draggedItem) => ({
				from: draggedItem.dragFromInfo?.item.itemId,
				to: column.item.itemId,

				property: draggedItem.dragFromInfo?.property.propertyId,
				value: draggedItem.item.itemId,

				newClaim: {
					property: column.property.propertyId,
					value: draggedItem.item.itemId,
				},
			})
		);
		this.itemOperator.moveItems(convertClaimModels);
	}
}
