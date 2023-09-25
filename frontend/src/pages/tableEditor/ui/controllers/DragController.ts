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
import { state } from "lit/decorators.js";

export interface DragitemInfo {
	item: ColumnItemModel;
	dragFromInfo?: ColumnModel;
}

export class DragController implements ReactiveController {
	host: ReactiveControllerHost;

	private draggedItems: DragitemInfo[] = [];
	private itemOperator: ItemOperationController;

	constructor(
		host: ReactiveControllerHost,
		wikibaseClient: WikibaseClient,
		private setIsDragging: (isDragging: boolean) => void
	) {
		(this.host = host).addController(this);
		this.itemOperator = new ItemOperationController(host, wikibaseClient);
	}
	hostConnected() {}

	onItemDragStart({ item, dragFromInfo }: DragitemInfo) {
		console.log("drag start", item, dragFromInfo);
		this.draggedItems.push({ item, dragFromInfo });
		this.setIsDragging(true);
	}

	onItemDragEnd({ item, dragFromInfo }: DragitemInfo) {
		this.draggedItems = this.draggedItems.filter(
			(draggedItem) =>
				draggedItem.item !== item && draggedItem.dragFromInfo !== dragFromInfo
		);
		this.setIsDragging(this.draggedItems.length > 0);
	}

	onDrop(dropzone: ColumnModel | "trash" | "new-column", doCopy = false) {
		this.setIsDragging(false);
		if (dropzone === "new-column") {
			console.log("new column event");
			document.dispatchEvent(
				new CustomEvent("ADD_COLUMN", {
					detail: {
						ids: this.draggedItems.map(
							(draggedItem) => draggedItem.item.itemId
						),
					},
				})
			);
			return;
		}

		if (dropzone === "trash") {
			this.itemOperator.removeItems(
				this.draggedItems
					.map((draggedItem) => {
						console.log(draggedItem);
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
				from: draggedItem.dragFromInfo?.item?.itemId,
				to: dropzone.item.itemId,

				property: draggedItem.dragFromInfo?.property?.propertyId,
				value: draggedItem.item.itemId,

				newClaim: {
					property: dropzone.property.propertyId,
					value: draggedItem.item.itemId,
				},
			})
		);
		this.itemOperator.moveItems(convertClaimModels, doCopy);
	}
}
