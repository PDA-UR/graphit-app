import { Service } from "@tsed/di";
import wbEdit from "wikibase-edit-retry";
import { Credentials } from "../models/CredentialsModel";
import { SessionService } from "./SessionService";

@Service()
export class WikibaseEditService extends SessionService<any> {
	private wikibaseEditConfig = (credentials: Credentials) => ({
		instance: this.info.instance,
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
		userAgent: `wikibase-api/${this.info.version}`,
		// See https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
		// Default: 5
		maxlag: 2,
	});

	createSessionData(credentials: Credentials) {
		const config = this.wikibaseEditConfig(credentials),
			session = wbEdit(config);
		return session;
	}
}
