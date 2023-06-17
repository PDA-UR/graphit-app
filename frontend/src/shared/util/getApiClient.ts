import { ApiClient } from "../client/ApiClient";
import { getEnvVar } from "./Env";

export const createApiClient = () => {
	const isProduction = getEnvVar("PROD");
	const api = new ApiClient({
		baseURL: isProduction ? "/" : "http://localhost:8081",
	});
	return api;
};
