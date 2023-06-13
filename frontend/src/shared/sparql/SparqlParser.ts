import { ElementDefinition } from "cytoscape";
import type { SparqlResults } from "wikibase-sdk";

export class SparqlParser {
	/**
	 * Parses the results of a SPARQL query into a graph.
	 * The results must be of a query that returns pairs of nodes prefixed with the given prefixes.
	 * @param nodePrefixes Tuple of prefixes used to parse individual nodes from the results (e.g. ["source", "dependency"])
	 * @param edgeLabel Label of the edge between the nodes (e.g. "depends on")
	 * @param results Results of the SPARQL query
	 * @returns
	 */
	parsePairs(
		nodePrefixes: [string, string],
		edgeLabel: string,
		results: SparqlResults
	): ElementDefinition[] {
		const nodes = this.parseNodes(nodePrefixes, results);
		const edges = this.parseEdges(nodePrefixes, edgeLabel, results);
		return nodes.concat(edges);
	}

	/**
	 * Parses the results of a SPARQL query into an array of edges
	 * The results must be of a query that returns pairs of nodes prefixed with the given prefixes.
	 * @param nodePrefixes  Tuple of prefixes used to parse individual nodes from the results (e.g. ["source", "dependency"])
	 * @param edgeLabel Label of the edge between the nodes (e.g. "depends on")
	 * @param results Results of the SPARQL query
	 * @returns
	 */
	parseEdges(
		nodePrefixes: [string, string],
		edgeLabel: string,
		results: SparqlResults
	): ElementDefinition[] {
		const bindings = results.results.bindings;
		const edges: ElementDefinition[] = [];
		bindings.forEach((binding: any) => {
			const sourceNode = binding[nodePrefixes[0]],
				targetNode = binding[nodePrefixes[1]];

			if (!sourceNode || !targetNode) return;

			const edge: ElementDefinition = {
				data: {
					id: `${sourceNode.value}-${edgeLabel}-${targetNode.value}`,
					source: sourceNode.value,
					target: targetNode.value,
					label: edgeLabel,
				},
			};

			edges.push(edge);
		});
		return edges;
	}

	/**
	 * Parses the results of a SPARQL query into an array of edges
	 * The results must be of a query that returns pairs of nodes prefixed with the given prefixes.
	 * @param nodePrefixes  Tuple of prefixes used to parse individual nodes from the results (e.g. ["source", "dependency"])
	 * @param results  Results of the SPARQL query
	 * @returns
	 */
	parseNodes(
		nodePrefixes: [string, string],
		results: SparqlResults
	): ElementDefinition[] {
		const nodes: ElementDefinition[] = [];

		const bindings = results.results.bindings;
		const vars = results.head.vars;

		bindings.forEach((binding) => {
			nodePrefixes.forEach((prefix) => {
				const node = this.parseNode(prefix, binding, vars);
				if (node) {
					const existingNode = nodes.find((n) => n.data.id === node.data.id);
					if (existingNode) {
						const mergedNode = this.mergeNodes([existingNode, node]);
						nodes.splice(nodes.indexOf(existingNode), 1, mergedNode);
					} else nodes.push(node);
				}
			});
		});

		return nodes;
	}

	/**
	 * Merge the data of multiple nodes into one node
	 * @param nodes The nodes to merge
	 * @returns
	 */
	private mergeNodes(nodes: ElementDefinition[]): ElementDefinition {
		const node = nodes[0];
		for (let i = 1; i < nodes.length; i++) {
			const n = nodes[i];
			for (const key in n.data) {
				if (key in node.data) continue;
				node.data[key] = n.data[key];
			}
		}
		return node;
	}

	/**
	 * Parses a single node from the results of a SPARQL query
	 * @param prefix The prefix of the node (e.g. "source")
	 * @param binding The bindings of the SPARQL query result
	 * @param vars The variables of the SPARQL query
	 * @returns
	 */
	private parseNode(
		prefix: string,
		binding: any,
		vars: ReadonlyArray<string>
	): ElementDefinition | null {
		const idKey = prefix,
			labelKey = prefix + "Label";

		const node: ElementDefinition = {
			group: "nodes",
			data: {},
		};

		for (const variable of vars) {
			if (!variable.startsWith(prefix)) continue;
			let key = variable.slice(prefix.length);
			if (key === "") key = "id";
			// lowercase first letter
			key = key.charAt(0).toLowerCase() + key.slice(1);

			const value = binding[variable]?.value;

			if (value) node.data[key] = value;
		}

		node.data._originalData = node.data;

		return node.data.id ? node : null;
	}
}
