import { customElement } from "lit/decorators.js";
import { Component } from "./atomic/Component";
import { PropertyValueMap, css, html } from "lit";
import { fromStore, tableContext } from "../data/contexts/TableContext";
import { provide } from "@lit-labs/context";

import { zustandStore } from "../data/ZustandStore";

@customElement("app-root")
export default class AppRoot extends Component {
	private zustand = zustandStore.getState();

	protected firstUpdated(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): void {
		zustandStore.subscribe((state) => {
			console.log("zustand store changed", state);
			this.zustand = state;
			this.requestUpdate();
		});
	}

	@provide({ context: tableContext })
	tableContext = fromStore(this.zustand);

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
			<table-view .tableModel="${this.zustand.table}"></table-view>
		`;
	}
}
