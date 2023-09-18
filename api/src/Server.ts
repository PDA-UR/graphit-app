import { join } from "path";
import { Configuration, Inject } from "@tsed/di";
import { PlatformApplication, Res } from "@tsed/common";
import "@tsed/platform-express"; // /!\ keep this import
import "@tsed/ajv";
import "@tsed/swagger";
import { config } from "./config/index";
import * as rest from "./controllers/rest/index";
import { Env } from "@tsed/core";
import cors from "cors";
import session from "express-session";
import { CreateRequestSessionMiddleware } from "./middlewares/CreateRequestSessionMiddleware";
import { ServerResponse } from "http";
import send from "send";

export const rootDir = __dirname;
export const REPO_DIR = __dirname.endsWith("dist")
	? join(__dirname, "../../..")
	: join(__dirname, "../..");
export const isProduction = process.env.NODE_ENV === Env.PROD;

console.log("DIRNAME", rootDir, REPO_DIR);
const whitelist = [
	"http://localhost:5173", // VITE Dev server
	"http://localhost:4173",
	"http://localhost:8081",
	"http://0.0.0.0:8081/",
	"https://graph.graphit.ur.de/",
	"http://graph.graphit.ur.de/",
	"https://test.graphit.ur.de/",
	"http://graph.graphit.ur.de/",
];
const corsOptions = {
	credentials: true,
	origin: function (origin, callback) {
		if (whitelist.indexOf(origin) !== -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error("Domain not allowed by CORS"));
		}
	},
};

function setCustomCacheControl(res: ServerResponse, path: string) {
	if (send.mime.lookup(path) === "text/html") {
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		res.setHeader("Pragma", "no-cache");
		res.setHeader("expires", "0");
	}
}

@Configuration({
	...config,
	isProduction,
	acceptMimes: ["application/json", "text/html", "text/plain"],
	httpPort: process.env.PORT || 8083,
	httpsPort: isProduction, // CHANGE in PROD
	disableComponentsScan: true,
	mount: {
		"/api": [...Object.values(rest)],
	},
	statics: {
		"/app": [
			{
				root: join(REPO_DIR, "out/frontend/dist"),
				maxAge: "1d",
				setHeaders: setCustomCacheControl,
			},
		],
	},
	swagger: [
		{
			path: "/doc",
			specVersion: "3.0.1",
			outFile: join(REPO_DIR, "out/api/swagger.json"),
			// showExplorer: true, // display search bar
		},
	],
	middlewares: [
		cors(corsOptions),
		"cookie-parser",
		"compression",
		"method-override",
		"json-parser",
		{ use: "urlencoded-parser", options: { extended: true } },
		session({
			secret: process.env.SESSION_SECRET as string,
			resave: false,
			saveUninitialized: false,
			// cookie: { secure: true },
		}),
		CreateRequestSessionMiddleware,
	],
	exclude: ["**/*.spec.ts"],
	logger: {
		disableRoutesSummary: isProduction, // remove table with routes summary
	},
	instance: isProduction ? process.env.PROD_INSTANCE : process.env.DEV_INSTANCE,
	sparqlEndpoint: isProduction
		? process.env.PROD_SPARQL_ENDPOINT
		: process.env.DEV_SPARQL_ENDPOINT,
})
export class Server {
	@Inject()
	protected app: PlatformApplication;

	@Configuration()
	protected settings: Configuration;

	public $beforeRoutesInit(): void | Promise<any> {
		this.app.getApp().set("trust proxy", 1); // trust first proxy
	}

	$afterRoutesInit() {
		this.app.get(`/app/*`, (req: any, res: Res) => {
			console.log("req.url", req.url);
			res.sendFile(join(REPO_DIR, "out/frontend/dist/index.html"));
		});
	}
}
