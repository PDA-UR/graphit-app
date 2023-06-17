import { join } from "path";
import { Configuration, Inject } from "@tsed/di";
import { PlatformApplication } from "@tsed/common";
import "@tsed/platform-express"; // /!\ keep this import
import "@tsed/ajv";
import "@tsed/swagger";
import { config } from "./config/index";
import * as rest from "./controllers/rest/index";
import { Env } from "@tsed/core";
import cors from "cors";
import session from "express-session";
import { CreateRequestSessionMiddleware } from "./middlewares/CreateRequestSessionMiddleware";

export const rootDir = __dirname;
export const isProduction = process.env.NODE_ENV === Env.PROD;

const whitelist = [
	"http://localhost:5173",
	"http://localhost:4173",
	"http://localhost:8083",
];
const corsOptions = {
	credentials: true,
	origin: function (origin, callback) {
		console.log(origin);
		if (whitelist.indexOf(origin) !== -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error("Domain not allowed by CORS"));
		}
	},
};

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
	swagger: [
		{
			path: "/doc",
			specVersion: "3.0.1",
			outFile: `../${rootDir}/out/api/swagger.json`,
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
	views: {
		root: join(`${rootDir}/views`),
		extensions: {
			ejs: "ejs",
		},
	},
	exclude: ["**/*.spec.ts"],
	logger: {
		disableRoutesSummary: isProduction, // remove table with routes summary
	},
	instance: isProduction ? process.env.PROD_INSTANCE : process.env.DEV_INSTANCE,
})
export class Server {
	@Inject()
	protected app: PlatformApplication;

	@Configuration()
	protected settings: Configuration;

	public $beforeRoutesInit(): void | Promise<any> {
		this.app.getApp().set("trust proxy", 1); // trust first proxy
	}
}
