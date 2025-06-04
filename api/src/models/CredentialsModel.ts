import { Unauthorized } from "@tsed/exceptions";
import { Property, Required } from "@tsed/schema";

/**
 * Credentials of a user.
 */
export class Credentials {
	@Required()
	@Property()
	username: string;

	@Required()
	@Property()
	password: string;
}

export class UserRightsProperties {
	@Property()
	isAdmin: boolean;

	@Property()
	userQID: string;
}

export class EditingFlags {
	@Property()
	canEditItem: boolean;

	@Property()
	isStudentSuggestion: boolean;
}

export const isValid = (credentials: Credentials): boolean => {
	return (
		credentials.username !== undefined &&
		credentials.password !== undefined &&
		credentials.username !== "" &&
		credentials.password !== ""
	);
};


// Don't allow a demo user to edit the graph
export const isDemo = (credentials: Credentials): boolean => {
	return (
		credentials.username == "Max Mustermann"
	);
};

/**
 * Check the groups a user is part of to determine their editing rights
 * NOTE: Add additional groups here to extend editing rights
 * @param groups Array of groups from the GET request
 * @returns 
 */
export const checkGroupsForRights = (groups: Array<string>): boolean => {
	let isAdmin = false;
	if (groups.includes("sysop")) {
		isAdmin = true;
	}
	return isAdmin;
}

/**
 * Check wether a user has the permission to make changes to an item
 * @param isAdmin Session rights
 * @param userQID the QID of the wikibase user item of the user
 * @param itemQID the QID of the item the user wants to edit
 * @param isIncluded whether the item is "included in" a course the user "participates in"
 * @returns A flag for editingRights and a flag for denoting a students addition (e.g. to a course)
 */
export const hasEditingPermission = (
	isAdmin: boolean, 
	userQID: string, 
	itemQID: string,
	isIncluded: boolean | Unauthorized,
): EditingFlags => {
	let hasPermission = false;
	let studentFlag = false;

	if (isAdmin || userQID === itemQID) {
		hasPermission = true;
	}
	else {
		if (isIncluded) {
			hasPermission = true;
			studentFlag = true;
		}
	}
	const result :EditingFlags = {canEditItem: hasPermission, isStudentSuggestion: true}
	return result;
}
