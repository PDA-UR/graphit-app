import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Component } from "./Component";
import { PropertyValueMap } from "lit-element";
import zustandStore from "../../data/ZustandStore";
import { TableModel } from "../../data/models/TableModel";
import { WBItem } from "../../data/models/WBItemModel";
import WikibaseClient from "../../../../shared/WikibaseClient";
import { consume } from "@lit-labs/context";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";
import { ItemOperationController, MoveItemInfo } from "../controllers/ItemOperationController";
import { DragController } from "../controllers/DragController";
import { dragControllerContext } from "../../data/contexts/DragControllerContext";
import { getEnvVar } from "../../../../shared/util/Env";

/**
 * <item-creator-component> is the sidebar that pops up when you want to create a new item for a column
 */
@customElement("item-creator-component")
export class ItemCreator extends Component {

    private $columnSelect: HTMLSelectElement | undefined;
    private $propertySelect: HTMLSelectElement | undefined;
    private $labelEn: HTMLInputElement | undefined;
    private $labelDe: HTMLInputElement | undefined;
    private $descriptionEn: HTMLInputElement | undefined;
    private $descriptionDe: HTMLInputElement | undefined;
    private $aliasEn: HTMLInputElement | undefined;
    private $aliasDe: HTMLInputElement | undefined;
    private $feedbackField: HTMLDivElement | undefined;
    private $errorField: HTMLDivElement | undefined;
    private $errorMsgField: HTMLDivElement | undefined;

    private zustand = zustandStore.getState();

    @property({ type: Object, attribute: true })
	tableModel!: TableModel;

    @consume({ context: wikibaseContext })
    private wikibaseClient!: WikibaseClient;

    @consume({ context: dragControllerContext})
    private dragController!: DragController;

    private itemOperator: ItemOperationController | undefined;

    // ------ Lifecycle ------ //
    
    // TODO -> update when opened
    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
        this.$columnSelect = this.shadowRoot?.querySelector("#attach-column") as HTMLSelectElement;
        this.$propertySelect = this.shadowRoot?.querySelector("#attach-property") as HTMLSelectElement;
        this.$labelEn = this.shadowRoot?.querySelector("#label-en") as HTMLInputElement;
        this.$labelDe = this.shadowRoot?.querySelector("#label-de") as HTMLInputElement;
        this.$descriptionEn = this.shadowRoot?.querySelector("#description-en") as HTMLInputElement;
        this.$descriptionDe = this.shadowRoot?.querySelector("#description-de") as HTMLInputElement;
        this.$aliasEn = this.shadowRoot?.querySelector("#alias-en") as HTMLInputElement;
        this.$aliasDe = this.shadowRoot?.querySelector("#alias-de") as HTMLInputElement;
        this.$feedbackField = this.shadowRoot?.querySelector("#creator-feedback") as HTMLDivElement;
        this.$errorField = this.shadowRoot?.querySelector("#creator-error") as HTMLDivElement;
        this.$errorMsgField = this.shadowRoot?.querySelector("#creator-error-msg") as HTMLDivElement;

        document.addEventListener("POPULATE_ITEM_CREATOR", (e:Event) => this.onOpen(e))
        this.itemOperator = this.dragController.getItemOperator()
    
