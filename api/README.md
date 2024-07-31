# GraphIT - Database API

The API server for the GraphIT database.

## Getting started

### Environment

This project requires a `.env` file in the root directory. You can use the `.env.example` file as a template. 
For deployment the file gets created using github actions, BUT the file does not get updated on the server.
- found at `var/www/hooks/graphit-app/.env`
- update manually to include new variables
- then afterwards run `deploy.sh` (in the same folder) to recreate to container.
- as of 29.07.2024 



