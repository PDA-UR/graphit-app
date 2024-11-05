import { Credentials } from "../../WikibaseEditConfig";
import "./login.css"

export class LoginController {

    private readonly $container: HTMLDivElement;
    private readonly $errorDiv: HTMLDivElement;

    constructor() {
        this.$container = document.getElementById("login-module") as HTMLDivElement;
        this.$errorDiv = document.getElementById("login-error") as HTMLDivElement;
    }


    public show() {
        this.$container.style.display = "block";
    }

    public hide() {
        this.$container.style.display = "none";
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