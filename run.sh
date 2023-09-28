#! /bin/bash

# Runs the docker container built with build.sh
# Can be used for testing the build locally

export ENV_FILE="$1"
export VERSION="$2"
export NAME=graphit-app

if  [ -z "$VERSION" ] || [ -z "$ENV_FILE" ]
then
    echo "Please provide ENV_FILE and VERSION as arguments"
    exit 1
fi

docker-compose up