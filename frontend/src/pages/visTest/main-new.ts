import WikibaseClient from "../../shared/WikibaseClient";
import { ApiClient } from "../../shared/client/ApiClient";
import { createApiClient } from "../../shared/util/getApiClient";
import "./style.css";
import { MainViz } from "./vis/MainViz";

async function main() {
	const credentials = {
		username: "",
		password: "",
	};
	const api = createApiClient();
	const wikibase = new WikibaseClient(credentials, api);
	const elements = await wikibase.getUserGraph();
	const parents = await wikibase.getCategories();

	const graph = parents.concat(elements);

	const mainViz = new MainViz(graph);
}

main();
