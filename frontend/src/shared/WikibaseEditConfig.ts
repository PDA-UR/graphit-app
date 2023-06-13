import { getEnvVar } from "./util/Env";

export type Credentials = {
	username: string;
	password: string;
};

export const wikibaseEditConfig = (credentials: Credentials) => ({
	instance: getEnvVar("VITE_WIKIBASE_INSTANCE"),
	wgScriptPath: "/w",
	// One authorization mean is required (unless in anonymous mode, see below)
	credentials: {
		username: credentials.username,
		password: credentials.password,
	},
	anonymous: false,
	summary: "edit from property editor",
	// See https://www.mediawiki.org/wiki/Manual:Tags
	// Default: on Wikidata [ 'WikibaseJS-edit' ], empty for other Wikibase instances
	// tags: ["Some general tag"],

	// Default: `wikidata-edit/${pkg.version} (https://github.com/maxlath/wikidata-edit)`
	userAgent: `property-editor/${APP_VERSION} (`,
	// See https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
	// Default: 5
	maxlag: 2,
});
