import { customElement, property, state } from "lit/decorators.js";
import { Component } from "./atomic/Component";
import { PropertyValueMap, css, html } from "lit";
import { fromStore, tableContext } from "../data/contexts/TableContext";
import { provide } from "@lit-labs/context";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

import { zustandStore } from "../data/ZustandStore";
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
import { TOOLTIPS } from "../data/Tooltips";
import { LoginController } from "../../../shared/util/login/LoginController";
import { Credentials } from "../../../shared/WikibaseEditConfig";



/**
 * <app-root> is the root component of the application.
 */
@customElement("app-root")
export default class AppRoot extends Component {
	private zustand = zustandStore.getState();
	
	@state()
	isDragging = false;

	@state()
	itemCreatorStyle = "closed";

	@state()
	infoStyle = "hide";

	@state()
	loginStyle = "hide";

	@state()
	dragToggleBeforeDrag = false;

	@state()
	isQualifierToggleOn = false;

	@state()
	hasInitTippy = false;

	@state()
	creatorHasClient = false;

	@property()
	private dragType = "Move";
	private dragTypeCanChange = true;
	
	private qualifierType = "Discard";

	private setIsDragging = (isDragging: boolean) => {
		this.isDragging = isDragging;
	};

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
		this.selectionController
	);

	// const element = this.shadowRoot?.getElementById("login") as LoginPrompt;
	private loginRoot = undefined as undefined|ShadowRoot;
    private loginController = undefined as undefined|LoginController;
	private loginCredentials = undefined as undefined|Credentials;

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
		if(!this.hasInitTippy) this.initTippy()
	}

	/**
	 * Init Tippy-Tooptips after all elements are rendered
	 */
	private initTippy() {
		for (let [key, value] of Object.entries(TOOLTIPS)) {
			const $div = this.renderRoot.querySelector("#"+key) as HTMLElement;
			
			if($div !== null) this.hasInitTippy = true;	
			else return;

			tippy($div, {
				content: value,
			});
		}
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
				this.toggleDragType();
			}
			// toggle info-box
			if(e.ctrlKey && e.key === "i") {
				e.preventDefault();
				this.onInfo();
			}
			// toggle qualifier
			if (e.ctrlKey && e.key === "q") {
				e.preventDefault();
				this.toggleQualifierType();
			}
			// toggle item creator
			if (e.ctrlKey && e.key === "+") {
				e.preventDefault();
				this.onCreateNewItem();
			}
		});

		// when dragging an item a user can hold CRTL to change the drag type from what was toggled
		window.addEventListener("drag", (e) => {
			// NOTE: keys get called repeatedly so check to only 
			// allow changing dragType again after the key has been released
			if(e.ctrlKey) {
				if (this.dragTypeCanChange) {
					if(this.dragType === "Copy") {
						this.setDragType(false)
					} else { 
						this.setDragType(true)
					}
					this.dragTypeCanChange = false;
				}
			}
			else {
				// if key not held down change back to original (once)
				if (!this.dragTypeCanChange) {
					this.dragTypeCanChange = true
					this.setDragType(this.dragToggleBeforeDrag);
				}
			} 

		}) 

		// when drag starts save current dragToggle to change back to when drag ends
		window.addEventListener("dragstart", (e) => {
			this.dragToggleBeforeDrag = this.dragController.getCopyToggle();
		})

		window.addEventListener("dragend", (e) => {
			this.setDragType(this.dragToggleBeforeDrag) // reset
		})

		document.addEventListener("click", (e) => {
			// called when the click event has not been used by any other component
			this.selectionController.deselectAll();
		});

		if (this.zustand.isDarkMode !== undefined) this.onDarkmodeChange();
	}

	// --------- Tasks -------- //

	private loginTask = new Task(this, {
		task: async ([{ wikibaseClient, zustand, loginCredentials }]) => {
			if (loginCredentials == undefined) { // throws an error otherwise (if reloading the page)
				loginCredentials = this.zustand.credentials!
			}

			wikibaseClient.setCredentials(loginCredentials);			
			const login = await wikibaseClient.login()

			// Get a users role from the graph
			let adminRights = false;
			const role = await this.wikibaseClient.getUserRole();
			if(role === "Admin") adminRights = true;
			zustand.setIsAdmin(adminRights);
			
			// Get a users wikibase-item QID for visual feedback (mark personal item-column)
			const info = await this.wikibaseClient.getUserInfo();
			const userQID = info.userItemId;
			zustand.setUserQID(userQID);
			zustand.setCredentials(loginCredentials);

			return login;
		},
		args: () => [
			{
				wikibaseClient: this.wikibaseClient,
				zustand: this.zustand,
				loginCredentials: this.loginCredentials as Credentials,
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

	private setDragType(copy:boolean) {
		if(copy) {
			this.dragType = "Copy";
		} else {
			this.dragType = "Move";	
		}
		this.dragController.setCopyToggle(copy)
	}

	private toggleDragType() {
		this.setDragType(!this.dragController.getCopyToggle())
	}

	private toggleQualifierType() {
		this.isQualifierToggleOn = !this.isQualifierToggleOn;
		if (this.isQualifierToggleOn) this.qualifierType = "Keep";
		else this.qualifierType = "Discard";
		this.dragController.setQualifierToggle(this.isQualifierToggleOn);
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

	async onLogin(error:any|null=null) {
		if(error) { 
			window.location.reload(); // reload window to get back to initial render state, so that user can retry login
		} 

		this.loginCredentials = this.zustand.credentials;
		if (this.loginCredentials == undefined) {
			/* NOTE:
			There is a LoginController.ts in shared/login that is used in the selectionEditor
			But as lit.js works kinda different than regular html/js it's being separated a bit here,
			to keep the code cleaner
			*/
			this.loginStyle = "show";
			
			if (this.loginRoot == undefined) {
				this.loginRoot = this.shadowRoot?.getElementById("login")?.shadowRoot as ShadowRoot;
			}
			if(this.loginController == undefined) {
				this.loginController = new LoginController(this.loginRoot);
			}

			this.loginCredentials = await this.loginController.getCredentialsFromPrompt()
			this.loginTask.run();
		}
		else {
			this.loginCredentials = this.zustand.credentials;
			this.loginTask.run();
		}
	}

	onDarkmodeChange() {
		document.body.classList.toggle("dark", this.zustand.isDarkMode === true);
	}

	// Toggle the sidebar fo item creation
	onCreateNewItem() {
		if (!this.zustand.isAdmin) {
			console.log("Admin only");
			return;
		}

		this.zustand.itemCreatorIsOpen = !this.zustand.itemCreatorIsOpen;
		
		if (this.zustand.itemCreatorIsOpen) {
			this.itemCreatorStyle = "open"
		} else this.itemCreatorStyle = "closed"
		
		// event to populate sidebar
		document.dispatchEvent(
			new CustomEvent("POPULATE_ITEM_CREATOR")
		);
	}

	// -------- Render -------- //

	render() {
		return this.loginTask.render({
			initial: () =>
				html`
					<button @click="${() => this.onLogin()}">Login</button>
					<login-prompt class="${this.loginStyle}" id="login"></login-prompt>
					`,
			pending: () => html`Logging in...`,
			complete: () =>
				when(
					this.logoutTask.status === TaskStatus.INITIAL,
					() => html`<div id="top-bar">
							<button id="sidebar-toggle" @click="${() => this.zustand.toggleSidebar()}">
								${when(
									this.zustand.sidebarIsOpen,
									() => ">",
									() => "<"
								)}
							</button>
							<div>
								<button id="drag-toggle" @click="${() => this.toggleDragType()}">
									<b style="color: var(--bg-danger)">${this.dragType}</b>
								</button>
								items 
							</div>
							<span>,</span> 
							<div>
								<button id="qualifier-toggle" @click="${() => this.toggleQualifierType()}">
									<b style="color: var(--bg-info)">${this.qualifierType}</b>
								</button>
								qualifiers 
							</div>
							<span> <i>on drag</i> </span>
							
							<div class="spacer"></div>

							<button id="logout-btn" @click="${() => this.onLogout()}">Logout</button>
							<span id="username">${this.zustand.credentials?.username}</span>
							<span id="admin-rights-${this.zustand.isAdmin}" class="user-rights">
							${when(
								this.zustand.isAdmin,
								() => "Admin",
								() => "Student"
							)}</span>
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
							<button id="creator-btn" 
								@click="${() => this.onCreateNewItem()}">
								${when(
									this.zustand.itemCreatorIsOpen,
									() => "+",
									() => ">"
								)}
							</button>
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
							></table-view>
							<info-box class="${this.infoStyle}"></info-box>
							<item-creator-component class="${this.itemCreatorStyle}"><item-creator-component/>
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
		span {
			margin-right: 5px;
			margin-left: 10px;
		}
		.user-rights {
			color: dimgray;
		}

		#logout-btn {
			color: red;
		}
	`;
}
