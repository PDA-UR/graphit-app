import { html, css, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ColumnModel } from "../../data/models/ColumnModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { map } from "lit/directives/map.js";

import { Component } from "../atomic/Component";
import { StoreActions } from "../../data/ZustandStore";
import { ColumnItem } from "./CloumnItem";
import {
	ColumnItemModel,
	newColumnItemModel,
} from "../../data/models/ColumnItemModel";
import { Task, TaskStatus } from "@lit-labs/task";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import WikibaseClient from "../../../../shared/WikibaseClient";
import { choose } from "lit/directives/choose.js";
import { WikibasePropertyModel } from "../../../../shared/client/ApiClient";
import {
	ITEM_MOVE_EVENT,
	ItemMoveEventDetail,
	ItemMoveStatus,
} from "../controllers/ItemMoverController";

@customElement("column-component")
export class ColumnComponent extends Component {
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			background-color: #f5f5f5;
			border-radius: 5px;
			padding: 0.5rem;
			gap: 0.5rem;
			width: 23rem;
		}
		:host(.highlight) {
			background-color: #e5e5e5;
		}
		:host(:hover) #delete-button {
			opacity: 1;
		}
		.items {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			overflow-y: auto;
			padding: 0.5rem;
		}

		#top-bar {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
		#top-bar > * {
			white-space: nowrap;
		}
		.spacer {
			min-width: 1rem;
		}
		#delete-button {
			opacity: 0;
			transition: opacity 0.1s ease-in-out;
		}
		#column-title {
			text-align: center;
			line-height: 1.5rem;
			height: 1.5rem;
		}
	`;

	// delete button is only visible when hovering the host container,
	// its positioned absolute top right OF THE HOST CONTAINER
	@state()
	items: ColumnItemModel[] = [];

	@state()
	itemMoveStatus: ItemMoveStatus | undefined;

	@state()
	filter = "";

	@property({ type: Object, attribute: false })
	columnModel!: ColumnModel;

	@consume({ context: tableContext })
	@property({ attribute: false })
	public tableActions!: StoreActions;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	private loadItemsTask = new Task(this, {
		task: async ([{ wikibaseClient, columnModel, items }]) => {
			const entities = await wikibaseClient.getEntities([
				columnModel.item.itemId,
			]);
			console.log("entities", entities);
			const entityIds = parseEntitiesConnectedByProperty(
				columnModel.property,
				entities.data.entities[columnModel.item.itemId]
			);
			console.log("entityIds", entityIds);
			const entityInfos = await wikibaseClient.getEntityInfos(entityIds);
			console.log("entityInfos", entityInfos);
			const newItems = entityInfos.map((entityInfo) =>
				newColumnItemModel(entityInfo.id, entityInfo.label)
			);
			console.log("newItems", newItems);
			items.splice(0, items.length, ...newItems);
		},
		args: () => [
			{
				wikibaseClient: this.wikibaseClient,
				columnModel: this.columnModel,
				items: this.items,
			},
		],
		autoRun: false,
	});

	protected firstUpdated(): void {
		// @ts-ignore
		document.addEventListener(
			ITEM_MOVE_EVENT,
			(e: CustomEvent<ItemMoveEventDetail>) => {
				const thisColumnIsInvolved =
					e.detail.moveItemsInfo.some(
						(moveItemInfo) =>
							moveItemInfo.from === this.columnModel.item.itemId &&
							moveItemInfo.property === this.columnModel.property.propertyId
					) ||
					e.detail.moveItemsInfo.some(
						(moveItemInfo) =>
							moveItemInfo.to === this.columnModel.item.itemId &&
							moveItemInfo.newClaim.property ===
								this.columnModel.property.propertyId
					);
				if (!thisColumnIsInvolved) return;

				this.itemMoveStatus = e.detail.status;
				if (e.detail.status === ItemMoveStatus.DONE) {
					this.loadItemsTask.run();
					this.itemMoveStatus = undefined;
				}
			}
		);
	}

	updated(changedProperties: Map<string | number | symbol, unknown>) {
		super.updated(changedProperties);
		if (changedProperties.has("columnModel")) {
			const oldVal = changedProperties.get("columnModel") as ColumnModel;
			if (oldVal?.property !== this.columnModel.property) {
				this.loadItemsTask.run();
			}
		}
	}

	handlePropertyChange(event: Event) {
		const newValue = (event.target as HTMLSelectElement).value,
			newProperty = this.wikibaseClient.findCachedPropertyById(newValue);

		if (newProperty)
			this.tableActions?.setColumnProperty(
				this.columnModel.viewId,
				newProperty
			);
	}

	ondrop = (event: DragEvent) => {
		event.preventDefault();
		console.log("dropped");
		this.dispatchEvent(new CustomEvent("itemDropped"));
		this.classList.remove("highlight");
	};

	ondragover = (event: DragEvent) => {
		event.preventDefault();
		this.classList.add("highlight");
	};

	ondragleave = (event: DragEvent) => {
		event.preventDefault();
		this.classList.remove("highlight");
	};

	onDeleteColumn() {
		this.tableActions.removeColumn(this.columnModel.viewId);
	}

	// ... styles and other properties

	render() {
		console.log(
			"rendering column with property",
			this.columnModel.property.propertyId
		);
		return html`
			<div id="top-bar">
				<span id="column-title">
					${this.columnModel.item.text} (${this.columnModel.item.itemId})
				</span>

				<div class="spacer"></div>
				<button id="delete-button" @click="${() => this.onDeleteColumn()}">
					x
				</button>
			</div>
			<select @change="${this.handlePropertyChange}">
				${map(
					this.wikibaseClient.getCachedProperties(),
					(property) => html`
						<option
							value="${property.propertyId}"
							?selected="${property.propertyId ===
							this.columnModel.property.propertyId}"
						>
							${property.label} (${property.propertyId})
						</option>
					`
				)}
			</select>
			<input
				type="text"
				placeholder="Filter items"
				@input="${(e: InputEvent) =>
					(this.filter = (e.target as HTMLInputElement).value)}"
			/>
			<div class="items" data-column-id="${this.columnModel.viewId}">
				${choose(this.itemMoveStatus, [
					[
						undefined,
						() =>
							html` ${choose(this.loadItemsTask.status, [
								[TaskStatus.PENDING, () => html`Loading items...`],
								[
									TaskStatus.COMPLETE,
									() =>
										html`${map(
											this.items.filter(
												(item) =>
													item.text.includes(this.filter) ||
													item.itemId.includes(this.filter)
											),
											(item) =>
												html`
													<column-item
														.columnItemModel="${item}"
														@dragstart="${(e: DragEvent) => {
															this.dispatchEvent(
																new CustomEvent("itemDraggedStart", {
																	detail: {
																		item,
																		column: this.columnModel,
																	},
																})
															);
														}}"
														@dragend="${(e: DragEvent) => {
															this.dispatchEvent(
																new CustomEvent("itemDraggedEnd", {
																	detail: {
																		item,
																		column: this.columnModel,
																	},
																})
															);
														}}"
													></column-item>
												`
										)}`,
								],
								[
									TaskStatus.ERROR,
									() => html`Error loading items, ${this.loadItemsTask.error}`,
								],
							])}`,
					],
					[ItemMoveStatus.IN_PROGRESS, () => html`Moving items...`],
					[ItemMoveStatus.ERROR, () => html`ERROR MOVING ITEMS`],
				])}
			</div>
		`;
	}
}

// valid items are cleims that are of the same type as the column property
export const parseEntitiesConnectedByProperty = (
	property: WikibasePropertyModel,
	entity: any
): string[] => {
	const entityIds: string[] = [];
	const claims = entity.claims[property.propertyId];
	if (!claims) return entityIds;
	claims.forEach((claim: any) => {
		const targetElementId = claim.mainsnak.datavalue.value.id;
		entityIds.push(targetElementId);
	});

	return entityIds;
};
