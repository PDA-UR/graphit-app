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

    /**
     * Await the user input from the login prompt and then return it.
     * Listens for a 'button'-click or an 'enter'-press to happen.
     * @returns The entered username and password 
     */
    public async getCredentialsFromPrompt(): Promise<Credentials> {
        const btn = this.$root.getElementById("login-button") as HTMLDivElement;
        const clickPromise = getPromiseFromEvent(btn, "click"); 
        const keyPromise = getPromiseFromEnterKeyPress();
        await Promise.any([clickPromise, keyPromise]);
        let credentials = this.getCredentials();

        if(credentials == null) {
            this.setError("Empty credentials");
            return this.getCredentialsFromPrompt();
        }

        return {username: credentials!.username, password: credentials!.password}
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

// HELPER FUNCTIONS

/**
 * Creates a promise for a event on an item and waits for that event to happen, before resolving
 * Source: https://stackoverflow.com/a/70789108
 * @param item The (HTML)Item to add the event listener to
 * @param event the event (string)
 * @returns Promise that resolve to the items is was created for
 */
export function getPromiseFromEvent(item:any, event:any) {
    return new Promise<void>((resolve) => {
        const listeners = () => {
            item.removeEventListener(event, listeners);
            resolve(item); // return the item for differentiation
            // resolve();
        }
        item.addEventListener(event, listeners);
    })
}


/**
 * Create a promise for a keypress-event for the Enter-Key
 * Source: https://stackoverflow.com/a/70789108
 * @returns Promise that resolves when the key is pressed
 */
function getPromiseFromEnterKeyPress() {
    return new Promise<void>((resolve) => {
        document.addEventListener("keypress", onKeyHandler);
        function onKeyHandler(e:KeyboardEvent) {
            if(e.code === "Enter") {
                document.removeEventListener("keypress", onKeyHandler);
                resolve();
            }
        }
    });
}