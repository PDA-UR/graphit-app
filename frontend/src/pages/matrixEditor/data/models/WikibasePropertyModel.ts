export interface WikibasePropertyModel {
	propertyId: string;
	name: string;
}

export const MATRIX_PROPERTIES = [
	{
		propertyId: "P3",
		name: "Test: Property 3",
	},
	{
		propertyId: "P12",
		name: "Has completed",
	},
];

export const getWikibasePropertyById = (
	propertyId: string
): WikibasePropertyModel | undefined => {
	return MATRIX_PROPERTIES.find(
		(property) => property.propertyId === propertyId
	);
};
