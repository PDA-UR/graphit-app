import WikibaseClient from "../WikibaseClient";
import { Credentials } from "../WikibaseEditConfig";
import { LoginController, getPromiseFromEvent } from "./login/LoginController";

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

// ---------------------------- //

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
 * @param rootElement can be set to a shadow root, otherwise will use document
 * @returns logged in and created WikibaseClient and userInfo as array
*/
export const handleLogin = async (
	api:any, 
	rootElement:ShadowRoot|undefined=undefined
): Promise<any> => {

	let root = document as Document | ShadowRoot
	if (rootElement != undefined) {
		root = rootElement as ShadowRoot
	}

	const loginController = new LoginController(root);
	loginController.show();
	return await tryLogin(api, loginController, root);
};


/**
 * (re-)tries logging into the wikibase client
 * @param api the wikibase api instance
 * @param controller the LoginController instance
 * @param root the DOM root to use for the HTML elements
 * @returns logged in and created WikibaseClient and userInfo as array
 */
export async function tryLogin(api:any, controller:LoginController, root:Document|ShadowRoot): Promise<any> {
	const credentials = await controller.getCredentialsFromPrompt();

	// Try to log in
	const wikibaseClient: WikibaseClient = new WikibaseClient(credentials, api);
	let userInfo;
	try {
		userInfo = await wikibaseClient.login();
		localStorage.setItem("credentials", JSON.stringify(credentials));
		controller.hide();
		return [wikibaseClient, userInfo] as Array<any>;
	} catch (error:any) { 
		controller.setError(error.message);		
		return tryLogin(api, controller, root) // try login again
	}

}