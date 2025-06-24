import { ReactiveController, ReactiveControllerHost } from "lit";
import { ColumnItemModel } from "../../data/models/ColumnItemModel";
import { ColumnModel } from "../../data/models/ColumnModel";
import {
	ItemOperationController,
	MoveItemInfo,
	RemoveItemInfo,
} from "./ItemOperationController";
import WikibaseClient from "../../../../shared/WikibaseClient";
import { SelectionController } from "./SelectionController";
import { Toast, ToastLength } from "../../../../shared/ui/toast/Toast";
import { filterOnViewPermission } from "../table/NewColumnDropzone";

/**
 * The origin, from which an item has been dragged from.
 */
export type ItemOrigin = "search" | ColumnModel;

/**
 * Information about an item that is being dragged.
 */
export interface ColumnItemInfo {
	item: ColumnItemModel;
	origin?: ItemOrigin;
}

/**
 * The drag controller handles the drag and drop of items.
 * It also communicates with the item operation controller to
 * move or copy items in wikibase.
 */
export class DragController implements ReactiveController {
	host: ReactiveControllerHost;

	private isCopyToggleOn:  boolean = false;
	private moveQualifiers: boolean = false;
	private draggedItem: ColumnItemInfo | undefined;
	private readonly setIsDragging: (isDragging: boolean) => void = () => {};
	
	private readonly selectionController: SelectionController;
	private readonly itemOperator: ItemOperationController;
	private readonly wikibaseClient: WikibaseClient;

	constructor(
		host: ReactiveControllerHost,
		wikibaseClient: WikibaseClient,
		setIsDragging: (isDragging: boolean) => void,
		selectionController: SelectionController
	) {
		(this.host = host).addController(this);
		this.itemOperator = new ItemOperationController(host, wikibaseClient);
		this.wikibaseClient = wikibaseClient;

		this.setIsDragging = setIsDragging;
		this.selectionController = selectionController;
	}

	hostConnected() {}

	setCopyToggle(on: boolean) {
		this.isCopyToggleOn = on;
	}

	setQualifierToggle(on: boolean) {
		this.moveQualifiers = on
	}

	getCopyToggle(){
		return this.isCopyToggleOn;
	}

	// ------ Drag and Drop ------ //

	// an item is dragged
	onItemDragStart = ({ item, origin }: ColumnItemInfo) => {
		this.draggedItem = { item, origin };
		this.setIsDragging(true);
		if (!this.selectionController.isSelected(this.draggedItem)) {
			this.selectionController.addItem(this.draggedItem);
		}
	};

	// an item has been dropped somewhere (called after onDrop)
	onItemDragEnd() {
		this.draggedItem = undefined;
		this.setIsDragging(false);
	}

	// an item has been dropped INTO A DROPZONE
	async onDrop(dropzone: ColumnModel | "trash" | "new-column", doCopy = this.isCopyToggleOn) {
		this.setIsDragging(false);

		let draggedItems = this.selectionController.getSelectedItems();

		// Dropped in <new-column-dropzone>
		if (dropzone === "new-column") {
			draggedItems = await filterOnViewPermission(draggedItems, this.wikibaseClient) as ColumnItemInfo[];
			
			console.log("new column event");
			document.dispatchEvent(
				new CustomEvent("ADD_COLUMN", {
					detail: {
						ids: draggedItems.map((draggedItem) => draggedItem.item.itemId),
					},
				})
			);
			this.selectionController.deselectAll();

			return;
		}

		// Dropped in <trash-component>
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
			console.log("trash event done", draggedItems);
			this.selectionController.deselectAll();
			return;
		}

		// Dropped in <column-component>
		const convertClaimModels: MoveItemInfo[] = draggedItems.map(
			(draggedItem) => {
				let newQualifiers = draggedItem.item.qualifiers as String[] | undefined;
				if (this.moveQualifiers == false) newQualifiers = undefined; // check if copy or not
				if (newQualifiers?.length == 0) newQualifiers = undefined; // fallback, when empty qualifier arr

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
							qualifiers: newQualifiers, 
						},
					};
			}
		);
		this.selectionController.deselectAll();
		this.itemOperator.moveItems(convertClaimModels, doCopy);
	}

}
