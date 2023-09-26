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
import { SelectionController } from "./SelectionController";

export type ItemOrigin = "search" | ColumnModel;

export interface ColumnItemInfo {
	item: ColumnItemModel;
	origin?: ItemOrigin;
}

export class DragController implements ReactiveController {
	host: ReactiveControllerHost;

	private draggedItem: ColumnItemInfo | undefined;
	private itemOperator: ItemOperationController;

	private readonly setIsDragging: (isDragging: boolean) => void = () => {};
	private readonly selectionController: SelectionController;

	constructor(
		host: ReactiveControllerHost,
		wikibaseClient: WikibaseClient,
		setIsDragging: (isDragging: boolean) => void,
		selectionController: SelectionController
	) {
		(this.host = host).addController(this);
		this.itemOperator = new ItemOperationController(host, wikibaseClient);

		this.setIsDragging = setIsDragging;
		this.selectionController = selectionController;
		console.log("drag controller", this.selectionController);
	}
	hostConnected() {}

	onItemDragStart = ({ item, origin }: ColumnItemInfo) => {
		this.draggedItem = { item, origin };
		this.setIsDragging(true);
		if (!this.selectionController.isSelected(this.draggedItem))
			this.selectionController.addItem(this.draggedItem);
	};

	onItemDragEnd({ item, origin }: ColumnItemInfo) {
		this.draggedItem = undefined;
		this.setIsDragging(false);
	}

	onDrop(dropzone: ColumnModel | "trash" | "new-column", doCopy = false) {
		this.setIsDragging(false);

		const draggedItems = this.selectionController.getSelectedItems();

		console.log("drop", dropzone, this.draggedItem, draggedItems);

		if (dropzone === "new-column") {
			console.log("new column event");
			document.dispatchEvent(
				new CustomEvent("ADD_COLUMN", {
					detail: {
						ids: draggedItems.map((draggedItem) => draggedItem.item.itemId),
					},
				})
			);
			return;
		}

		if (dropzone === "trash") {
			this.itemOperator.removeItems(
				draggedItems
					.map((draggedItem) => {
						if (draggedItem.origin === undefined) return undefined;
						if (draggedItem.origin === "search") return undefined;
						return {
							id: draggedItem.origin.item.itemId,
							property: draggedItem.origin.property.propertyId,
							value: draggedItem.item.itemId,
						};
					})
					.filter((item) => item !== undefined) as RemoveItemInfo[]
			);
			return;
		}

		const convertClaimModels: MoveItemInfo[] = draggedItems.map(
			(draggedItem) => {
				if (draggedItem.origin === "search")
					return {
						to: dropzone.item.itemId,
						value: draggedItem.item.itemId,
						newClaim: {
							property: dropzone.property.propertyId,
							value: draggedItem.item.itemId,
						},
					};
				else
					return {
						from: draggedItem.origin?.item?.itemId,
						to: dropzone.item.itemId,

						property: draggedItem.origin?.property?.propertyId,
						value: draggedItem.item.itemId,

						newClaim: {
							property: dropzone.property.propertyId,
							value: draggedItem.item.itemId,
						},
					};
			}
		);
		this.itemOperator.moveItems(convertClaimModels, doCopy);
	}
}
