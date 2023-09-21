import { LitElement, html, css, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { ColumnItemModel } from "../../data/models/ColumnItemModel";
import { Component } from "../atomic/Component";

@customElement("column-item")
export class ColumnItem extends Component {
	static styles = css`
		:host {
			width: 100%;
			height: 5rem;
			display: flex;
			cursor: grab;
		}
		.content {
			padding: 0.5rem;
			display: flex;
			flex-direction: column;
			flex-grow: 1;
			justify-content: center;
		}
		.text {
			text-align: center;
			user-select: none;
		}
	`;

	@property({ type: Object, attribute: false })
	columnItemModel!: ColumnItemModel;

	// add table-item class to host element

	protected firstUpdated(
		_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
	): void {
		this.setAttribute("draggable", "true");
	}

	ondblclick = (e: MouseEvent) => {
		window.open(this.columnItemModel.url, "_blank");
	};

	render() {
		return html`
			<card-component>
				<div class="content">
					<div class="text">${this.columnItemModel.itemId}</div>
					<div class="text">${this.columnItemModel.text}</div>
				</div>
			</card-component>
		`;
	}
}
