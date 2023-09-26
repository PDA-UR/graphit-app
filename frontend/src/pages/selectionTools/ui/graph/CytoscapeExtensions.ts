import interestedNormal from "../../icons/interested_normal.svg";

export const initNodeHtmlLabel = (cy: any) => {
	const getBadge = (data: any) => {
		const badges = [];

		if (data.interested === "true")
			badges.push(
				"<div class='badge'><img src='" + interestedNormal + "'/></div>"
			);

		return `<div class="badges">${badges.join("")}</div>`;
	};

	cy.nodeHtmlLabel([
		{
			query: "node",
			halign: "center",
			valign: "center",
			halignBox: "center",
			valignBox: "center",
			tpl: getBadge,
		},
	]);
};

export const initLassoSelection = (cy: any) => {
	return cy.lassoSelectionEnabled(true);
};

export const initUndoRedo = (cy: any) => {
	return cy.undoRedo();
};
