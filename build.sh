#! /bin/bash

# Builds a docker container containing frontend and backend
# and tags it with the given version.

# USED IN GITHUB ACTION

export VERSION=$1
export ENV_FILE="$2"
export NAME=graphit-app


if [ -z "$VERSION" ] || [ -z "$ENV_FILE" ]
then
    echo "Please provide version and env file as args"
    exit 1
fi

docker compose build server
docker tag "graphit-app:$VERSION" "ghcr.io/pda-ur/graphit-app:$VERSION"