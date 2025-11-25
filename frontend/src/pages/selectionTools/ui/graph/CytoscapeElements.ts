// ~~~~~~~~~~~ Normal selection ~~~~~~~~~~ //

export function getNormalSelectionElements(
	selectedElements: any,
	selectionType: SelectionType,
	cy: any
): [any, any] {
	// special case: ctrl click on a selected node
	if (
		selectionType === SelectionType.ADD &&
		selectedElements.length === 1 &&
		selectedElements[0].selected()
	)
		return [[], [selectedElements[0]]];
	return [
		getElementsToSelect(selectedElements, selectionType, cy),
		getElementsToUnselect(selectedElements, selectionType, cy),
	];
}

function getElementsToSelect(
	selectedElements: any,
	selectionType: SelectionType,
	cy: any
) {
	return selectionType === SelectionType.NEW
		? selectedElements
		: selectionType === SelectionType.ADD
		? selectedElements.filter((ele: any) =>
				cy.$(":selected").every((node: any) => node.id() !== ele.id())
		  )
		: [];
}

function getElementsToUnselect(
	selectionElements: any,
	selectionType: SelectionType,
	cy: any
) {
	return selectionType === SelectionType.ADD
		? []
		: selectionType === SelectionType.NEW
		? cy
				.$(":selected")
				.filter((ele: any) =>
					selectionElements.every((node: any) => node.id() !== ele.id())
				)
		: selectionElements;
}

// ~~~~~~~~~~~ Shortest path selection ~~~~~~~~~~ //

export function getPathSelectionElements(
	selectedElement: any,
	shortestPathElementIds: string[],
	selectionType: SelectionType,
	cy: any
) {
	const shortestPathElements = shortestPathElementIds.map((id) =>
		cy.getElementById(id)
	);

	if (shortestPathElements.length <= 1) return [[], []];
	const otherAlreadySelectedElements = cy
		.$(":selected")
		.filter((ele: any) =>
			shortestPathElements.every((node: any) => node.id() !== ele.id())
		);
	switch (selectionType) {
		case SelectionType.ADD:
			return [shortestPathElements, []];
		case SelectionType.NEW:
			return [shortestPathElements, otherAlreadySelectedElements];
		case SelectionType.SUBTRACT:
			return [[], shortestPathElements];
	}
}

// import cytoscape from "cytoscape-select";
import { SelectionType } from "../../global/SelectionType";
import cytoscape, { Collection } from "cytoscape";

export function allShortestPaths(
	cy: cytoscape.Core,
	sourceId: string,
	targetId: string
): Array<Array<string>> {
	const queue: Array<Array<string>> = [[sourceId]];
	const shortestPaths: Array<Array<string>> = [];
	const visited: { [nodeId: string]: number } = { [sourceId]: 0 };

	while (queue.length > 0) {
		const path = queue.shift()!;
		const lastNode = path[path.length - 1];

		if (lastNode === targetId) {
			shortestPaths.push(path);
		} else {
			const neighbors = cy
				.getElementById(lastNode)
				.neighborhood()
				.nodes()
				.not(".filtered")
				.map((node: any) => node.id());

			for (const neighbor of neighbors) {
				if (!visited[neighbor] || visited[neighbor] === visited[lastNode] + 1) {
					visited[neighbor] = visited[lastNode] + 1;
					queue.push([...path, neighbor]);
				}
			}
		}
	}

	return shortestPaths;
}

// ~~~~~~~~~~~~~~~~ Other ~~~~~~~~~~~~~~~~ //

export function getAllSelectionElements(
	cy: any,
	selectionType: SelectionType
): [any, any] {
	const elementsToSelect = cy.elements().difference(cy.elements(".dimmed"));
	return getNormalSelectionElements(elementsToSelect, selectionType, cy);
}

export function getNeighbors(
	elements: any[],
	ignoreFiltered = true
): Collection {
	const neighbors: Collection = elements
		.map((ele) => {
			const n = ele.neighborhood().nodes();
			if (ignoreFiltered) return n.not(".filtered");
			return n;
		})
		.reduce((acc, curr) => acc.union(curr))
		.filter((ele: any) => elements.every((node) => node.id() !== ele.id()));

	return neighbors;
}

export function jumpToNodes(nodes: any[], cy: any) {
	if (nodes.length === 1) {
		cy.animate({
			center: { eles: nodes[0] },
			duration: 100,
			zoom: 1.5,
		});
	} else if (nodes.length > 1)
		cy.animate({
			fit: { eles: nodes, padding: 10 },
			duration: 100,
		});
}

export function getCyElementsByIds(ids: string[], cy: any) {
	return ids.map((id) => cy.getElementById(id));
}
