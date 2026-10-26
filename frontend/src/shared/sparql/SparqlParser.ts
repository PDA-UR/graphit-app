import { ElementDefinition } from "cytoscape";

type SparqlResults = any;
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
		results: SparqlResults,
		optionalRelation: string | undefined = undefined,
	): ElementDefinition[] {
		let nodes = this.parseNodes(nodePrefixes, results);
		let edges = this.parseEdges(nodePrefixes, edgeLabel, results);

		const result = this.parseOptionalLink(nodePrefixes, edges, nodes, optionalRelation, results);
		// const allEdges = this.parseOptionalEdge(nodePrefixes, edges, optionalEdge, results);
		nodes = result[0], edges = result[1];
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
		results: SparqlResults,
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

	// Parse an optional link (of form e.g. ?relation ?relationLabel)
	/**
	 * Parse on optional node/edge relation 
	 * (such as "related to" for ?relation ?relationLabel)
	 * @returns updated array of [Nodes, Edges]
	 */
	parseOptionalLink(
		nodePrefixes: [string, string],
		existingEdges: ElementDefinition[],
		existingNodes: ElementDefinition[],
		label: string|undefined,
		results: SparqlResults,
	): [ElementDefinition[], ElementDefinition[]] {
		// do nothing if no optional relation was given
		if (label == undefined) return [existingNodes, existingEdges];
		
		// parse Nodes into format
		const bindings = results.results.bindings;
		const vars = results.head.vars;
		
		const nodes: ElementDefinition[] = [];
		bindings.forEach((binding: any) => {
			const node = this.parseNode(label, binding, vars);
			if (node) {
				node.data.type = label // for differentiation
				const existingNode = nodes.find((n) => n.data.id === node.data.id);
				if (existingNode) {
					const mergedNode = this.mergeNodes([existingNode, node]);
					nodes.splice(nodes.indexOf(existingNode), 1, mergedNode);
				} else nodes.push(node);
			}
		});

		// parse Edges into format
		const optionalPrefixes = [nodePrefixes[0], label] as [string, string]
		const edges = this.parseEdges(optionalPrefixes, label, results)

		// add to existing nodes & edges
		const allNodes = existingNodes.concat(nodes);
		const allEdges = existingEdges.concat(edges);
		return [allNodes, allEdges];
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

		const bindings = results.results.bindings; // all query result objects
		const vars = results.head.vars; // e.g. "source", "sourceLabel"

		bindings.forEach((binding: any) => {
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
			if (!variable.startsWith(prefix)){
				continue;
			} 
			let key = variable.slice(prefix.length); // slices of e.g. "source" from sourceLabel
			if (key === "") key = "id"; // e.g. ?source
			key = key.charAt(0).toLowerCase() + key.slice(1);

			// To make parents work from inside of a node
			if (
				variable == "sourceNodeClassLabel" ||
				variable == "dependencyNodeClassLabel"
			) {
				key = "parent";
			}

			
			const value = binding[variable]?.value;
			
			if (value) node.data[key] = value;
			
		}

		node.data._originalData = node.data;

		return node.data.id ? node : null;
	}

	/**
	 * Parse Items of the category class to cytoscape parent nodes
	 * Result of the SPARQL query: item, itemLabel
	 * @param results Results of the SPARQL query
	 * @returns an array of parsed parent nodes
	 */
	public parseParents(results: SparqlResults): ElementDefinition[] {
		const parents: ElementDefinition[] = [];

		const bindings = results.results.bindings; 
		const vars = results.head.vars; 

		bindings.forEach((binding: any) => {
			for (const variable of vars) {
				const parent = this.parseParent(binding, vars);
				parents.push(parent);
			}
		});
		return parents;
	}

	/**
	 * Parses a single parent node into the format: {group: "nodes", data:{id: "..."}}
	 * id: currently ?itemLabel, bc. node.parent is ?nodeClassLabel
	 * @param binding The bindings of the SPARQL query result
	 * @param vars The variables of the SPARQL query
	 * @returns
	 */
	private parseParent(
		binding: any,
		vars: ReadonlyArray<string>
	): ElementDefinition {
		const key = "id"; // Parent-nodes need same id, as node.parent-value
		const parent: ElementDefinition = {
			group: "nodes",
			data: {},
		};

		for (const variable of vars) {
			const value = binding[variable]?.value;
			if (value) parent.data[key] = value;
		}

		return parent;
	}
}
