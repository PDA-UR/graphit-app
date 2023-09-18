export interface WikibasePropertyModel {
	propertyId: string;
	name: string;
}

export const MATRIX_PROPERTIES = [
	{
		propertyId: "P0",
		name: "Test: Property 0",
	},
	{
		propertyId: "P1",
		name: "Test: Property 1",
	},
];

export const getWikibasePropertyById = (
	propertyId: string
): WikibasePropertyModel | undefined => {
	return MATRIX_PROPERTIES.find(
		(property) => property.propertyId === propertyId
	);
};
