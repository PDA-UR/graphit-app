import { Credentials } from "../../WikibaseEditConfig";
import "./login.css"

export class LoginController {

    private readonly $container: HTMLDivElement;
    private readonly $errorDiv: HTMLDivElement;
    private readonly $root: ShadowRoot|Document;

    constructor(root:ShadowRoot|Document) {
        
        this.$root = root;
        this.$container = this.$root.getElementById("login-module") as HTMLDivElement;
        this.$errorDiv = this.$root.getElementById("login-error") as HTMLDivElement;
    }


    public show() {
        this.$container.style.display = "block";
    }

    public hide() {
        this.$container.style.display = "none";
    }


    public getCredentials(): Credentials | null {
        const userDiv = this.$root.querySelector("#wb-username") as HTMLInputElement;
        const pwDiv = this.$root.querySelector("#wb-pw") as HTMLInputElement;
        const username = userDiv.value;
        const password = pwDiv.value;
        
        if (username === "" || password === "") return null // catch
        return { username, password } as Credentials
    }

    public setError(msg:string) {
        this.$errorDiv.innerText = msg;
    }

}