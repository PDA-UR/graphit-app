import { Credentials } from "../WikibaseEditConfig";
import { loginHtml } from "../ui/LoginModule/LoginModule";

const getCredentialsFromLocalStorage = (): Credentials | null => {
	const username = localStorage.getItem("username");
	const password = localStorage.getItem("password");
	if (!username || !password) {
		return null;
	}
	return {
		username,
		password,
	};
};
export const getCredentials = (errMsg:string=""): Credentials => {
	console.log("old creds");
	const username = prompt(`${errMsg}\nEnter your username`);
	if (!username) {
		return getCredentials(errMsg);
	}
	const password = prompt("Enter your password");
	if (!password) {
		return getCredentials(errMsg);
	}

	return {
		username,
		password,
	};
};
