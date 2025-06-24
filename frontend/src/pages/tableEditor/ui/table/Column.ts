import { html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ColumnModel } from "../../data/models/ColumnModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { map } from "lit/directives/map.js";
import { classMap } from "lit/directives/class-map.js";
import { Component } from "../atomic/Component";
import { StoreActions, zustandStore } from "../../data/ZustandStore";
import {
	ColumnItemModel,
	WikibaseQualifierModel,
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

	@property({type: String})
	private rightsIndicator = "?";

	// --------- Contexts -------- //

	private zustand = zustandStore.getState();

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
			const qualifiers = parseQualifiersConnectedByProperty(
				columnModel.property,
				entities.data.entities[columnModel.item.itemId],
			);
			const entityInfos = await wikibaseClient.getEntityInfos(entityIds);

			const newItems = entityInfos.map((entityInfo) =>
				newColumnItemModel(entityInfo.id, entityInfo.label, entityInfo.url, qualifiers[entityInfo.id])
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

	/**
	 * Checks wether an item can be edited by a logged in user
	 * @param itemId QID of the item to be edited
	 * @param userQID QID of the users wikibase item
	 * @returns boolean
	 */
	async checkEdibility(itemId: string, userQID: string): Promise<boolean> {
		// NOTE: "manually" return true, as the query below doesn't check this case (returns false)
		if (itemId === userQID) return true;

		const editable = await this.wikibaseClient.getItemInclusion(itemId, userQID!);
		return editable;
	}

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

		if(!this.zustand.isAdmin) {
			this.checkEdibility(this.columnModel.item.itemId, this.zustand.userQID!)
				.then((value) => {
					if(value) this.rightsIndicator = "🟩";
					else this.rightsIndicator = "🟥"
				});
		} else this.rightsIndicator = ""; // omit feedback for admin (as it's always: 🟩)
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

		// Allows user to modify drag with key -> i.e. change move to copy
		// NOTE: Works, but does not seem the most robust (e.g: https://stackoverflow.com/q/72389012)
		let doCopy =
			event.ctrlKey || event.metaKey || event.altKey || event.shiftKey; 
		const copyToggle = this.dragController.getCopyToggle();
		if (copyToggle) doCopy = copyToggle; // override modified drag, if "copy" toggled on

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
				<div id="rights-indicator">${this.rightsIndicator}</div>
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
		#rights-indicator {
			margin-left: 5px;
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

		select option[value="P1"] { /* depends on */
			background: rgba(255, 176, 213, 0.3);
		}
		select option[value="P12"] { /* has completed */
  			background: rgba(134, 190, 134, 0.3);
		}
		select option[value="P23"] { /* interested in */
			background: rgba(167, 150, 225, 0.3);
		}
		select option[value="P14"] { /* includes */
			background: rgba(162, 229, 255, 0.3)
		}

	`;
}

// valid items are claims that are of the same type as the column property
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

/**
 * Parse all qualifiers of an entity into a readable format.
 * @param property The property linking to the entity
 * @param entity 
 * @returns A dictionary of each item and their linked qualifiers as an array
 * (e.g. { Q105: { P37: ["P12", "P14"], P15: ["very good"] } }
 */
export const parseQualifiersConnectedByProperty = (
	property: WikibasePropertyModel,
	entity: any,
) => {
	let qualifiers = {} as any;
	const items = entity.claims[property.propertyId] as Array<any>

	if (items == undefined) return {}; 

	items.forEach((item:any) => {
		if (item.qualifiers == null) return;

		var qualifierValues = {} as WikibaseQualifierModel;
		
		const targetElementId = item.mainsnak.datavalue.value.id;
		const quals = item.qualifiers; 

		for (const [key, value] of Object.entries(quals)) {

			let valueArr = value as any;

			let entries = [] as any;
			for(let i = 0; i < valueArr.length; i++) {
				let v = valueArr[i].datavalue.value;
				if (v["entity-type"] != undefined ) {
					entries.push(v.id);
				} else if (v["time"] != undefined) {
					entries.push(v.time);
				} else entries.push(v);
			}
			
			qualifierValues[key] = entries; 
		}
		qualifiers[targetElementId] = qualifierValues;
	})
	
	return qualifiers
}
