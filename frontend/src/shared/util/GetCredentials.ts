import WikibaseClient from "../WikibaseClient";
import { Credentials } from "../WikibaseEditConfig";
import { CredentialsModel } from "../client/ApiClient";

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
		history.back()
	}
	if (!username) { // on "OK", with no input -> repeat 
		return getCredentials(errMsg); 
	}

	const password = prompt("Enter your password");
	if (password === null) {
		history.back()
	}
	if (!password) {
		return getCredentials(errMsg);
	}

	return {
		username,
		password,
	};
};


// Note: Rework of the old handleLogin
/**
 * Trys to login to wikibase account, using login
 * @param api the wikibase api instance
 * @param error (leave empty) optional error message after failed login
 * @returns logged in and created WikibaseClient and userInfo as array
 */
export const tryLogin = async (api:any, error:any=""): Promise<any> => {

	const credentials: CredentialsModel = getCredentials(error)

	const wikibaseClient: WikibaseClient = new WikibaseClient(credentials, api);
	let userInfo;
	try {
		userInfo = await wikibaseClient.login();
		return [wikibaseClient, userInfo] as Array<any>;
	} catch (error:any) { 
		// parse the error into a readable message
		let str = error.message
		str = str.split('message":')
		let errorMsg = str[1].replace("}", ""); // rm trailing }
		
		return tryLogin(api, errorMsg) // try login again
	}


};

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

