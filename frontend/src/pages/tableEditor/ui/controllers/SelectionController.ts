import { ReactiveController, ReactiveControllerHost } from "lit";
import { ColumnItemInfo } from "./DragController";

/**
 * The selection controller handles the selection of items.
 */
export class SelectionController implements ReactiveController {
	host: ReactiveControllerHost;

	private selectedItems: ColumnItemInfo[] = [];
	private callbacks: ((selectedItems: ColumnItemInfo[]) => void)[] = [];

	constructor(host: ReactiveControllerHost) {
		(this.host = host).addController(this);
	}

	hostConnected() {}

	selectItem(item: ColumnItemInfo) {
		this.selectedItems.push(item);
		this.notifyListeners();
	}

	deselectItem(item: ColumnItemInfo) {
		this.selectedItems.splice(
			this.selectedItems.findIndex((i) => i.item.viewId === item.item.viewId),
			1
		);
		this.notifyListeners();
	}

	deselectAll() {
		this.selectedItems.splice(0, this.selectedItems.length);
		this.notifyListeners();
	}

	isSelected(item: ColumnItemInfo) {
		return (
			this.selectedItems.find((i) => item.item.viewId === i.item.viewId) !==
			undefined
		);
	}

	getSelectedItems() {
		return this.selectedItems;
	}

	getLastSelectedItem() {
		return this.selectedItems[this.selectedItems.length - 1];
	}

	addItem(item: ColumnItemInfo) {
		this.selectedItems.push(item);
		this.notifyListeners();
	}

	addItems(items: ColumnItemInfo[]) {
		this.selectedItems.push(...items);
		this.notifyListeners();
	}

	/**
	 * Handles a click event on an item.
	 * @param item The item that has been clicked
	 * @param e The click event
	 */
	handleClick(item: ColumnItemInfo, e: MouseEvent) {
		if (e.shiftKey) {
			if (!this.isSelected(item)) this.selectItem(item);
		} else if (e.ctrlKey) {
			if (this.isSelected(item)) {
				this.deselectItem(item);
			} else {
				this.selectItem(item);
			}
		} else {
			this.deselectAll();
			this.selectItem(item);
		}
	}

	private notifyListeners() {
		this.callbacks.forEach((callback) => callback(this.selectedItems));
	}

	/**
	 * Registers a callback that is called when the selection changes.
	 * @param callback The callback that is called when the selection changes.
	 * @returns A function that unregisters the callback.
	 */
	public registerSelectionChangeCallback(
		callback: (selectedItems: ColumnItemInfo[]) => void
	): () => void {
		this.callbacks.push(callback);
		return () => this.callbacks.splice(this.callbacks.indexOf(callback), 1);
	}
}
