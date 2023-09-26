export type Point = [number, number];
export type Rect = [Point, Point];

export const zoom = (
	cy: any,
	steps: number,
	stepSize: number,
	event: MouseEvent
) => {
	const zoom = cy.zoom();
	const newZoom = zoom + steps * stepSize;
	// if exceeding zoom limits, return
	if (newZoom < cy.minZoom() || newZoom > cy.maxZoom()) return;

	const cyCanvas = cy.container();
	const clientPosition = getPointOnCanvas(event, cyCanvas);
	const canvasPosition = getPointInCy([clientPosition.x, clientPosition.y], cy);

	const pos = cy
		.renderer()
		.projectIntoViewport(canvasPosition[0], canvasPosition[1]);

	cy.zoom({
		level: newZoom,
		position: {
			x: pos[0],
			y: pos[1],
		},
	});
};

const getPointOnCanvas = (event: MouseEvent, canvas: HTMLCanvasElement) => {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	return { x, y };
};

export function getPointInCy(clientPosition: Point, cy: any): Point {
	const offset = cy.renderer().findContainerClientCoords();
	const canvasPosition: Point = [
		clientPosition[0] - offset[0],
		clientPosition[1] - offset[1],
	];
	return canvasPosition;
}
