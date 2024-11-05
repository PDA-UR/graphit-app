import WikibaseClient from "../../../shared/WikibaseClient";
import { handleLogin } from "../../../shared/util/GetCredentials";
import { createApiClient } from "../../../shared/util/getApiClient";
import { LoadingSpinner } from "../../../shared/ui/LoadingSpinner/SpinnerManager";
import { ApiClient, CredentialsModel } from "../../../shared/client/ApiClient";

export const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key: any, value: any) => {
		if (typeof value === "object" && value !== null) {
			if (seen.has(value)) {
				return;
			}
			seen.add(value);
		}
		return value;
	};
};

export const downloadJson = (data: any, filename: string) => {
	// download elements as json
	const json = JSON.stringify(data, getCircularReplacer());
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.download = filename;
	a.href = url;
	a.textContent = "Download graph.json";
	document.body.appendChild(a);
	// click
	a.click();
};

// HANDELS GETTING THE ELEMENTS
export const getElements = async () => {
	const localStorageKey = "elements";
	const credetialsKey = "credentials";
	const storedElements = localStorage.getItem(localStorageKey);
	const storedCredentials = localStorage.getItem(credetialsKey);
	// const loader = document.getElementById("loader") as HTMLElement;
	const spinner = new LoadingSpinner();
	spinner.start();

	const api = createApiClient() as ApiClient<unknown>;

	let credentials: CredentialsModel;
	let wikibaseClient: WikibaseClient;
	let userInfo;
	if(storedCredentials){
		credentials = JSON.parse(storedCredentials);
		wikibaseClient = new WikibaseClient(credentials, api);
		userInfo = await wikibaseClient.login();
	} else {
		// credentials = getCredentials();
		// localStorage.setItem(credetialsKey, JSON.stringify(credentials));
		let logRes:Array<any> = await handleLogin(api);
		wikibaseClient = logRes[0];
		userInfo = logRes[1];
	}
	
	// const wikibaseClient = new WikibaseClient(credentials, api);

	if (storedElements) {
		console.log("loading from local storage");
		const elements = JSON.parse(storedElements);
		spinner.stop();
		return [wikibaseClient, elements];
	} else {
		console.log("loading from wikibase");

		// Get and set credentials and api
		// const credentials = getCredentials();
		// const api = createApiClient();
		
		// Login:
		// const userInfo = await wikibaseClient.login();

		// Get Elements !!
		const elements = await getElementsFromWikibase(wikibaseClient);

		// Store elements for the session
		localStorage.setItem(
			localStorageKey,
			JSON.stringify(elements, getCircularReplacer()),
		);

		// download(JSON.stringify(elements, getCircularReplacer()), "cgbv.json", 'json');
		
		spinner.stop();

		return [wikibaseClient, elements];
	}
};

// Get the elements from the wikibase instance
async function getElementsFromWikibase(client: WikibaseClient) {
	// let elements = await client.getUserGraph(); // CGBV 23WS
	let elements = await client.getCourseQuery("Q932") // CGBV 24SS
	let cgbvRes = await client.getResource("Q932")
	elements = elements.concat(cgbvRes)
	// console.log("cgbv", elements.length, elements)

	// // addResAsMeta(elements, resources); // IDEA: parse res as metadata to eles
	
	// // const wissArb = await client.getCourseQuery("Q468"); // WissArb 23WS
	const wissArb = await client.getCourseQuery("Q926") // WissArb 24SS
	let wissRes = await client.getResource("Q926")
	// console.log("wissarb", wissArb.length)

	elements = elements.concat(wissArb);
	elements = elements.concat(wissRes)
	// let elements = wissArb.concat(wissRes);
	return elements;
}



/**
	 * Download the data (for dev use)
	 * @param content stringified content of the file (e.g.: parsed wikibase-elements)
	 * @param fileName The name of the file to download 
	 * @param contentType What filetype (e.g.: 'json')
	 */
function download(content:any, fileName:string, contentType:string) {
	var a = document.createElement("a");
	var file = new Blob([content], {type: contentType});
	a.href = URL.createObjectURL(file);
	a.download = fileName;
	a.click();
} // NOTE: was: fileName: any, contentType:any
// e.g.: download(JSON.stringify(elements, getCircularReplacer()), "cgbv.json", 'json');



// TEST:
function addResAsMeta(elements:any, resources:any){
	// go through res-array -> find matching eles (id's) -> add res-data to eles
	resources.forEach((res: any) => {
		for(let ele of elements) {
			if(ele.data.id == res.data.id) {
				// ele.data.push(res.data);
				//ele = [...ele.data, res.data]
				console.log(ele.data,"+", res.data);
			} else console.log("no match for res:", res.data.label);
		}
	});
}
