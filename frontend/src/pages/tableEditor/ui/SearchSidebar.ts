import { customElement, state } from "lit/decorators.js";
import {
	ColumnItemModel,
	newColumnItemModel,
} from "../data/models/ColumnItemModel";
import { css, html } from "lit";
import { Component } from "./atomic/Component";
import { Task, TaskStatus } from "@lit-labs/task";
import { consume } from "@lit-labs/context";
import WikibaseClient from "../../../shared/WikibaseClient";
import { wikibaseContext } from "../data/contexts/WikibaseContext";
import { choose } from "lit/directives/choose.js";

@customElement("search-sidebar")
export default class SearchSidebar extends Component {
	@consume({ context: wikibaseContext })
	private wikibaseClient!: WikibaseClient;

	@state()
	private searchQuery = "";

	@state()
	private searchResults: ColumnItemModel[] = [];

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

	protected firstUpdated(): void {
		this.loadItemsTask.run();
	}

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
			></input>

        <column-item-list
            class="${choose(
							this.loadItemsTask.status,
							[
								[TaskStatus.PENDING, () => "loading"],
								[TaskStatus.ERROR, () => "error"],
							],
							() => ""
						)}"
            .items="${this.searchResults}"
            .filter="${this.searchQuery}"
        ></column-item-list>
		`;
	}

	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			width: 25rem;
			height: 100%;
			overflow-x: auto;
			padding: 0.5rem;
			border-right: 1px solid black;
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