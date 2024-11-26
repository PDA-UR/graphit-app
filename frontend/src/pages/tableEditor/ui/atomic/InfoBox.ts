import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { Component } from "./Component";
import SearchSidebar from "../SearchSidebar";

/**
 * <info-box> is a simple informational component of usage and shortcuts
 */
@customElement("info-box") // NOTE: can be used as: <info-box></info-box>
export class InfoBox extends Component {
// TODO: load on "info-toggle" click + close, when click outside of box
    // i.e. include <info-box> in App.ts-html & change visibility/display css property on "info-toggle" click
	static styles = css`
		:host {
            position: absolute;
            left: 0;
            right: 0;
            top: 30%;
            text-align: center;
            margin: auto;
            border: solid 1px  var(--border-color);
            border-radius: 2px;
            width: fit-content;
            padding: 10px;
            box-shadow: 2px 2px 4px var(--shadow-color-soft);
            background-color: var(--bg-color);
        }
        :host(.hide) {
            display: none;
        }
        :host(.show) {
            display: block;
        }
        #info-table {
            margin: auto;
            border: solid 1px var(--border-color);
            border-spacing: 3px;
            border-collapse: collapse;
            text-align: left;
        }
        #info-table tr {
            border: none;
        }
        #info-table td {
            padding: 1px 5px;
        }
        #info-table td:first-child {
            border-right: solid 1px var(--border-color);
        }
        
	`;

    // TODO
	render() {
		return html`
        <div>
            <b>TABLE EDITOR</b> <br>
            Use this editor to add and copy links to items. <br>
            <br>
            <div id="info-container">
                <table id="info-table">
                    <tr>
                        <td> CTRL + f </td>
                        <td> Toggle Sidebar </td>
                    </tr>
                    <tr>
                        <td> DEL or BACKSPACE </td>
                        <td> Remove selected item </td>
                    </tr>
                    <tr>
                        <td> SHIFT + <i>drag</i>
                        <td> Paste items </td>
                    </tr>
                </table>
            </div>
            <br>
        </div>
        `; 
	}
}


/**
 * 
 * TABLE EDITOR:
 * Use this editor to add and copy links to items.
 * -----------------------------------------------
 * <kbd>CTRL+f</kbd> toggles sidebar
 * <kbd>Del</kbd> or <kbd>Backspace</kbd> removes a selected item
 * <kbd>Shift</kbd> + *drag* will paste items
 */

// CTRL + f          |  toggles sidebar
// DEL or BACKSPACE  |  Removes a selected item 

