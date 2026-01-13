import { customElement, property, state } from "lit/decorators.js";
import { Component } from "../atomic/Component";
import { PropertyValueMap, css, html } from "lit";
import { consume } from "@lit-labs/context";
import { StoreActions, zustandStore } from "../../data/ZustandStore";
import { tableContext } from "../../data/contexts/TableContext";
import { Task, TaskStatus } from "@lit-labs/task";
import WikibaseClient from "../../../../shared/WikibaseClient";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import { newColumnModel } from "../../data/models/ColumnModel";
import { Toast, ToastLength } from "../../../../shared/ui/toast/Toast";
import { when } from "lit/directives/when.js";
import { ColumnItemInfo } from "../controllers/DragController";

/**
 * <new-column-dropzone> is the dropzone on the right side of the table
 * that allows users to add new columns to the table either by
 * dragging and dropping or by clicking on it.
 */
@customElement("new-column-dropzone")
export default class NewColumnDropzone extends Component {
	// --------- Contexts -------- //

	@consume({ context: tableContext })
	private tableContext!: StoreActions;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	private zustand = zustandStore.getState();

	// --------- State -------- //

	@state()
	columnIdsToBeAdded: string[] = [];

	// --------- Tasks -------- //

	private addCloumnTask = new Task(this, {
		task: async ([{ wikibaseClient, addColumn }]) => {
			this.classList.add("working");
			const entity = await wikibaseClient.getEntities(this.columnIdsToBeAdded);

			// check the editing permissions for each column
			let permissions = {} as any;
			for(let i = 0; i < this.columnIdsToBeAdded.length; i++) {
				const qid = this.columnIdsToBeAdded[i];
				if(qid === this.zustand.userQID) {
					permissions[qid] = true;
				} else {
					const hasEditingPermission = await wikibaseClient.getItemInclusion(qid, this.zustand.userQID!);
					permissions[qid] = hasEditingPermission;
				}
			}

			const wikibaseItems = Object.keys(entity.data.entities).map((input) => {
				return {
					itemId: entity.data.entities[input].id,
					text:
						entity.data.entities[input].labels?.en?.value ??
						entity.data.entities[input].labels?.de?.value ??
						"",
					url: wikibaseClient.getEntityUrl(entity.data.entities[input].id),
					qualifiers: [],
					aliases: { 
						en: entity.data.entities[input].aliases?.en ? entity.data.entities[input].aliases.en[0].value : "", 
						de: entity.data.entities[input].aliases?.de ? entity.data.entities[input].aliases.de[0].value : ""
					}
				};
			});
			
			const columnModels = wikibaseItems.map((wikibaseItem) => {
				return newColumnModel(
					wikibaseItem,
					wikibaseClient.getCachedProperties()[0],
					permissions[wikibaseItem.itemId],
				);
			});

			columnModels.forEach((columnModel) => {
				addColumn(columnModel);
			});

			document.dispatchEvent(new CustomEvent("UPDATED_COLUMNS"));
			this.columnIdsToBeAdded = [];
		},
		args: () => [
			{
				wikibaseClient: this.wikibaseClient,
				addColumn: this.tableContext.addColumn,
			},
		],
		autoRun: false,
	});

	private runAddColumnTask = () => {
		this.addCloumnTask
			.run()
			.then(() => {
				this.classList.remove("working");
			})
			.catch(() => {
				this.classList.remove("working");
				Toast.error("Error while adding columns", ToastLength.LONG).show();
			});
	};

	// ------- Lifecycle ------ //

	protected firstUpdated(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): void {
		// @ts-expect-error
		document.addEventListener("ADD_COLUMN", (e: CustomEvent) => {
			const ids = e.detail.ids;
			if (!ids) return;

			if (ids.length > 3) {
				const confirmResult = confirm(
					`Are you sure you want to add ${ids.length} new columns?`
				);
				if (!confirmResult) return;
			}
			this.columnIdsToBeAdded = ids;
			this.runAddColumnTask();
		});
	}

	// ------- Listeners ------ //

	onclick = async () => {
		const id = prompt("Enter the id of the column you want to add");
		if (!id) return;

		this.columnIdsToBeAdded = [id.trim().toUpperCase()];
		this.columnIdsToBeAdded = await filterOnViewPermission(
			this.columnIdsToBeAdded, this.wikibaseClient
		) as string[];		

		this.runAddColumnTask();
	};

	ondragover = (event: DragEvent) => {
		event.preventDefault();
		this.classList.add("highlight");
	};

	ondragleave = (event: DragEvent) => {
		event.preventDefault();
		this.classList.remove("highlight");
	};

	ondrop = (event: DragEvent) => {
		// gets called, when an item is dropped to the add-column zone
		event.preventDefault();
		this.classList.remove("highlight");
		this.dispatchEvent(
			new CustomEvent("itemDropped", {
				detail: { data: "new-column" },
			})
		);
	};

	// ------- Rendering ------ //

	render() {
		return html`
			<div id="add-symbol">
				${when(
					this.addCloumnTask.status === TaskStatus.PENDING,
					() => "...",
					() => "+"
				)}
			</div>
		`;
	}

	static styles = css`
		:host {
			min-width: 10rem;
			opacity: 0.3;
			background-color: var(--bg-dropzone-new);

			display: flex;
			justify-content: center;
			align-items: center;

			border-radius: 0 5px 5px 0;
		}
		:host(.isDragging) {
			opacity: 0.5;
		}
		:host(.working) {
			opacity: 1;
		}
		:host(.highlight) {
			opacity: 1;
		}
		:host(:hover) {
			opacity: 0.5;
		}

		#add-symbol {
			font-size: 2rem;
			font-weight: bold;
			opacity: 0.5;
		}
	`;
}

/**
 * Check over the dragged items and remove those that the current user can't view.
 * A student for example can't view other people's user items.
 * @param items an array of the items to check
 * @param wikibaseClient 
 * @returns an updated array (same type as input)
 */
export async function filterOnViewPermission(
	items: string[] | ColumnItemInfo[], 
	wikibaseClient: WikibaseClient
) {
	// check if an item can even be viewed by the user (i.e. is not a foreign user-item)
	for (let i = 0; i < items.length;i++) {
		let itemId = "";

		if (typeof items[i] === "string")  {
			itemId = items[i] as string;
		} else {
			// @ts-ignore
			itemId = items[i].item.itemId;
		}
		const result = await wikibaseClient.checkItemViewability(itemId) as boolean | any;
		if(typeof result !== "boolean") {
			items.splice(i, 1);
			const msg = result.message + ` for [${itemId}]`; 
			Toast.info(msg, ToastLength.MEDIUM).show();
		}
	}

	return items;
}