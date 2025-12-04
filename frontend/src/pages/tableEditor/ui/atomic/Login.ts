import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { Component } from "./Component";

/**
 * A custom login prompt.
 * It's the same element as used in the selectionTools-Editor,
 * so that it can reuse parts of the existing (shared) infrastructure
 * -> Lit.js works a bit different than regular js, so had to adjust a bit
 */
@customElement("login-prompt")
export class LoginPrompt extends Component {
    
    // ------ Rendering ------ //
    
    static styles = css`
        :host {
            margin: 20px auto;
            border: 2px solid gray;
            border-radius: 2px;
            text-align:center;
            padding: 5px;
        }    
        :host(.hide) {
            display:none;
        }
        :host(.show) {
            display: block;
        }
    `

    render() {
        return html`
        <div id="login-module">
			<div id="info-text">
				Your <b>GraphIT-Wikibase</b> account:
			</div>
			<input id="wb-username" name="username" class="login-input" placeholder="username" required> <br>
			<input type="password" id="wb-pw" name="pw" class="login-input" placeholder="password" required> <br>
			<button id="login-button" class="base-item">Login</button>
			<div id="login-error"></div>
		</div>
        `
    }
}