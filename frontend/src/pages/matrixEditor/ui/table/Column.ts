import { html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ColumnModel } from "../../data/models/ColumnModel";
import { tableContext } from "../../data/contexts/TableContext";
import { consume } from "@lit-labs/context";
import { map } from "lit/directives/map.js";
import {
	MATRIX_PROPERTIES,
	WikibasePropertyModel,
	getWikibasePropertyById,
} from "../../data/models/WikibasePropertyModel";
import { Component } from "../atomic/Component";
import { StoreActions } from "../../data/ZustandStore";
import { ColumnItem } from "./CloumnItem";
import { ColumnItemModel } from "../../data/models/ColumnItemModel";

@customElement("column-component")
export class ColumnComponent extends Component {
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			background-color: #f5f5f5;
			border-radius: 5px;
			padding: 0.5rem;
			gap: 0.5rem;
		}
		:host(.highlight) {
			background-color: #e5e5e5;
		}
		.items {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
	`;

	@property({ type: Object, attribute: false })
	columnModel!: ColumnModel;

	@consume({ context: tableContext })
	@property({ attribute: false })
	public tableActions!: StoreActions;

	handlePropertyChange(event: Event) {
		const newValue = (event.target as HTMLSelectElement).value,
			newProperty = getWikibasePropertyById(newValue);

		if (newProperty)
			this.tableActions?.setColumnProperty(
				this.columnModel.viewId,
				newProperty
			);
	}

	ondrop = (event: DragEvent) => {
		event.preventDefault();
		const viewId = event.dataTransfer?.getData("text/plain");
		if (viewId) {
			const isAlreadyInColumn = this.columnModel.items.find(
				(item) => item.viewId === viewId
			);
			if (isAlreadyInColumn) return;
			this.tableActions.moveItem(this.columnModel.viewId, viewId);
		}
		this.classList.remove("highlight");
	};

	ondragover = (event: DragEvent) => {
		event.preventDefault();
		this.classList.add("highlight");
	};

	ondragleave = (event: DragEvent) => {
		event.preventDefault();
		this.classList.remove("highlight");
	};

	// ... styles and other properties

	render() {
		console.log(
			"rendering column with property",
			this.columnModel.property.propertyId
		);
		return html`
			<div>${this.columnModel.property.name}</div>
			<select @change="${this.handlePropertyChange}">
				${map(
					MATRIX_PROPERTIES,
					(property) => html`
						<option
							value="${property.propertyId}"
							?selected="${property.propertyId ===
							this.columnModel.property.propertyId}"
						>
							${property.name}
						</option>
					`
				)}
			</select>
			<div class="items" data-column-id="${this.columnModel.viewId}">
				${map(
					this.columnModel.items,
					(item) =>
						html` <column-item .columnItemModel="${item}"></column-item> `
				)}
			</div>
		`;
	}
}
// Example response from WikibaseClient.getEntities(["Q4"]):
// {
//     "data": {
//         "entities": {
//             "Q4": {
//                 "pageid": 30,
//                 "ns": 120,
//                 "title": "Item:Q4",
//                 "lastrevid": 80,
//                 "modified": "2023-06-09T08:28:17Z",
//                 "type": "item",
//                 "id": "Q4",
//                 "labels": {
//                     "en": {
//                         "language": "en",
//                         "value": "Computer Vision"
//                     }
//                 },
//                 "descriptions": {
//                     "en": {
//                         "language": "en",
//                         "value": "Category Computer Vision"
//                     }
//                 },
//                 "aliases": {},
//                 "claims": {
//                     "P3": [
//                         {
//                             "mainsnak": {
//                                 "snaktype": "value",
//                                 "property": "P3",
//                                 "hash": "32cb86402318d0be7e1e9627b639c9d180706218",
//                                 "datavalue": {
//                                     "value": {
//                                         "entity-type": "item",
//                                         "numeric-id": 169,
//                                         "id": "Q169"
//                                     },
//                                     "type": "wikibase-entityid"
//                                 },
//                                 "datatype": "wikibase-item"
//                             },
//                             "type": "statement",
//                             "id": "Q4$2d1469af-4118-b0ef-fc75-89211f8ecc48",
//                             "rank": "normal"
//                         }
//                     ]
//                 },
//                 "sitelinks": {}
//             }
//         },
//         "success": 1
//     }
// }

// valid items are cleims that are of the same type as the column property
export const parseItemsFromWikibaseResponse = (
	property: WikibasePropertyModel,
	entity: any
): ColumnItemModel[] => {
	const items: ColumnItemModel[] = [];
	const claims = entity.claims[property.propertyId];
	if (!claims) return items;
	claims.forEach((claim: any) => {
		const targetElementId = claim.mainsnak.datavalue.value.id,
			tagetText = "X",
			id = claim.id;
		items.push({
			itemId: targetElementId,
			text: tagetText,
			viewId: id,
		});
	});

	return items;
};
