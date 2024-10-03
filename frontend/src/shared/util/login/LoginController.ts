import WikibaseClient from "../../WikibaseClient";
import { Credentials } from "../../WikibaseEditConfig";
import "./login.css"

const loginModule = `
    <div id="info-text">
    <b>GraphIT Login:</b><br>
    <small>Your GraphIT-Wikibase account:</small>
    </div>
    <input id="username" name="username" class="login-input" placeholder="username"> <br>
    <input type="password" id="pw" name="pw" class="login-input" placeholder="password"> <br>

`;

export class LoginController {

    private readonly $container: HTMLDivElement;
    private readonly $errorDiv: HTMLDivElement;
    private dimmer: HTMLElement;

    constructor() {
        this.$container = document.getElementById("login-module") as HTMLDivElement;
        this.$errorDiv = document.getElementById("login-error") as HTMLDivElement;

        this.dimmer = document.createElement("div") as HTMLElement;
        this.dimmer.setAttribute("class", "dimmer");
    }


    public show() {
        this.$container.style.display = "block";
        document.body.appendChild(this.dimmer);
    }

    public hide() {
        this.$container.style.display = "none";
        document.body.removeChild(this.dimmer);
    }


    public getCredentials(): Credentials | null {
        const userDiv = document.getElementById("wb-username") as HTMLInputElement;
        const pwDiv = document.getElementById("wb-pw") as HTMLInputElement;
        const username = userDiv.value;
        const password = pwDiv.value;
    
        if (username === "" || password === "") return null // catch
        return { username, password } as Credentials
    }

    public setError(msg:string) {
        this.$errorDiv.innerText = msg;
    }

}