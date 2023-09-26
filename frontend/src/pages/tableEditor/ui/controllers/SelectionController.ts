import { ReactiveController, ReactiveControllerHost } from "lit";
import { ColumnItemInfo } from "./DragController";

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
	}

	deselectItem(item: ColumnItemInfo) {
		this.selectedItems.splice(this.selectedItems.indexOf(item), 1);
	}

	deselectAll() {
		this.selectedItems.splice(0, this.selectedItems.length);
	}

	isSelected(item: ColumnItemInfo) {
		return this.selectedItems.includes(item);
	}

	getSelectedItems() {
		return this.selectedItems;
	}

	addItem(item: ColumnItemInfo) {
		this.selectedItems.push(item);
		this.notifyListeners();
	}

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
		this.notifyListeners();
	}

	private notifyListeners() {
		this.callbacks.forEach((callback) => callback(this.selectedItems));
	}

	public registerSelectionChangeCallback(
		callback: (selectedItems: ColumnItemInfo[]) => void
	): () => void {
		this.callbacks.push(callback);
		return () => this.callbacks.splice(this.callbacks.indexOf(callback), 1);
	}
}
