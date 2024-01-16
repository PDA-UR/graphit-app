import WikibaseClient from "../WikibaseClient";
import { Credentials } from "../WikibaseEditConfig";
import { ApiClient, CredentialsModel } from "../client/ApiClient";

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
export const getCredentials = (errMsg:string=""): Credentials => {
	console.log("old creds");
	const username = prompt(`${errMsg}\nEnter your username`);
	if (!username) {
		return getCredentials(errMsg);
	}
	const password = prompt("Enter your password");
	if (!password) {
		return getCredentials(errMsg);
	}

	return {
		username,
		password,
	};
};

/**
 * Handles the input and checks if the credentials are correct
 * @param api The created api client
 * @param errorMsg A default or custom error msg
 * @returns Array [wikibaseClient, userInfo];
 */
export async function handleCredentials(api:ApiClient<unknown>, errorMsg:string="") 
: Promise<Array<any>> {
	// getCred
	const credentials: CredentialsModel = getCredentials(errorMsg);
	const wikibaseClient: WikibaseClient = new WikibaseClient(credentials, api);
	let userInfo;
	if(errorMsg == "") { errorMsg="Incorrect Login: Try again"};
	try {
		userInfo = await wikibaseClient.login();
	} catch (err) {
		console.log("false login");
		return handleCredentials(api, errorMsg);
	}
	localStorage.setItem("credentials", JSON.stringify(credentials));
	return [wikibaseClient, userInfo] as Array<any>;
}


// // TODO: open as modal, not as popup??
// export const getCredentialsNew = (): Credentials => {
// 	console.log("new creds");
// 	// const url = "../ui/LoginModule/index.html";
// 	const url = URL.createObjectURL(new Blob([loginHtml], {type: ("text/html")}));
// 	const params = `width=400, height=500, location=no, resizable=no, menubar=no, toolbar=no`

// 	window.open(url, "_blank", params);

// 	const username = prompt("Enter your username");
// 	if (!username) {
// 		return getCredentials();
// 	}
// 	const password = prompt("Enter your password");
// 	if (!password) {
// 		return getCredentials();
// 	}

// 	URL.revokeObjectURL(url);

// 	return {
// 		username,
// 		password,
// 	};
// }
// create modal using custom html elements or templates
// https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
// https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots

// TODO: do signup at hub == EASIEST => one signup for all pages
