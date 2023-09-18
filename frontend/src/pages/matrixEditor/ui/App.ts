import { customElement } from "lit/decorators.js";
import { Component } from "./atomic/Component";
import { LitElement, PropertyValueMap, ReactiveElement, css, html } from "lit";
import { store } from "../data/Store";
import { StoreController } from "exome/lit";
import { fromStore, tableContext } from "../data/contexts/TableContext";
import { provide } from "@lit-labs/context";
import { subscribe } from "exome";

import { saveState, loadState } from "exome/state";

@customElement("app-root")
export default class AppRoot extends Component {
	private store = new StoreController(this, store);

	protected firstUpdated(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): void {
		// loat store from local storage (if available)
		const existingStoreValue = localStorage.getItem("store");
		if (existingStoreValue) loadState(store, existingStoreValue);

		const unsubscribe = subscribe(store, () => {
			const savedStoreValue = saveState(store);
			localStorage.setItem("store", savedStoreValue);
			console.log("store saved to local storage");
		});
	}

	@provide({ context: tableContext })
	tableContext = fromStore(this.store);

	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
		}
	`;

	render() {
		console.log("rendering app");

		return html`
			<table-view .tableModel="${this.store.store.table}"></table-view>
		`;
	}
}
