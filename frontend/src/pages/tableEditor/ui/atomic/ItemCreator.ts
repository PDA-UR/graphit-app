import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Component } from "./Component";
import { PropertyValueMap } from "lit-element";
import zustandStore from "../../data/ZustandStore";
import { TableModel } from "../../data/models/TableModel";
import { WBItem } from "../../data/models/WBItemModel";
import WikibaseClient from "../../../../shared/WikibaseClient";
import { CreateClaimModel } from "../../../../shared/client/ApiClient";
import { consume } from "@lit-labs/context";
import { wikibaseContext } from "../../data/contexts/WikibaseContext";

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
    private $errorField: HTMLDivElement | undefined;
    private $feedbackField: HTMLDivElement | undefined;

    private zustand = zustandStore.getState();

    @property({ type: Object, attribute: true })
	tableModel!: TableModel;

    @consume({ context: wikibaseContext })
    private wikibaseClient!: WikibaseClient;

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
        this.$errorField = this.shadowRoot?.querySelector("#creator-error") as HTMLDivElement;
        this.$feedbackField = this.shadowRoot?.querySelector("#creator-feedback") as HTMLDivElement;

        document.addEventListener("POPULATE_ITEM_CREATOR", (e:Event) => this.onOpen(e))
    }

    // ------ Listeners ------ //

    private onOpen(event:Event) {
        if (!this.zustand.itemCreatorIsOpen) return
        // NOTE: does this twice

        const columns = this.zustand.table.columns;
        columns.forEach(column => {
            this.$columnSelect!.options[this.$columnSelect!.options.length] = new Option(column.item.text, column.item.itemId)
            this.$propertySelect!.options[this.$propertySelect!.options.length] = new Option(column.property.label, column.property.propertyId)
        });
    }

    private async onAddItem(event:Event) {
        console.log("check inputs and then create + feedback", event)

        // needs MIN. an english label
        const labelEn = this.$labelEn?.value;
        if (!labelEn) {
            this.setError("English label is required")
            return;
        }
        // check if exact label exists ?
        // check if exact description exists ?

        const item = this.createItemFromInput()
        // const claim = this.createClaimFromInput()
        this.handleItemCreation(item)
    }
    
    // Manually check the label
    private async onCheckLabel() {
        if (!this.wikibaseClient) {
            this.setError("No Client");
            return;
        }

        const label = this.$labelEn?.value;
        if (!label) return;

        // ?? Match every word
        console.log("[TODO] Check the english label:", label);
        const matches = await this.wikibaseClient?.getLabelMatches(label, "en", 5);
        console.log("matches", matches)
        // Check label (if exists) and return
        // TODO + add info/tooltips 
    }

    // ------ Helpers ------ //

    // Handle backend interaction
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
            console.log("[ADDED]", result);
        } catch(error:any) {
            console.log("[ERROR] - item creation", error);
            this.setError(error);
            return;
        }

        if (!this.$columnSelect?.value) {
            this.setError("Missing Claim QID")
            return;
        }

        const claim = this.createClaimFromInput(result);
        const qid = this.$columnSelect.value; // where to move

        // Add the Claims to connect it to the specified columns
        console.log("create claim:", claim)
        let status;
        try {
            status = await this.wikibaseClient.createClaim(qid, claim)
        } catch (error: any) {
            console.log("[ERROR] - claim creation", error);
            this.setError(error);
        }

        // If all successful = return qid + render in column
        this.setFeedback(result)
    }

    private createClaimFromInput(qid:String): CreateClaimModel {
        // TODO: handle empty selects
        const claim = {
            property: this.$propertySelect?.value, // what to use
            value: qid, // what to move
        } as CreateClaimModel
        return claim
    }

    /**
     * Parse the user input to a WikiBase-Item Model 
     * @returns the Item-Model needed for Item creation later
     */
    private createItemFromInput(): WBItem {
        // NOTE: if no value then ""

        // all except labels en is optional -> ist "" dann okay, oder braucht undefined, oder braucht weglassen?
        const item = {
            type: 'item',
            labels: {
                en: this.$labelEn?.value,
                de: this.$labelDe?.value,
            },
            description: {
                en: this.$descriptionEn?.value,
                de: this.$descriptionDe?.value,
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
    private parseAlias(alias:string|undefined): string[] | string {
        if (!alias) return "" // undefined

        let parsed =  alias.split("|");
        parsed.forEach((alias, index) => {
            parsed[index] = alias.trim()
        });

        return parsed
    }

    private setError(text:string) {
        this.$errorField!.textContent = text;
    }

    private setFeedback(text:string) {
        this.$feedbackField!.textContent = text;
    }

    // ------ Rendering ------ //

    render() {
        return html`

        <div id="creator-container" class="container">
            NEW ITEM:

            <div id="label-container" class="container">
                <input id="label-en" type="text" placeholder="Label @en" required/>            
                <input id="label-de" type="text" placeholder="Label @de"/>

                <button @click=${this.onCheckLabel}>Match label @en</button>
            </div>

            <div id="description-container" class="container">
                <input id="description-en" type="text" placeholder="Description @en"/>
                <input id="description-de" type="text" placeholder="Description @de"/>
            </div>

            <div id="alias-container" class="container">
                <input id="alias-en" type="text" placeholder="Alias1|Alias2 @en"/>
                <input id="alias-de" type="text" placeholder="Alias1|Alias2 @de"/>
            </div>

            <!-- CLAIMS?? -->
        </div>

        <div id="attach-container" class="container">

            <label for="attach-column">Add to column:</label>
            <select id="attach-column"/>
            </select>

            <label for="attach-property">using property:</label>
            <select id="attach-property"/>
            </select>
        <div>

        <button id="add-item-btn" @click="${this.onAddItem}">ADD</button>

        <div id="creator-error"></div>
        <div id="creator-feedback"></div>

        `;
    }

    static styles = css`
        :host(.open) {
            position: absolute;
            right: 0;
            overflow-x: auto;
            width: 15rem;
            background-color: var(--bg-color);
            border-left: solid 1px var(--border-color);
            border-bottom: solid 1px var(--border-color);
            box-shadow: 2px 2px 4px var(--shadow-color);
        }
        :host(.closed) {
            display: none;
        }
        
        .container {
            display: flex;
            flex-direction:column;
            padding: 10px;
        }

        #add-item-btn {
            color: red;
        }

        #creator-error {
            color: red;
        }

        `;
}