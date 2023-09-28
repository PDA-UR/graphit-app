import { ReactiveController, ReactiveControllerHost } from "lit";
import {
	ConvertClaimModel,
	CreateClaimModel,
	RemoveClaimModel,
} from "../../../../shared/client/ApiClient";
import WikibaseClient from "../../../../shared/WikibaseClient";

/**
 * Information about an item that is being moved.
 */
export interface MoveItemInfo {
	to: string; // the item id that's being moved

	// information on where the property is moved from
	// may be undefined if the property is created (e.g. from search)
	from?: string; // entity id of the property
	property?: string; // property id
	value?: string; // value of the property

	// information on the new property to create
	newClaim: CreateClaimModel;
}

/**
 * Information about an item that is being removed.
 */
export interface RemoveItemInfo extends RemoveClaimModel {
	id: string;
}

/**
 * The status of an item operation.
 */
export enum ItemOperationStatus {
	IN_PROGRESS,
	DONE,
	ERROR,
}

export const ITEM_MOVE_EVENT = "itemMove";
export const ITEM_REMOVE_EVENT = "itemRemove";

export interface ItemMoveEventDetail {
	moveItemsInfo: MoveItemInfo[];
	status: ItemOperationStatus;
	error?: Error;
}

export interface ItemRemoveEventDetail {
	removeItemsInfo: RemoveItemInfo[];
	status: ItemOperationStatus;
	error?: Error;
}

/**
 * The item operation controller handles the moving and removing of items.
 * It directly communicates with the wikibase client to perform the operations.
 * It also dispatches events to inform other components about the status of the operations.
 */
export class ItemOperationController implements ReactiveController {
	host: ReactiveControllerHost;
	private wikibaseClient: WikibaseClient;

	constructor(host: ReactiveControllerHost, wikibaseClient: WikibaseClient) {
		(this.host = host).addController(this);
		this.wikibaseClient = wikibaseClient;
	}
	hostConnected() {}

	private updateMoveStatus = (
		moveItemsInfo: MoveItemInfo[],
		status: ItemOperationStatus,
		error?: Error
	) => {
		document.dispatchEvent(
			new CustomEvent(ITEM_MOVE_EVENT, {
				detail: {
					moveItemsInfo,
					status,
					error,
				},
			})
		);
	};

	private updateRemoveStatus = (
		removeItemsInfo: RemoveItemInfo[],
		status: ItemOperationStatus,
		error?: Error
	) => {
		document.dispatchEvent(
			new CustomEvent(ITEM_REMOVE_EVENT, {
				detail: {
					removeItemsInfo,
					status,
					error,
				},
			})
		);
	};

	/**
	 * Moves items (properties) between entities
	 * @param _moveItemsInfo Info on the items to move
	 * @param doCopy If true, the items are copied instead of moved
	 */
	moveItems = (_moveItemsInfo: MoveItemInfo[], doCopy: boolean) => {
		// Remove items that are already in the right place
		const moveItemsInfo = _moveItemsInfo.filter(
			(moveItemInfo) =>
				!(
					moveItemInfo.from === moveItemInfo.to &&
					moveItemInfo.property === moveItemInfo.newClaim.property
				)
		);

		this.updateMoveStatus(moveItemsInfo, ItemOperationStatus.IN_PROGRESS);

		const jobs = moveItemsInfo.map(async (moveItemInfo) => {
			if (moveItemInfo.from === undefined || doCopy)
				await this.wikibaseClient.createClaim(
					moveItemInfo.to,
					moveItemInfo.newClaim
				);
			else
				await this.wikibaseClient.convertClaim(
					moveItemInfo.from,
					moveItemInfo as ConvertClaimModel
				);
		});

		Promise.all(jobs)
			.then(() =>
				this.updateMoveStatus(moveItemsInfo, ItemOperationStatus.DONE)
			)
			.catch((e) => {
				console.error(e);
				this.updateMoveStatus(
					moveItemsInfo,
					ItemOperationStatus.ERROR,
					new Error("Operation failed.")
				);
			});
	};

	/**
	 * Removes items (properties) from entities
	 * @param removeItems Info on the items to remove
	 */
	removeItems = (removeItems: RemoveItemInfo[]) => {
		console.log("remove items", removeItems);
		this.updateRemoveStatus(removeItems, ItemOperationStatus.IN_PROGRESS);

		const jobs = removeItems.map(async (removeItem) => {
			await this.wikibaseClient.removeClaim(removeItem.id, {
				property: removeItem.property,
				value: removeItem.value,
			});
		});

		Promise.all(jobs)
			.then((r) => {
				this.updateRemoveStatus(removeItems, ItemOperationStatus.DONE);
			})
			.catch((e) =>
				this.updateRemoveStatus(
					removeItems,
					ItemOperationStatus.ERROR,
					new Error("Failed to remove.")
				)
			);
	};
}
