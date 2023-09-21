#! /bin/bash

USERNAME=$1
TOKEN=$2
export ENV_FILE="$3"

export VERSION=$4
export NAME=graphit-app


if [ -z "$USERNAME" ] || [ -z "$TOKEN" ] || [ -z "$ENV_FILE" ] || [ -z "$VERSION" ]
then
    echo "Please provide username, token, env file and version as args"
    exit 1
fi

docker-compose build server
docker tag graphit-app "ghcr.io/alexw00/graphit-app:$VERSION"