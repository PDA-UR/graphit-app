import { ReactiveController, ReactiveControllerHost } from "lit";
import { ConvertClaimModel } from "../../../../shared/client/ApiClient";
import WikibaseClient from "../../../../shared/WikibaseClient";

export interface MoveItemInfo extends ConvertClaimModel {
	from: string;
}

export enum ItemMoveStatus {
	IN_PROGRESS,
	DONE,
	ERROR,
}

export const ITEM_MOVE_EVENT = "itemMove";

export interface ItemMoveEventDetail {
	moveItemsInfo: MoveItemInfo[];
	status: ItemMoveStatus;
	error?: Error;
}

export class ItemMoverController implements ReactiveController {
	host: ReactiveControllerHost;
	private wikibaseClient: WikibaseClient;

	constructor(host: ReactiveControllerHost, wikibaseClient: WikibaseClient) {
		(this.host = host).addController(this);
		this.wikibaseClient = wikibaseClient;
	}
	hostConnected() {}

	moveItems = (_moveItemsInfo: MoveItemInfo[], doCopy = false) => {
		// Remove items that are already in the right place
		const moveItemsInfo = _moveItemsInfo.filter(
			(moveItemInfo) =>
				!(
					moveItemInfo.from === moveItemInfo.to &&
					moveItemInfo.property === moveItemInfo.newClaim.property
				)
		);
		document.dispatchEvent(
			new CustomEvent(ITEM_MOVE_EVENT, {
				detail: {
					moveItemsInfo,
					status: ItemMoveStatus.IN_PROGRESS,
				},
			})
		);

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
				document.dispatchEvent(
					new CustomEvent(ITEM_MOVE_EVENT, {
						detail: {
							moveItemsInfo,
							status: ItemMoveStatus.DONE,
						},
					})
				)
			)
			.catch((e) =>
				document.dispatchEvent(
					new CustomEvent(ITEM_MOVE_EVENT, {
						detail: {
							moveItemsInfo,
							status: ItemMoveStatus.ERROR,
							error: doCopy
								? new Error("Failed to copy.")
								: new Error("Failed to move."),
						},
					})
				)
			);
	};
}
