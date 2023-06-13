export function hasProperties<T>(
	object: any,
	properties: string[]
): object is T {
	return properties.every((property) => property in object);
}
