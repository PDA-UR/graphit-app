# GraphIT - Database API

The API server for the GraphIT database.

## Getting started

Read and Write operations of the are performed using [wikibase-sdk](https://github.com/maxlath/wikibase-sdk) and a modified [version](https://github.com/PDA-UR/wikibase-edit-retry) of [wikibase-edit](https://github.com/maxlath/wikibase-edit) (shorter default retry delay)


### Environment

This project requires a `.env` file in the root directory. You can use the `.env.example` file as a template. 
For deployment the file gets created using github actions, BUT: the file does currently not get updated on the server.
- found at `var/www/hooks/graphit-app/.env`
- update manually to include new variables
- then afterwards run `deploy.sh` (in the same folder) to recreate to container.
- as of 29.07.2024 



