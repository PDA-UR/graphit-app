export interface WikibasePropertyModel {
	propertyId: string;
	label: string;
}

export const MATRIX_PROPERTIES = [
	{
		propertyId: "P3",
		label: "Test: Property 3",
	},
	{
		propertyId: "P12",
		label: "Has completed",
	},
];

export const getWikibasePropertyById = (
	propertyId: string
): WikibasePropertyModel | undefined => {
	return MATRIX_PROPERTIES.find(
		(property) => property.propertyId === propertyId
	);
};
