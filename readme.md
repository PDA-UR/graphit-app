# Graphit App

> Frontend + API server for the [GraphIT](https://graphit.ur.de/wiki/Main_Page) project.

The project investigates how dependency graphs can be used to model courses, curricula, and personal learning progress. The initial focus lies on courses in higher education. The prototype is built on [Wikibase](https://wikiba.se), the knowledge-graph platform powering [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page). 

This repo hosts several frontends to make accessing and modifying the dependency graph easier (see: frontend readme).

### Installation
```
git clone https://github.com/PDA-UR/graphit-app.git

cd graphit-app
npm i
```

## Development

1. download this .env file: https://files.mi.ur.de/smart-link/5001176f-e783-45c8-ae85-65895895cab1/
2. save it in `api/.env`.
   1. (set `DEV_INSTANCE` in the env file also to `https://graphit.ur.de` if you don't have to run Wikibase locally)
   2. however, note that you will work with the LIVE wikibase instance, so be careful not to mess up the data there
3. run `npm run dev` in the project root directory to start the api and the webapp
   1. to run on Windows: 
      1. navigate to /api and run `npm run dev`
      2. open a second Terminal and navigate to /frontend. Run `npm run dev` there as well
      3. Alternative: replace the dev script in the package.json file (root) with `"start npm run dev --workspace=api & start npm run dev --workspace=frontend"`
      4. Alternative: run the app on `wsl` (not tested)
4. visit (http://localhost:8081/app for the webapp, http://localhost:8081/doc for the api docs)

## Deployment

The app is automatically built and deployed via GitHub actions:
- push to `dev` branch: https://test.graphit.ur.de/app
- push to `main` branch: https://graph.graphit.ur.de/app

#### To test before deployment:
Local:
- Windows
  - in /frontend: `npm run build` then `npm run preview`
    - if you want to preview in a specific port: add `preview: { port: 8081},` to the `vite.config.js`-options
  - in /api: `npm run build` then `npm run start` (requires *@tsed/cli* see: [below](#notebuild-api))
- Linux
  - in root-folder: `npm run build`

Docker:
  - run `docker build -t graphit .` in the root folder (alt: docker build --no-cache -t graphit .) and run the container on ports "8081:8081" (see docker-compose.yml)
  - or use use the `run.sh` (e.g. *run.sh ./api/.env 1*) (same links as in development)

---

### Additional Notes

### Login Requirements
  - a GraphIT-Account
  - a [User Item](https://graphit.ur.de/wiki/Item:Q157), with statements
    - *participates in* `<CourseID>` - if not: defaults to the first existing course alphabetically
    - *instance of* `<Student/Admin>`  - if not: defaults to *Student*
  - a [User-Page](https://graphit.ur.de/wiki/User:Max_Mustermann) with a link to the User Item

### Match label
This is an option that can be used when creating an item to be added to a column. Open the "Create a new Item" Menu via the <kbd>></kbd> button on the top left or <kbd>CTRL+<kbd>.
- Uses a SPARQL query to match Regex Strings to item Labels in the database
  - [Documentation](https://en.wikibooks.org/wiki/SPARQL/Expressions_and_Functions#REGEX)
  - The regex is case insensitive, but requires escaping the "\" backslash
  - Escaping is done automatically in the frontend before making the API call!
  - e.g. Find Items with "ER" at the start
    -  `^(er)\w+` **won't** work
    -  `^(er)\\w+` works
-  The query is hardcoded (in the frontend) to return only the first 5 results, to save time and resources

### Development

#### Add a new Page
  - add the `frontend/newSection/index.html` to the rollupOptions { input {...} } in `vite.config.js`
  - add a link to the `frontend/index.html`-hub-page

#### Add a SPARQL-Query
  - `SparqlQueryService.ts`: add query as string + "get-function"
  - `WikibaseSdkService.ts`: add pre-build query function
  - `SparqlContoller.ts`: add request function
  - `ApiClient.ts`: add request to backend
  - `WikibaseClient.ts`: add operation function 

#### .env
The env currently needs to be manually deployed and changed. For further information see the README.md of `/api`.

#### api build 
- to build the api locally you need to install the *@tsed/cli*
  - install this in the root or api folder with `npm i @tsed/cli@5.2.0 --no-save` (make sure the install does not change the `package(-lock).json`)
  - then you can `npm run build` in the root or api directory (see: *api/package.json*)
- or build with docker
- NOTE: (as of *07.01.2025*)
  - the api still runs as a "commonjs"-module
  - *@tsed* has shifted to support esm only with v8
  - the @tsed/cli will install the recent version of several @tsed/packages as the dependencies are listed with **>=** in its `package.json`
  - this will give a "ERR_REQUIRE_ESM"-error as the cjs-version of the package will try to *require()* esm-only packages
  - the cli should be installed separately and *extraneous*ly, so that it does not install any @tsed/packages with a higher version than the ones used in the project
  - *In other words:* The `api` currently uses the @tsed-version: "7.14.2" (pre esm-only), these packages are installed via the regular `npm i`. @tsed/cli is installed afterwards (for build purposes only) and uses the same packages. If they don't exist previously it will install the needed @tsed-dependencies with the wrong versions for this project (i.e. installs the esm-only versions)
- why @tsed/cli@5.2.0:
  - the 5.2.1 release of the cli produced: `Error [ERR_REQUIRE_ESM]`
  - to fix this the Dockerfile currently installs the the 5.2.0 version, i.e: `npm install -g @tsed/cli@5.2.0`
  - also do this locally, if it's an issue for you
  - package switched to esm-only with v6.0.0

Possible next steps: update the api to esm-only to be able to use the latest version of @tsed 
