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
import { selectionControllerContext } from "../data/contexts/SelectionControllerContext";
import { SelectionController } from "./controllers/SelectionController";
import { InfoBox } from "./Components";

/**
 * <app-root> is the root component of the application.
 */
@customElement("app-root")
export default class AppRoot extends Component {
	private zustand = zustandStore.getState();

	@state()
	isDragging = false;

	@state()
	infoStyle = "hide";

	@state()
	isCopyToggleOn = false;

	private dragType = "Move";

	private setIsDragging = (isDragging: boolean) => {
		this.isDragging = isDragging;
	};

	// private setCopyToggleOn = (isCopyToggleOn: boolean) => {
	// 	this.isCopyToggleOn = isCopyToggleOn;
	// }

	private api = createApiClient();
	private wikibaseClient: WikibaseClient = new WikibaseClient(
		{
			username: "",
			password: "",
		},
		this.api
	);
	private selectionController = new SelectionController(this);
	private dragController = new DragController(
		this,
		this.wikibaseClient,
		this.setIsDragging,
		// this.isCopyToggleOn,
		this.selectionController
	);

	// ------- Contexts ------- //

	@provide({ context: tableContext })
	tableContext = fromStore(this.zustand);

	@provide({ context: wikibaseContext })
	wikibaseContext = this.wikibaseClient;

	@provide({ context: selectionControllerContext })
	selectionContext = this.selectionController;

	@provide({ context: dragControllerContext })
	dragControllerContext = this.dragController;

	@provide({ context: sessionContext })
	sessionContext = {
		logout: () => this.onLogout(),
	};

	// ------- Lifecycle ------ //

	updated() {
		this.onDarkmodeChange();
	}

	protected firstUpdated(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): void {
		zustandStore.subscribe((state) => {
			this.zustand = state;
			this.requestUpdate();
		});

		if (this.zustand.credentials) {
			this.loginTask.run();
		}

		// handle keyboard shortcuts
		window.addEventListener("keydown", (e) => {
			if (e.ctrlKey && e.key === "f") {
				e.preventDefault();
				this.zustand.toggleSidebar();
			}
			// delete or backspace
			if (
				(e.key === "Delete" || e.key === "Backspace") &&
				this.selectionController.getSelectedItems().length > 0
			) {
				e.preventDefault();
				this.dragController.onDrop("trash", false);
			}
			// toggle copy on
			if(e.ctrlKey && e.key === "x") {
				this.toggleCopy();
			}
		});

		document.addEventListener("click", (e) => {
			// called when the click event has not been used by any other component
			this.selectionController.deselectAll();
		});

		if (this.zustand.isDarkMode !== undefined) this.onDarkmodeChange();
	}

	// --------- Tasks -------- //

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

	private toggleCopy() {
		this.isCopyToggleOn = !this.isCopyToggleOn;
		if (this.isCopyToggleOn) this.dragType = "Copy";
		else this.dragType = "Move";
		this.dragController.setCopyToggle(this.isCopyToggleOn);
	}

	// ------- Listeners ------ //

	onWindow() {
		this.infoStyle = "hide";
	}

	onInfo() {
		if(this.infoStyle == "hide") this.infoStyle = "show";
		else this.infoStyle = "hide";
	}

	onLogout() {
		this.logoutTask.run();
	}

	onLogin(error:any|null=null) {
		// reset credentials if there was an error on login (e.g. invalid pw)
		if(error) { this.zustand.credentials = undefined} 
		this.loginTask.run();
	}

	onDarkmodeChange() {
		document.body.classList.toggle("dark", this.zustand.isDarkMode === true);
	}

	// -------- Render -------- //

	render() {
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
							<div>
								<button @click="${() => this.toggleCopy()}">
									<b style="color: var(--bg-danger)">${this.dragType}</b>
								</button>
								items on drag
							</div>
							<div class="spacer"></div>
							<span id="username">${this.zustand.credentials?.username}</span>
							<button
								id="darkmode-toggle"
								@click="${(e: MouseEvent) => {
									this.zustand.setIsDarkMode(!this.zustand.isDarkMode);
									e.stopPropagation();
								}}"
							>
								${when(
									this.zustand.isDarkMode,
									() => "☾", // moon unicode
									() => "☼"
								)}
							</button>
							<button id="info-toggle"
								@click="${() => this.onInfo()}">Info</button>
							<button @click="${() => this.onLogout()}">Logout</button>
						</div>
						<div id="main" @click="${() => this.onWindow()}">
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
								.isCopyToggledOn="${this.isCopyToggleOn}"
							></table-view>
							<info-box class="${this.infoStyle}"></info-box>
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
				<button @click="${() => this.onLogin(e)}">Retry Login</button>
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
			border-bottom: 1px solid var(--border-color);
			padding: 0.3rem;
		}
		#main {
			display: flex;
			flex-direction: row;
			width: 100%;
			overflow: hidden;
			flex-grow: 1;
		}
		#username {
			margin-right: 0.5rem;
		}
	`;
}