        // subscribe to keep updated, when e.g. columns change
        zustandStore.subscribe((state) => {
			this.zustand = state;
			this.requestUpdate();
		});
    }

    // ------ Listeners ------ //

    private onOpen(event:Event) {
        this.$columnSelect!.innerHTML = ""
        const columns = this.zustand.table.columns;
        console.log("cols", this.zustand.table.columns);
        columns.forEach(column => {
            this.$columnSelect!.options[this.$columnSelect!.options.length] = new Option(column.item.text, column.item.itemId)
        });

        if (this.$propertySelect!.options.length >= 1) {
            return;
        }
        const properties = this.wikibaseClient.getCachedProperties();
        properties.forEach(prop => {
            this.$propertySelect!.options[this.$propertySelect!.options.length] = new Option(prop.label, prop.propertyId)
        });
        
        const selected_property = columns[0].property.propertyId; // preselect the current prop of the first column
        this.$propertySelect!.value = selected_property
        
    }

    private clearInputFields(event:Event) {
        console.log("clear", this.$labelEn)
        this.$labelEn!.value = "";
        this.$labelDe!.value = "";
        this.$descriptionEn!.value = "";
        this.$descriptionDe!.value = "";
        this.$aliasEn!.value = "";
        this.$aliasDe!.value = "";
    }

    private async onAddItem(event:Event) {
        this.$feedbackField!.innerHTML = ""; // reset feedback text
        const labelEn = this.$labelEn?.value;
        if (!labelEn) {
            this.setError("English label is required")
            return;
        }

        const item = this.createItemFromInput()
        this.handleItemCreation(item)
    }
    
    /**
     * Queries for matching labels that already exist in the database
     */
    private async onMatchLabel() {
        this.$feedbackField!.innerHTML = ""
        
        if (!this.wikibaseClient) {
            this.setError("No Client");
            return;
        }

        this.$feedbackField?.classList.add("container-filled")

        const label = this.$labelEn?.value;
        if (!label) return;
       
        let limit = 5;
        const lang = "en";
        let matches;
        try {
            matches = await this.wikibaseClient.getLabelMatches(label, lang, limit);
        } catch(error: any) {
            console.log("[ERROR] - SPARQL", error);
            this.setError(error)
        }

        // Parse the result into a readable format
        if (matches.length == 0) {
            this.$feedbackField!.textContent = "No matches"
        } else {
            if (matches.length < limit) limit = matches.length

            this.$feedbackField!.textContent = "First " + limit + " entries:"

            matches.forEach((match:any) => {
                const link = match.item.value
                const label = match.itemLabel.value
                const qid = link.match(/Q\d*/g)
                const el = document.createElement("a") as HTMLAnchorElement;
                el.href = link;
                if (qid == null) el.innerText = `Prop: ${label}` // handle returned properties
                else el.innerText = `(${qid[0]}) ${label}`;
                this.$feedbackField?.appendChild(el);
            });
        }
    }

    // ------ Helpers ------ //

    /**
     * Handle the backend interaction to create a new item and connect it to a column
     * @param item 
     * @returns 
     */
    private async handleItemCreation(item:WBItem) {
        if(!this.wikibaseClient) {
            this.setError("Missing Client");
            return;
        }
        
        // Create the new Item in Wikibase
        console.log("create item:", item)
        let result;
        try {
            result = await this.wikibaseClient.createNewItem(item)
            this.setFeedback(result, true);
            console.log("[ITEM] -> added", result);
        } catch(error:any) {
            if (error.response != undefined) error = error.response.data.message            
            const info = "[ERROR] -> Item "
            this.setError(info, error); 
            return;
        }

        if (!this.$columnSelect?.value) {
            this.setError("Missing Claim QID");
            return;
        }

        const claim = this.createClaimFromInput(result);

        // Add the Claims to connect it to the specified columns
        console.log("create claim:", claim)
        try {
            this.itemOperator!.moveItems([claim], false);
            const claimText = `${claim.value} --${claim.newClaim.property}-> ${claim.to}`
            this.setFeedback("new [CLAIM]: " + claimText);
            console.log("[CLAIM] -> added", claimText);
        } catch (error: any) {
            if (error.response != undefined) error = error.response.data.message
            const info = "[ERROR] -> Claim "
            this.setError(info, error);
        }

    }

    private createClaimFromInput(qid:String): MoveItemInfo {
        return { 
            to: this.$columnSelect!.value,
            value: qid,
            newClaim: {
                property: this.$propertySelect?.value,
                value: qid, 
            }
        } as MoveItemInfo
    }

    /**
     * Parse the user input to a WikiBase-Item Model 
     * @returns the Item-Model needed for Item creation later
     */
    private createItemFromInput(): WBItem {
        // NOTE: fields need to either be strings with content, or undefined.

        const item = {
            type: 'item',
            labels: {
                en: this.$labelEn?.value, // required field
                de: this.$labelDe?.value ? this.$labelDe?.value : undefined,
            },
            descriptions: {
                en: this.$descriptionEn?.value ? this.$descriptionEn?.value : undefined,
                de: this.$descriptionDe?.value ? this.$descriptionDe?.value : undefined,
            },
            aliases: {
                en: this.parseAlias(this.$aliasEn?.value),
                de: this.parseAlias(this.$aliasDe?.value),
            },
            claims: {
                P19: new Date().toISOString().slice(0, 10),	// on date
				P15: "via TableEditor", // comment
            }
        } as WBItem
        return item
    }

    /**
     * Parse and split the input alias into a readable format for the api
     * @param alias the value of the alias input field
     * @returns a parsed array
     */
    private parseAlias(alias:string|undefined): string[] | string | undefined {
        if (!alias) return undefined

        let parsed =  alias.split("|");
        parsed.forEach((alias, index) => {
            parsed[index] = alias.trim()
        });

        return parsed
    }

    private setError(error:string, msg: string ="") {
        this.$errorField!.textContent = error;
        this.$errorMsgField!.textContent = msg;
        console.log(error + " " + msg);
    }

    private setFeedback(text:string, isQID:boolean=false) {
        this.$feedbackField?.classList.add("container-filled")

        if (isQID) { // If QID make link
            const el = document.createElement("a") as HTMLAnchorElement;
            el.href = `https://graphit.ur.de/wiki/Item:${text}`;
            el.innerText = `new [ITEM]: (${text}) ${this.$labelEn!.value}`;
            this.$feedbackField!.appendChild(el);
        } else {
            const el = document.createElement("div")
            el.innerText = text;
            this.$feedbackField!.appendChild(el);
        }
    }

    // ------ Rendering ------ //

    render() {
        return html`

        <div id="creator-container" class="container">
            NEW ITEM:
            </br>
            <small>Make sure it doesn't exist yet</small>

            <div id="label-container" class="container">
                <input id="label-en" type="text" placeholder="Label @en" required/>            
                <input id="label-de" type="text" placeholder="Label @de"/>

                <button id="match-label-button" @click=${this.onMatchLabel}>Match label @en</button>
            </div>

            <div id="description-container" class="container">
                <input id="description-en" type="text" placeholder="Description @en"/>
                <input id="description-de" type="text" placeholder="Description @de"/>
            </div>

            <div id="alias-container" class="container">
                <input id="alias-en" type="text" placeholder="Alias1|Alias2 @en"/>
                <input id="alias-de" type="text" placeholder="Alias1|Alias2 @de"/>
            </div>

        </div>

        <div id="attach-container" class="container">

            <label for="attach-column">Add to column:</label>
            <select id="attach-column"/>
            </select>

            <label for="attach-property">using property:</label>
            <select id="attach-property"/>
            </select>
        <div>

        <div id="btn-container">
            <button id="create-item-btn" @click="${this.onAddItem}">ADD</button>
            <div class="spacer"></div>
            <button id="clear-item-btn" @click="${this.clearInputFields}">CLEAR</button>
        </div>

        <div id="feedback-container" class="container">
            <div id="creator-feedback"></div>
            <div id="creator-error"></div>
            <div id="creator-error-msg"></div>
        </div>
        `;
    }

    static styles = css`
        :host(.open) {
            width: 25rem;
            overflow-x: auto;
            background-color: var(--bg-color);
            border-left: solid 1px var(--border-color);
            border-bottom: solid 1px var(--border-color);
            box-shadow: 2px 2px 4px var(--shadow-color);
        }
        :host(.close) {
            display: none;
        }
        
        .container {
            display: flex;
            flex-direction:column;
            padding: 10px;
        }

        #btn-container {
            display: flex;
            flex-direction: row;
        }

        #create-item-btn {
            color: red;
        }

        #feedback-container {
            overflow-x: scroll;
            padding: 5px;
        }

        .container-filled {
            border: dashed 1px black;
            padding: 5px;
        }
        
        #creator-feedback {
            font-size: small;
            margin-bottom: 5px;
            display: flex;
            flex-direction: column;
        }

        #creator-error {
            color: red;
        }
        
        #creator-error-msg {
            font-size:small;
            color: #c90000;
            margin-left: 10px;
        }


        `;
}