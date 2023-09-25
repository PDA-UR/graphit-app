import { ReactiveController, ReactiveControllerHost } from "lit";
import {
	ConvertClaimModel,
	RemoveClaimModel,
} from "../../../../shared/client/ApiClient";
import WikibaseClient from "../../../../shared/WikibaseClient";

export interface MoveItemInfo extends ConvertClaimModel {
	from: string;
}

export interface RemoveItemInfo extends RemoveClaimModel {
	id: string;
}

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

	moveItems = (_moveItemsInfo: MoveItemInfo[], doCopy = false) => {
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
			if (doCopy)
				await this.wikibaseClient.createClaim(
					moveItemInfo.to,
					moveItemInfo.newClaim
				);
			else
				await this.wikibaseClient.convertClaim(moveItemInfo.from, moveItemInfo);
		});

		Promise.all(jobs)
			.then(() =>
				this.updateMoveStatus(moveItemsInfo, ItemOperationStatus.DONE)
			)
			.catch((e) =>
				this.updateMoveStatus(
					moveItemsInfo,
					ItemOperationStatus.ERROR,
					doCopy ? new Error("Failed to copy.") : new Error("Failed to move.")
				)
			);
	};

	removeItems = (removeItems: RemoveItemInfo[]) => {
		this.updateRemoveStatus(removeItems, ItemOperationStatus.IN_PROGRESS);

		const jobs = removeItems.map(async (removeItem) => {
			await this.wikibaseClient.removeClaim(removeItem.id, removeItem);
		});

		Promise.all(jobs)
			.then(() =>
				this.updateRemoveStatus(removeItems, ItemOperationStatus.DONE)
			)
			.catch((e) =>
				this.updateRemoveStatus(
					removeItems,
					ItemOperationStatus.ERROR,
					new Error("Failed to remove.")
				)
			);
	};
}
