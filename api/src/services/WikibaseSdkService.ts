import { Inject, Service } from "@tsed/di";
import WBK, { EntityId, Wbk } from "wikibase-sdk";
import { SessionService } from "./SessionService";
import { Credentials } from "../models/CredentialsModel";
import { SparqlQueryTemplateService } from "./sparql/SparqlQueriesService";
import { SparqlResult } from "../models/SparqlResultModel";
import { PropertyModel } from "../models/PropertyModel";

@Service()
export class WikibaseSdkService extends SessionService<Wbk> {
	@Inject(SparqlQueryTemplateService)
	templateService: SparqlQueryTemplateService;

	protected createSessionData(): Wbk {
		const wbk = WBK({
			sparqlEndpoint: this.info.sparqlEndpoint,
			instance: this.info.instance,
		});
		return wbk;
	}

	async query(credentials: Credentials, query: string): Promise<SparqlResult> {
		const wbk = this.getSessionData(credentials);
		const url = wbk.sparqlQuery(query);
		const headers = {};

		const response = await fetch(url, { headers });
		const data = await response.json();
		return { data };
	}

	async getEntities(
		credentials: Credentials,
		ids: EntityId[]
	): Promise<SparqlResult> {
		const wbk = this.getSessionData(credentials);
		const url = wbk.getEntities({ ids });
		const headers = {};

		const response = await fetch(url, { headers });
		const data = await response.json();
		return { data };
	}

	async getClaims(credentials: Credentials, id: EntityId): Promise<any> {
		const wikibaseResponse = await this.getEntities(credentials, [id]),
			entities = wikibaseResponse.data.entities,
			entity = entities[id];

		return entity.claims;
	}

	async getClaim(
		credentials: Credentials,
		entityId: EntityId,
		claimId: string
	) {
		try {
			const claims = await this.getClaims(credentials, entityId),
				claim = claims[claimId];
			this.logger.info(claims, claim);
			return claim;
		} catch {
			return undefined;
		}
	}

	async getWikibasePageContent(
		credentials: Credentials,
		title: string
	): Promise<string> {
		const urlParams = new URLSearchParams({
			action: "parse",
			page: title,
			prop: "wikitext",
			formatversion: "2",
			format: "json",
		});

		const url = `${this.info.instance}/w/api.php?${urlParams.toString()}`;
		this.logger.info("api url to fetch page content", url);
		try {
			const response = await fetch(url);
			this.logger.info("response from page content", response);
			const json = await response.json();
			return json.parse.wikitext;
		} catch (error) {
			this, this.logger.error("error", error);
			return Promise.reject(error);
		}
	}

	private async parseUserItemId(userPageContent: string): Promise<string> {
		const regex = /\[\[Item:Q\d+(\|.*)?\]\]/g;

		const matches = userPageContent.match(regex);
		if (matches) {
			const userId = matches[0]
				.replace("[[Item:", "")
				.replace("]]", "")
				// remove alias if present
				.split("|")[0];
			return userId;
		}

		return "";
	}

	async getUserItemId(credentials: Credentials): Promise<string> {
		const htmlUserPage = await this.getWikibasePageContent(
			credentials,
			"User:" + credentials.username
		);
		const userItemId = await this.parseUserItemId(htmlUserPage);
		return userItemId;
	}

	async getProperties(): Promise<Array<PropertyModel>> {
		const wikibaseUrl = this.info.instance;

		const buildUrlParams = () =>
			new URLSearchParams({
				action: "query",
				generator: "allpages",
				gapnamespace: "122",
				prop: "entityterms",
				wbetterms: "label",
				formatversion: "2",
				format: "json",
			});

		const buildFullUrl = (gapcontinue?: string, _continue?: string) => {
			const urlParams = buildUrlParams();
			if (gapcontinue && _continue) {
				urlParams.append("gapcontinue", gapcontinue);
				urlParams.append("continue", _continue);
			}
			return `${wikibaseUrl}/w/api.php?${urlParams.toString()}`;
		};

		const properties: Array<PropertyModel> = [];

		let gapcontinue: string | undefined = undefined;
		let _continue: string | undefined = undefined;

		do {
			const url = buildFullUrl(gapcontinue, _continue);
			this.logger.info("api url to fetch properties", url);
			const response = await fetch(url);
			this.logger.info("response from properties", response);
			const json = await response.json();
			const pages = json.query?.pages;
			if (pages) {
				const newProperties = Object.keys(pages).map((key) => {
					const page = pages[key];
					const property: PropertyModel = {
						propertyId: page.title.split(":")[1],
						label: page.entityterms.label[0],
						url: `${wikibaseUrl}/wiki/${page.title}`,
					};
					return property;
				});
				properties.push(...newProperties);
			}
			gapcontinue = json.continue?.gapcontinue;
			_continue = json.continue?.continue;
		} while (gapcontinue && _continue);

		return properties.sort((a, b) => {
			const aId = parseInt(a.propertyId.replace("P", ""));
			const bId = parseInt(b.propertyId.replace("P", ""));
			return aId - bId;
		});
	}

	// ~~~~~~~~~~ Pre built queries: ~~~~~~~~~ //

	async getUserGraph(
		credentials: Credentials,
		userId: string
	): Promise<SparqlResult> {
		const query = this.templateService.getUserGraph(userId);
		return this.query(credentials, query);
	}

	async getCategories(credentials: Credentials): Promise<SparqlResult> {
		const query = this.templateService.getCategoriesQuery();
		return this.query(credentials, query);
	}

	async getResources(
		credentials: Credentials,
		userId: string
	): Promise<SparqlResult> {
		const query = this.templateService.getResources(userId);
		return this.query(credentials, query);
	}
}
