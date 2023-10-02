import WikibaseClient from "../../../shared/WikibaseClient";
import { getCredentials } from "../../../shared/util/GetCredentials";
import { createApiClient } from "../../../shared/util/getApiClient";

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

export const getElements = async () => {
	const localStorageKey = "elements";
	const elements = localStorage.getItem(localStorageKey);

	if (elements) {
		console.log("loading from local storage");
		const parsedElements = JSON.parse(elements);
		return parsedElements;
	} else {
		console.log("loading from wikibase");
		const credentials = getCredentials();
		const api = createApiClient();
		const wikibase = new WikibaseClient(credentials, api);
		//Test: less items, as resources are in Metadata (change Parser)
		//const elements = await wikibase.getDefaultGraph(); 
		
		let elements = await wikibase.getUserGraph();
		const resources = await wikibase.getResource();
		// // const parents = await wikibase.getCategories();
		// //elements = elements.concat(resources, parents);
		elements = elements.concat(resources);
		console.log(elements);
		localStorage.setItem(
			localStorageKey,
			JSON.stringify(elements, getCircularReplacer()),
		);
		// download(JSON.stringify(elements, getCircularReplacer()), "cgbv.json", 'json');
		return elements;
	}

	function download(content:any, fileName:any, contentType:any) {
		var a = document.createElement("a");
		var file = new Blob([content], {type: contentType});
		a.href = URL.createObjectURL(file);
		a.download = fileName;
		a.click();
	}
};
