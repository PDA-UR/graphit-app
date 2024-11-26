import { html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ColumnModel } from "../../data/models/ColumnModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { map } from "lit/directives/map.js";
import { classMap } from "lit/directives/class-map.js";
import { Component } from "../atomic/Component";
import { StoreActions } from "../../data/ZustandStore";
import {
	ColumnItemModel,
	newColumnItemModel,
} from "../../data/models/ColumnItemModel";
import { Task, TaskStatus } from "@lit-labs/task";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import WikibaseClient from "../../../../shared/WikibaseClient";
import { WikibasePropertyModel } from "../../../../shared/client/ApiClient";
import {
	ITEM_MOVE_EVENT,
	ITEM_REMOVE_EVENT,
	ItemMoveEventDetail,
	ItemOperationStatus,
	ItemRemoveEventDetail,
} from "../controllers/ItemOperationController";
import { Toast, ToastLength } from "../../../../shared/ui/toast/Toast";
import { when } from "lit/directives/when.js";
import { dragControllerContext } from "../../data/contexts/DragControllerContext";
import { DragController } from "../controllers/DragController";

/**
 * <column-component> is a single column in the table.
 */
@customElement("column-component")
export class ColumnComponent extends Component {
	// --------- State -------- //

	@state()
	items: ColumnItemModel[] = [];

	@state()
	itemOperationStatus: ItemOperationStatus | undefined;

	@state()
	filter = "";

	@state()
	isDragover = false;


	// --------- Properties -------- //

	@property({ type: Object })
	columnModel!: ColumnModel;

	@property({ type: Boolean })
	private isDragging = false;

	@property({ type: Boolean })
	private isCopyToggleOn!: boolean;

	// --------- Contexts -------- //

	@consume({ context: tableContext })
	public tableActions!: StoreActions;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	@consume({ context: dragControllerContext })
	private dragController!: DragController;

	// --------- Tasks -------- //

	private loadItemsTask = new Task(this, {
		task: async ([{ wikibaseClient, columnModel, items }]) => {
			const entities = await wikibaseClient.getEntities([
				columnModel.item.itemId,
			]);
			const entityIds = parseEntitiesConnectedByProperty(
				columnModel.property,
				entities.data.entities[columnModel.item.itemId]
			);
			const entityInfos = await wikibaseClient.getEntityInfos(entityIds);
			const newItems = entityInfos.map((entityInfo) =>
				newColumnItemModel(entityInfo.id, entityInfo.label, entityInfo.url)
			);
			this.items = newItems;
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

	// --------- Lifecycle -------- //

	protected firstUpdated(): void {
		// @ts-expect-error
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
				this.onItemOperation(e);
			}
		);

		// @ts-expect-error
		document.addEventListener(
			ITEM_REMOVE_EVENT,
			(e: CustomEvent<ItemRemoveEventDetail>) => {
				const thisColumnIsInvolved = e.detail.removeItemsInfo.some(
					(removeItemInfo) =>
						removeItemInfo.id === this.columnModel.item.itemId &&
						removeItemInfo.property === this.columnModel.property.propertyId
				);
				if (!thisColumnIsInvolved) return;
				this.onItemOperation(e);
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
		} else if (changedProperties.has("isDragging")) {
			const oldVal = changedProperties.get("isDragging") as boolean;
			if (oldVal !== this.isDragging) {
				if (!this.isDragging) {
					this.classList.remove("highlight");
					this.isDragover = false;
				}
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

	// --------- Listeners -------- //

	private onItemOperation = (e: CustomEvent) => {
		this.itemOperationStatus = e.detail.status;
		if (e.detail.status === ItemOperationStatus.DONE) {
			this.loadItemsTask.run();
			this.itemOperationStatus = undefined;
		} else if (e.detail.status === ItemOperationStatus.ERROR) {
			Toast.fromError(e.detail.error!, ToastLength.LONG).show();
		}
	};

	onItemDragStart = (e: CustomEvent) => {
		this.dragController.onItemDragStart(e.detail);
	};

	onItemDragEnd = (e: CustomEvent) => {
		this.dragController.onItemDragEnd();
	};

	onItemDropped = (colummnModel: ColumnModel | "trash", doCopy: boolean) => {
		this.dragController.onDrop(colummnModel, doCopy);
	};

	ondrop = (event: DragEvent) => {
		// Gets called, when an items gets dropped into an existing column
		event.preventDefault();

		let doCopy =
			event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
		const copyToggle = this.dragController.getCopyToggle();
		if (copyToggle) doCopy = copyToggle; // override, if copy toggled on


		this.dragController.onDrop(this.columnModel, doCopy);
		this.isDragover = false;
	};

	ondragover = (event: DragEvent) => {
		event.preventDefault();
		this.classList.add("highlight");
		this.isDragover = true;
	};

	ondragleave = (event: DragEvent) => {
		event.preventDefault();
		this.classList.remove("highlight");
		this.isDragover = false;
	};

	onDeleteColumn = () => {
		this.tableActions.removeColumn(this.columnModel.viewId);
	};

	onDoubleClickColumnTitle = () => {
		window.open(this.columnModel.item.url, "_blank");
	};

	// --------- Rendering -------- //

	render() {
		return html`
			<div id="top-bar">
				<div
					id="column-title"
					@click="${() => this.onDoubleClickColumnTitle()}"
				>
					${this.columnModel.item.text} (${this.columnModel.item.itemId})
				</div>

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

			<column-item-list
				class="${classMap({
					loading:
						this.itemOperationStatus === ItemOperationStatus.IN_PROGRESS ||
						this.loadItemsTask.status === TaskStatus.PENDING,
					error: this.loadItemsTask.status === TaskStatus.ERROR,
				})}"
				.origin="${this.columnModel}"
				.items="${this.items}"
				.filter="${this.filter}"
				@itemDraggedStart="${(e: any) => this.onItemDragStart(e)}"
				@itemDraggedEnd="${(e: any) => this.onItemDragEnd(e)}"
			></column-item-list>

			<trash-component
				class="${when(
					this.isDragover,
					() => "",
					() => "hidden"
				)}"
			></trash-component>
		`;
	}
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			background-color: var(--bg-dropzone);
			border-radius: 5px;
			padding: 0.5rem;
			gap: 0.5rem;
			width: 23rem;
		}
		:host(.highlight) {
			background-color: var(--bg-dropzone-highlight);
		}
		:host(:hover) #delete-button {
			opacity: 1;
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
			min-width: 0.2rem;
		}
		#delete-button {
			opacity: 0;
			transition: opacity 0.1s ease-in-out;
		}
		#column-title {
			text-align: center;
			line-height: 1.5rem;
			height: 1.5rem;
			user-select: none;
			cursor: pointer;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		#column-title:hover {
			text-decoration: underline;
		}
	`;
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
