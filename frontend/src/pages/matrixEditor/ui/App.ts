import { customElement } from "lit/decorators.js";
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
import { sessionContext } from "../data/contexts/SessionContext";
import { dragControllerContext } from "../data/contexts/DragControllerContext";
import { DragController } from "./controllers/DragController";

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

	@provide({ context: tableContext })
	tableContext = fromStore(this.zustand);

	@provide({ context: wikibaseContext })
	wikibaseContext = this.wikibaseClient;

	@provide({ context: dragControllerContext })
	dragControllerContext = new DragController(this, this.wikibaseClient);

	@provide({ context: sessionContext })
	sessionContext = {
		logout: () => this.onLogout(),
	};

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
			margin-bottom: 0.5rem;
			padding: 0.3rem;
		}
	`;

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
							<span>Matrix Editor</span>
							<div class="spacer"></div>
							<span>${this.zustand.credentials?.username}</span>
							<button @click="${() => this.onLogout()}">Logout</button>
						</div>
						<table-view .tableModel="${this.zustand.table}"></table-view>`,
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
}
