import "./style.css";
import WikibaseClient from "../../shared/WikibaseClient";
import { MainViz } from "./vis/MainViz";

async function main() {
	const credentials = {
		username: "",
		password: "",
	};
	const wikibase = new WikibaseClient(credentials);
	const elements = await wikibase.getDependentsAndDependencies();
	const parents = await wikibase.getCategories();

	const graph = parents.concat(elements);

	const mainViz = new MainViz(graph);
}

main();
