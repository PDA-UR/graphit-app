import { GraphModel } from "../../graph/GraphModel";

export type NodeData = any;

export const getNodeDatasFromGraph = (graph: GraphModel): NodeData[] => {
	return (
		graph
			// filter out edges
			.filter((node) => node.group === "nodes")
			.map((node) => node.data)
	);
};

export function getNodeDatasFromCy(cy: any): NodeData[] {
	return cy
		.nodes()
		.not(".filtered")
		.map((node: any) => node.data());
}
