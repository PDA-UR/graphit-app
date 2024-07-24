# Graphit App

Frontend + API server for the GraphIT project.

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
   2. visit (http://localhost:8081/app for the webapp, http://localhost:8081/doc for the api docs)

## Deployment

The app is automatically built and deployed via GitHub actions:
- push to `dev` branch: https://test.graphit.ur.de/app
- push to `main` branch: https://graph.graphit.ur.de/app

To test before deployment:
- in /frontend: `npm run build` then `npm run preview`
- in /backend: `npm run build` then `npm run start` (requires *@tsed/cli* see: [below](#notebuild-api))

#### Note:build api
- to build the api you need to `npm install -g @tsed/cli`
- then you can `npm run build` in the api directory (see: *api/package.json*)
- NOTE: (as of 24.07.2024)
  - the latest release (5.2.1) of the cli produced: `Error [ERR_REQUIRE_ESM]`
  - to fix this the Dockerfile currently installs the the 5.2.0 version, i.e: `npm install -g @tsed/cli@5.2.0`
  - also do this locally, if it's an issue for you