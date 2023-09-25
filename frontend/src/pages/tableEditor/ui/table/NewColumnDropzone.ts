import { customElement, property, state } from "lit/decorators.js";
import { Component } from "../atomic/Component";
import { PropertyValueMap, css, html } from "lit";
import { consume } from "@lit-labs/context";
import ZustandStore, { StoreActions } from "../../data/ZustandStore";
import { tableContext } from "../../data/contexts/TableContext";
import { Task, TaskStatus } from "@lit-labs/task";
import WikibaseClient from "../../../../shared/WikibaseClient";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import { newColumnModel } from "../../data/models/ColumnModel";
import { Toast, ToastLength } from "../../../../shared/ui/toast/Toast";
import { when } from "lit/directives/when.js";

@customElement("new-column-dropzone")
export default class NewColumnDropzone extends Component {
	@state()
	columnIdsToBeAdded: string[] = [];

	@consume({ context: tableContext })
	private tableContext!: StoreActions;

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	private addCloumnTask = new Task(this, {
		task: async ([{ wikibaseClient, addColumn }]) => {
			this.classList.add("working");
			const entity = await wikibaseClient.getEntities(this.columnIdsToBeAdded);

			const wikibaseItems = Object.keys(entity.data.entities).map((input) => {
				return {
					itemId: entity.data.entities[input].id,
					text:
						entity.data.entities[input].labels?.en?.value ??
						entity.data.entities[input].labels?.de?.value ??
						"",
					url: wikibaseClient.getEntityUrl(entity.data.entities[input].id),
				};
			});

			const columnModels = wikibaseItems.map((wikibaseItem) => {
				return newColumnModel(
					wikibaseItem,
					wikibaseClient.getCachedProperties()[0]
				);
			});

			columnModels.forEach((columnModel) => {
				addColumn(columnModel);
			});

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

	protected firstUpdated(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): void {
		// @ts-expect-error
		document.addEventListener("ADD_COLUMN", (e: CustomEvent) => {
			console.log("ADD_COLUMN", e.detail);
			const ids = e.detail.ids;
			if (!ids) return;

			if (ids.length > 3) {
				const confirmResult = confirm(
					`Are you sure you want to add ${ids.length} new columns?`
				);
				if (!confirmResult) return;
			}
			this.columnIdsToBeAdded = ids;
			this.addCloumnTask
				.run()
				.then(() => {
					this.classList.remove("working");
				})
				.catch(() => {
					this.classList.remove("working");
					Toast.error("Error while adding columns", ToastLength.LONG).show();
				});
		});
	}

	ondragover = (event: DragEvent) => {
		event.preventDefault();
		this.classList.add("highlight");
	};

	ondragleave = (event: DragEvent) => {
		event.preventDefault();
		this.classList.remove("highlight");
	};

	ondrop = (event: DragEvent) => {
		event.preventDefault();
		this.classList.remove("highlight");
		this.dispatchEvent(
			new CustomEvent("itemDropped", {
				detail: { data: "new-column" },
			})
		);
	};

	static styles = css`
		:host {
			min-width: 10rem;
			opacity: 0;
			background-color: #f0f0f0;

			display: flex;
			justify-content: center;
			align-items: center;
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

		#add-symbol {
			font-size: 2rem;
			font-weight: bold;
			opacity: 0.5;
		}
	`;

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
}
