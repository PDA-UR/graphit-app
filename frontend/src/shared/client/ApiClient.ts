export interface UserSessionModel {
  /** @minLength 1 */
  username: string;
  /** @minLength 1 */
  password: string;
  /** @minLength 1 */
  userItemId: string;
}

export interface CredentialsModel {
  /** @minLength 1 */
  username: string;
  /** @minLength 1 */
  password: string;
}

export interface CreateClaimModel {
  /**
   * @minLength 1
   * @pattern [PQ]\d{1,5}
   */
  property: string;
  /** @minLength 1 */
  value: string;
  rank?: "preferred" | "normal" | "deprecated";
  qualifiers?: Record<string, any>;
}

export interface UpdateClaimModel {
  /**
   * @minLength 1
   * @pattern [PQ]\d{1,5}
   */
  property: string;
  /** @minLength 1 */
  oldValue: string;
  /** @minLength 1 */
  newValue: string;
}

export interface SparqlResultModel {
  data: Record<string, any>;
}

export interface ServerInfoModel {
  /** @minLength 1 */
  instance: string;
  /** @minLength 1 */
  sparqlEndpoint: string;
  isProduction: boolean;
  /** @minLength 1 */
  version: string;
}

import axios, {
	AxiosInstance,
	AxiosRequestConfig,
	HeadersDefaults,
	ResponseType,
} from "axios";

import tough from "tough-cookie";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";

const cookieJar = new tough.CookieJar();
axios.defaults.jar = cookieJar;
axios.defaults.withCredentials = true;

const jar = new CookieJar();

const createAxiosInstance = (config: AxiosRequestConfig) => {
	const jar = new CookieJar();
	return wrapper(axios.create({ ...config, jar }));
};

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({ securityWorker, secure, format, ...axiosConfig }: ApiConfig<SecurityDataType> = {}) {
    this.instance = createAxiosInstance(axiosConfig);
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(params1: AxiosRequestConfig, params2?: AxiosRequestConfig): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method && this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] = property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem));
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<T> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (type === ContentType.FormData && body && body !== null && typeof body === "object") {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (type === ContentType.Text && body && body !== null && typeof body !== "string") {
      body = JSON.stringify(body);
    }

    return this.instance
      .request({
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
        },
        params: query,
        responseType: responseFormat,
        data: body,
        url: path,
      })
      .then((response) => response.data as T);
  };
}

/**
 * @title Api documentation
 * @version 1.0.0
 */
export class ApiClient<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  auth = {
    /**
     * @description Returns the current session
     *
     * @tags Auth
     * @name WhoAmI
     * @request GET:/api/auth/whoami
     */
    whoAmI: (params: RequestParams = {}) =>
      this.request<UserSessionModel, string>({
        path: `/api/auth/whoami`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Login to the API (using Wikibase credentials)
     *
     * @tags Auth
     * @name Login
     * @request POST:/api/auth/login
     */
    login: (data: CredentialsModel, params: RequestParams = {}) =>
      this.request<string, string | UserSessionModel>({
        path: `/api/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Logout from the API (using Wikibase credentials)
     *
     * @tags Auth
     * @name Logout
     * @request POST:/api/auth/logout
     */
    logout: (params: RequestParams = {}) =>
      this.request<string, string>({
        path: `/api/auth/logout`,
        method: "POST",
        ...params,
      }),
  };
  claim = {
    /**
     * @description Create a claim
     *
     * @tags Claim
     * @name Create
     * @request POST:/api/claim/{id}/create
     */
    create: (id: string, data: CreateClaimModel, params: RequestParams = {}) =>
      this.request<string, string>({
        path: `/api/claim/${id}/create`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update a claim
     *
     * @tags Claim
     * @name Update
     * @request POST:/api/claim/{id}/update
     */
    update: (id: string, data: UpdateClaimModel, params: RequestParams = {}) =>
      this.request<string, string>({
        path: `/api/claim/${id}/update`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  entity = {
    /**
     * @description Retrieve all entities with the given ids. The ids should be separated by a |
     *
     * @tags Entity
     * @name Entities
     * @request GET:/api/entity/{ids}
     */
    entities: (ids: string, params: RequestParams = {}) =>
      this.request<SparqlResultModel, string>({
        path: `/api/entity/${ids}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve all claims for the given entity
     *
     * @tags Entity
     * @name Claims
     * @request GET:/api/entity/{id}/claims
     */
    claims: (id: string, params: RequestParams = {}) =>
      this.request<Record<string, any>, string>({
        path: `/api/entity/${id}/claims`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Create a claim (fails if it already exists)
     *
     * @tags Entity
     * @name CreateClaim
     * @request POST:/api/entity/{id}/createClaim
     */
    createClaim: (id: string, data: CreateClaimModel, params: RequestParams = {}) =>
      this.request<string, string>({
        path: `/api/entity/${id}/createClaim`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * @description Update a claim (fails if it doesn't exist)
     *
     * @tags Entity
     * @name UpdateClaim
     * @request POST:/api/entity/{id}/updateClaim
     */
    updateClaim: (id: string, data: UpdateClaimModel, params: RequestParams = {}) =>
      this.request<string, string>({
        path: `/api/entity/${id}/updateClaim`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  example = {
    /**
     * @description Greets you with a hello message
     *
     * @tags Example
     * @name Hello
     * @request GET:/api/example/hello
     */
    hello: (
      query: {
        name: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<string, any>({
        path: `/api/example/hello`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description Info about the server and env vars
     *
     * @tags Example
     * @name Info
     * @request GET:/api/example/info
     */
    info: (params: RequestParams = {}) =>
      this.request<ServerInfoModel, any>({
        path: `/api/example/info`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  sparql = {
    /**
     * @description Execute a sparql query
     *
     * @tags Sparql
     * @name Query
     * @request POST:/api/sparql/query/{sparql}
     */
    query: (sparql: string, params: RequestParams = {}) =>
      this.request<SparqlResultModel, string>({
        path: `/api/sparql/query/${sparql}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve all categories in the wiki
     *
     * @tags Sparql
     * @name Categories
     * @request POST:/api/sparql/categories
     */
    categories: (params: RequestParams = {}) =>
      this.request<SparqlResultModel, string>({
        path: `/api/sparql/categories`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve the users graph (learning contents, completions, etc.)
     *
     * @tags Sparql
     * @name UserGraph
     * @request POST:/api/sparql/userGraph
     */
    userGraph: (params: RequestParams = {}) =>
      this.request<SparqlResultModel, string>({
        path: `/api/sparql/userGraph`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * @description Set an item as completed or uncompleted
     *
     * @tags User
     * @name Complete
     * @request POST:/api/user/{userId}/completed/{entityIds}/set/{isCompleted}
     */
    complete: (userId: string, entityIds: any[], isCompleted: boolean, params: RequestParams = {}) =>
      this.request<Record<string, any>, string>({
        path: `/api/user/${userId}/completed/${entityIds}/set/${isCompleted}`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
}
