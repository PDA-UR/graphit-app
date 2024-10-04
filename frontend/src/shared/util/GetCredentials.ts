import WikibaseClient from "../WikibaseClient";
import { Credentials } from "../WikibaseEditConfig";
import { LoginController } from "./login/LoginController";

/**
 * Let users input their credentials using prompt
 * Displays an error message if smth goes wrong
 * (only used in an older page)
 * @param errMsg 
 * @returns Credentials = {username, password}
 */
export const getCredentials = (errMsg:string=""): Credentials => {

	const username = prompt(`${errMsg}\nEnter your username (Wikibase user-page)`);
	if (username === null) { // on "Cancel"btn return to homepage
		window.location.href=window.location.origin+"/app/";
	}
	if (!username) { // on "OK", with no input -> repeat 
		return getCredentials(errMsg); 
	}

	const password = prompt("Enter your password");
	if (password === null) {
		window.location.href=window.location.origin+"/app/";
	}
	if (!password) {
		return getCredentials(errMsg);
	}

	return {
		username,
		password,
	};
};


/**
 * Creates a promise for a event on an item and waits for that event to happen, before resolving
 * Source: https://stackoverflow.com/a/70789108
 * @param item The (HTML)Item to add the event listener to
 * @param event the event (string)
 * @returns Promise that resolve to the items is was created for
 */
function getPromiseFromEvent(item:any, event:any) {
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


/**
 * Creates a "popup" to ask the User if they want to view a demo version of the 
 * @returns if the user wants to view the Demo or not (bool)
 */
export const askDemoAccess = async(): Promise<any> => {
	const $demoContainer = document.getElementById("demo-module") as HTMLDivElement;
	$demoContainer.style.display = "block";
	
	// create a promise per button
	const $loginBtn = document.getElementById("sign-in-btn") as HTMLDivElement;
	const $demoBtn = document.getElementById("demo-btn") as HTMLDivElement;
	const loginProm = getPromiseFromEvent($loginBtn, "click");
	const demoProm = getPromiseFromEvent($demoBtn, "click");
	
	// Run when any of the 2 promises is fulfilled
	const res = await Promise.any([loginProm, demoProm]) as any;
	$demoContainer.style.display = "none";

	if (res.id == "sign-in-btn") {
		return false
	}
	return true;
 }


/**
 * create a loginController and awaits the successful log in attempt.
 * @param api the wikibase api instance
 * @returns logged in and created WikibaseClient and userInfo as array
*/
export const handleLogin = async (api:any): Promise<any> => {
	const loginController = new LoginController();
	loginController.show();
	return await tryLogin(api, loginController);
};


/**
 * (re-)tries logging into the wikibase client
 * @param api the wikibase api instance
 * @param controller the LoginController instance
 * @returns logged in and created WikibaseClient and userInfo as array
 */
async function tryLogin(api:any, controller:LoginController) {
	const btn = document.getElementById("login-button") as HTMLDivElement;
	const clickPromise =  getPromiseFromEvent(btn, "click"); 
	const keyPromise = getPromiseFromEnterKeyPress();

	// Await a button-click or a enter keypress
	await Promise.any([clickPromise, keyPromise]);

	const credentials = controller.getCredentials();
	if (credentials == null) {
		controller.setError("Empty credentials");
		return tryLogin(api, controller);
	}

	// Try to log in
	const wikibaseClient: WikibaseClient = new WikibaseClient(credentials, api);
	let userInfo;
	try {
		userInfo = await wikibaseClient.login();
		localStorage.setItem("credentials", JSON.stringify(credentials));
		controller.hide();
		return [wikibaseClient, userInfo] as Array<any>;
	} catch (error:any) { 
		// parse the error into a readable message
		let str = error.message
		str = str.split('message":')
		let errorMsg = str[1].replace("}", ""); // rm trailing "}" 
		controller.setError(errorMsg);
		
		return tryLogin(api, controller) // try login again
	}

}


