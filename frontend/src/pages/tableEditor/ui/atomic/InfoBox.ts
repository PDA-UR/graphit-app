import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { Component } from "./Component";

/**
 * <info-box> is a simple informational component of that lists usage and shortcuts.
 */
@customElement("info-box")
export class InfoBox extends Component {
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
                        <td> SHIFT/ALT/CTRL/META + <i>drag</i>
                        <td> Copy and Paste items </td>
                    </tr>
                    <tr>
                        <td> CTRL + x </td>
                        <td> Toggle copy-paste on/off </td>
                    </tr>
                    <tr>
                        <td> CTRL + q </td>
                        <td> Toggle move or discard qualifiers </td>
                    </tr>
                    <tr>
                        <td> CTRL + i </td>
                        <td> Toggle info box on/off </td>
                    </tr>
                </table>
            </div>
            <br>
        </div>
        `; 
	}
}

