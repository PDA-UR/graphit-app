import WikibaseClient from "../../../shared/WikibaseClient";
import { getCredentials } from "../../../shared/util/GetCredentials";
import { createApiClient } from "../../../shared/util/getApiClient";
import { LoadingSpinner } from "../utils/SpinnerManager";

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

let progValue = 1; // initial value for progressbar

// HANDELS GETTING THE ELEMENTS
export const getElements = async () => {
	const localStorageKey = "elements";
	const elements = localStorage.getItem(localStorageKey);
	// const loader = document.getElementById("loader") as HTMLElement;
	const spinner = new LoadingSpinner();
	spinner.start();

	if (elements) {
		console.log("loading from local storage");
		const parsedElements = JSON.parse(elements);
		spinner.stop();
		return parsedElements;
	} else {
		console.log("loading from wikibase");

		// Get and set credentials and api
		const credentials = getCredentials();
		const api = createApiClient();
		const wikibase = new WikibaseClient(credentials, api);
		
		// Login:
		const userInfo = await wikibase.login();

		// Get Elements !!
		const elements = await getElementsFromWikibase(wikibase);

		// Store elements for the session
		localStorage.setItem(
			localStorageKey,
			JSON.stringify(elements, getCircularReplacer()),
		);
		// download(JSON.stringify(elements, getCircularReplacer()), "cgbv.json", 'json');
		
		spinner.stop();

		return elements;
	}
};

// Get the elements from the wikibase instance
async function getElementsFromWikibase(client: WikibaseClient) {
	let elements = await client.getUserGraph();
	const resources = await client.getResource();
	elements = elements.concat(resources); 
	// addResAsMeta(elements, resources); // IDEA: parse res as metadata to eles
	const wissArb = await client.getWissGraph();
	elements = elements.concat(wissArb);
	
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
