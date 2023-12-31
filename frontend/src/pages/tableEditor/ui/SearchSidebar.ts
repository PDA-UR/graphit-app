import { customElement, state } from "lit/decorators.js";
import {
	ColumnItemModel,
	newColumnItemModel,
} from "../data/models/ColumnItemModel";
import { css, html } from "lit";
import { Component } from "./atomic/Component";
import { Task, TaskStatus } from "@lit-labs/task";
import { consume, provide } from "@lit-labs/context";
import WikibaseClient from "../../../shared/WikibaseClient";
import { wikibaseContext } from "../data/contexts/WikibaseContext";
import { choose } from "lit/directives/choose.js";
import { dragControllerContext } from "../data/contexts/DragControllerContext";
import { DragController } from "./controllers/DragController";

/**
 * <search-sidebar> is the bar on the left side of the screen that allows
 * users to search for items in Wikibase and drag them into the table.
 */
@customElement("search-sidebar")
export default class SearchSidebar extends Component {
	// --- State & Contexts --- //

	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	@consume({ context: dragControllerContext })
	private dragController!: DragController;

	@state()
	private searchQuery = "";

	@state()
	private searchResults: ColumnItemModel[] = [];

	// --------- Tasks -------- //

	private loadItemsTask = new Task(this, {
		task: async ([{ wikibaseClient }]) => {
			if (this.searchQuery === "") {
				this.searchResults = [];
				return;
			}
			const searchResults = await wikibaseClient.search(this.searchQuery);
			this.searchResults = searchResults.map((result: any) =>
				newColumnItemModel(result.id, result.display.label.value, result.url)
			);
		},
		args: () => [
			{
				wikibaseClient: this.wikibaseClient,
			},
		],
		autoRun: false,
	});

	// ------- Lifecycle ------ //

	protected firstUpdated(): void {
		this.loadItemsTask.run();
	}

	// ------- Rendering ------ //

	render() {
		return html`
			<input
				id="search-input"
				type="text"
				@input="${(e: InputEvent) => {
					this.searchQuery = (e.target as HTMLInputElement).value;
					this.loadItemsTask.run();
				}}"
				placeholder="Search..."
			/>

			<column-item-list
				class="${choose(this.loadItemsTask.status, [
					[TaskStatus.PENDING, () => "loading"],
					[TaskStatus.ERROR, () => "error"],
				]) ?? ""}"
				.items="${this.searchResults}"
				origin="search"
				@itemDraggedStart="${(e: any) =>
					this.dragController.onItemDragStart(e.detail)}"
				@itemDraggedEnd="${(e: any) => this.dragController.onItemDragEnd()}"
			></column-item-list>
		`;
	}

	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			width: 25rem;
			overflow-x: auto;
			padding: 0.5rem;
			border-right: 1px solid var(--border-color);
		}

		:host(.closed) {
			display: none;
		}

		#search-input {
			margin-bottom: 0.5rem;
			margin-top: 0.5rem;
		}
	`;
}
