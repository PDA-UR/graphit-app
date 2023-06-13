# GraphIT - Database API

The API server for the GraphIT database.

## Getting started

### Environment

This project requires a `.env` file in the root directory. You can use the `.env.example` file as a template.

### Building

> **Important!** Ts.ED requires Node >= 14, Express >= 4 and TypeScript >= 4.

```batch
# install dependencies
$  install

# serve
$  start

# build for production
$  build
$  start:prod
```

## Docker

```
# build docker image
docker compose build

# start docker image
docker compose up
```

## Barrelsby

This project uses [barrelsby](https://www.npmjs.com/package/barrelsby) to generate index files to import the controllers.

Edit `.barreslby.json` to customize it:

```json
{
	"directory": ["./src/controllers/rest", "./src/controllers/pages"],
	"exclude": ["__mock__", "__mocks__", ".spec.ts"],
	"delete": true
}
```
