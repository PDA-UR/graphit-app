import { customElement, state } from "lit/decorators.js";
import { Component } from "./atomic/Component";
import { PropertyValueMap, css, html } from "lit";
import { fromStore, tableContext } from "../data/contexts/TableContext";
import { provide } from "@lit-labs/context";

import { zustandStore } from "../data/ZustandStore";
import { getCredentials } from "../../../shared/util/GetCredentials";
import { createApiClient } from "../../../shared/util/getApiClient";
import WikibaseClient from "../../../shared/WikibaseClient";
import { Task, TaskStatus } from "@lit-labs/task";
import { wikibaseContext } from "../data/contexts/WikibaseContext";
import { when } from "lit/directives/when.js";
import { choose } from "lit/directives/choose.js";
import { dragControllerContext } from "../data/contexts/DragControllerContext";
import { DragController } from "./controllers/DragController";
import { sessionContext } from "../data/contexts/SessionContext";
import { isDraggingContext } from "../data/contexts/IsDraggingContext";

@customElement("app-root")
export default class AppRoot extends Component {
	private zustand = zustandStore.getState();

	private api = createApiClient();
	private wikibaseClient: WikibaseClient = new WikibaseClient(
		{
			username: "",
			password: "",
		},
		this.api
	);

	protected firstUpdated(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): void {
		zustandStore.subscribe((state) => {
			console.log("zustand store changed", state);
			this.zustand = state;
			this.requestUpdate();
		});

		if (this.zustand.credentials) {
			this.loginTask.run();
		}

		window.addEventListener("keydown", (e) => {
			if (e.ctrlKey && e.key === "f") {
				e.preventDefault();
				this.zustand.toggleSidebar();
			}
		});
	}

	private loginTask = new Task(this, {
		task: async ([{ wikibaseClient, zustand }]) => {
			let credentials = zustand.credentials;
			if (!credentials) credentials = getCredentials();
			zustand.setCredentials(credentials);
			wikibaseClient.setCredentials(credentials);
			return await wikibaseClient.login();
		},
		args: () => [
			{
				wikibaseClient: this.wikibaseClient,
				zustand: this.zustand,
			},
		],
		autoRun: false,
	});

	private logoutTask = new Task(this, {
		task: async ([{ wikibaseClient, zustand }]) => {
			await wikibaseClient.logout();
			zustand.logout();
			setTimeout(() => {
				window.location.reload();
			}, 10);
		},
		args: () => [
			{
				wikibaseClient: this.wikibaseClient,
				zustand: this.zustand,
			},
		],
		autoRun: false,
	});

	onLogout() {
		console.log("logging out");
		this.logoutTask.run();
	}

	onLogin() {
		this.loginTask.run();
	}

	@state()
	isDragging = false;

	private setIsDragging = (isDragging: boolean) => {
		this.isDragging = isDragging;
	};

	@provide({ context: tableContext })
	tableContext = fromStore(this.zustand);

	@provide({ context: wikibaseContext })
	wikibaseContext = this.wikibaseClient;

	@provide({ context: dragControllerContext })
	dragControllerContext = new DragController(
		this,
		this.wikibaseClient,
		this.setIsDragging
	);

	@provide({ context: sessionContext })
	sessionContext = {
		logout: () => this.onLogout(),
	};

	render() {
		console.log("rendering app", this.zustand.credentials);

		return this.loginTask.render({
			initial: () =>
				html`<button @click="${() => this.onLogin()}">Login</button>`,
			pending: () => html`Logging in...`,
			complete: () =>
				when(
					this.logoutTask.status === TaskStatus.INITIAL,
					() => html`<div id="top-bar">
							<button @click="${() => this.zustand.toggleSidebar()}">
								${when(
									this.zustand.sidebarIsOpen,
									() => ">",
									() => "<"
								)}
							</button>
							<div class="spacer"></div>
							<span>${this.zustand.credentials?.username}</span>
							<button @click="${() => this.onLogout()}">Logout</button>
						</div>
						<div id="main">
							<search-sidebar
								class="${when(
									this.zustand.sidebarIsOpen,
									() => "open",
									() => "closed"
								)}"
							></search-sidebar>
							<table-view
								.tableModel="${this.zustand.table}"
								.isDragging="${this.isDragging}"
							></table-view>
						</div>`,
					() =>
						choose(this.logoutTask.status, [
							[TaskStatus.PENDING, () => html`Logging out...`],
							[TaskStatus.COMPLETE, () => html`Logged out`],
							[TaskStatus.ERROR, () => html`Error logging out`],
						])
				),
			error: (e) => html`
				<div style="color: red">Error: ${e}</div>
				<button @click="${() => this.onLogin()}">Retry Login</button>
				<button @click="${() => this.onLogout()}">Logout</button>
			`,
		});
	}

	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}
		#top-bar {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid black;
			padding: 0.3rem;
		}
		#main {
			display: flex;
			flex-direction: row;
			width: 100%;
			overflow: hidden;
			flex-grow: 1;
		}
	`;
}
