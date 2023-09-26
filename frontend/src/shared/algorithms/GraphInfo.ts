import { Core, ElementDefinition } from "cytoscape";

export type NodeInfo = {
	id: string;
	edges: EdgeInfo[];
};

export const getConnectedNodeIds = (node: NodeInfo): string[] => {
	return node.edges.map((edge) =>
		edge.source === node.id ? edge.target : edge.source
	);
};

export type EdgeInfo = {
	id: string;
	source: string;
	target: string;
};

export type GraphInfo = NodeInfo[];

export const graphInfoFromCy = (cy: Core): GraphInfo => {
	const elements = cy.elements();
	return elements.nodes().map((node) => ({
		id: node.id(),
		edges: node.connectedEdges().map((edge) => ({
			id: edge.id(),
			source: edge.source().id(),
			target: edge.target().id(),
		})),
	}));
};

export const getNodeById = (
	graph: GraphInfo,
	id: string
): NodeInfo | undefined => {
	return graph.find((node) => node.id === id);
};

export const getOtherNodes = (graph: GraphInfo, node: NodeInfo) => {
	return graph.filter((otherNode) => otherNode.id !== node.id);
};
