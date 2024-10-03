import { log } from "console";
import WikibaseClient from "../WikibaseClient";
import { Credentials } from "../WikibaseEditConfig";
import { CredentialsModel } from "../client/ApiClient";
import { LoginController } from "./login/LoginController";

const getCredentialsFromLocalStorage = (): Credentials | null => {
	const username = localStorage.getItem("username");
	const password = localStorage.getItem("password");
	if (!username || !password) {
		return null;
	}
	return {
		username,
		password,
	};
};

/**
 * Let users input their credentials using prompt + displays an error message if smth goes wrong
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
// TODO: rework getCredentials to work with new login-module





// Note: Rework of the old handleLogin
/**
 * Trys to login to wikibase account, using login
 * @param api the wikibase api instance
 * @param error (leave empty) optional error message after failed login
 * @returns logged in and created WikibaseClient and userInfo as array
 */
export const tryLoginWORKING = async (api:any, error:any=""): Promise<any> => {

	const credentials: CredentialsModel = getCredentials(error)

	const wikibaseClient: WikibaseClient = new WikibaseClient(credentials, api);
	let userInfo;
	try {
		userInfo = await wikibaseClient.login();
		localStorage.setItem("credentials", JSON.stringify(credentials));
		return [wikibaseClient, userInfo] as Array<any>;
	} catch (error:any) { 
		// parse the error into a readable message
		let str = error.message
		str = str.split('message":')
		let errorMsg = str[1].replace("}", ""); // rm trailing }
		
		// return handleLogin(api, errorMsg) // try login again
	}
	
	
};

// Wait for an event to happen (via: https://stackoverflow.com/a/70789108)
function getPromiseFromEvent(item:any, event:any) {
	return new Promise<void>((resolve) => {

		const listeners = () => {
			item.removeEventListener(event, listeners);
			resolve();
		}
			
		item.addEventListener(event, listeners);
		
	})
}


// TODO: await either click or enter
async function awaitClickOrKeyLoginEvent() {
	// if the
	const btn = document.getElementById("login-button") as HTMLDivElement;
	const clickPromise = getPromiseFromEvent(btn, "click")

	const keyPromise = getPromiseFromEvent(window, "keypress");
	const promises = [clickPromise, keyPromise];

	await Promise.any(promises);
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
	// Await the button click for a login attempt
	const btn = document.getElementById("login-button") as HTMLDivElement;
	await getPromiseFromEvent(btn, "click"); 
	console.log("trying...");

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
		let errorMsg = str[1].replace("} ", ""); // rm trailing } 
		controller.setError(errorMsg);
		
		return tryLogin(api, controller) // try login again
	}

}


// old-code

// export const getCredentials = (errMsg:string=""): Credentials => {
// 	console.log("old creds");
// 	const username = prompt(`${errMsg}\nEnter your username`);
// 	if (!username) {
// 		return getCredentials(errMsg);
// 	}
// 	const password = prompt("Enter your password");
// 	if (!password) {
// 		return getCredentials(errMsg);
// 	}

// 	return {
// 		username,
// 		password,
// 	};
// };

// /**
//  * Handles the input and checks if the credentials are correct
//  * @param api The created api client
//  * @param errorMsg A default or custom error msg
//  * @returns Array [wikibaseClient, userInfo];
//  */
// export async function handleCredentials(api:ApiClient<unknown>, errorMsg:string="") 
// : Promise<Array<any>> {
// 	// getCred
// 	const credentials: CredentialsModel = getCredentials(errorMsg);
// 	const wikibaseClient: WikibaseClient = new WikibaseClient(credentials, api);
// 	let userInfo;
// 	if(errorMsg == "") { errorMsg="Incorrect Login: Try again"};
// 	try {
// 		userInfo = await wikibaseClient.login();
// 	} catch (err) {
// 		console.log("false login");
// 		return handleCredentials(api, errorMsg);
// 	}
// 	localStorage.setItem("credentials", JSON.stringify(credentials));
// 	return [wikibaseClient, userInfo] as Array<any>;
// } // Working 

