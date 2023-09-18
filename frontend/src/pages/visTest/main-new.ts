import WikibaseClient from "../../shared/WikibaseClient";
import { ApiClient } from "../../shared/client/ApiClient";
import { getCredentials } from "../../shared/util/GetCredentials";
import { createApiClient } from "../../shared/util/getApiClient";
import "./style.css";
import { MainViz } from "./vis/MainViz";
import * as fs from "fs";


async function main() {
	/*const credentials = {
		username: "",
		password: "",
	};*/
	const credentials = getCredentials();
	console.log("test!!"); 
	const api = createApiClient();
	const wikibase = new WikibaseClient(credentials, api);
	
	try {
		const loginResponse = await wikibase.login();
	} catch (e) {
		console.log(e);
		alert(e);
		return;
	}
	const elements = await wikibase.getUserGraph();
	const parents = await wikibase.getCategories();
	const resources = await wikibase.getResource();

	const graph = parents.concat(elements)//.concat(resources);

	//const graph = elements.concat(resources);
	//console.table(graph);
	const mainViz = new MainViz(graph);
}

main();
