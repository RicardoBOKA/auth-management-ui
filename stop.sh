#!/bin/bash -e
if [[ $1 == "dev" ]]; then
    docker-compose -f docker-compose-dev.yml down -v
else
    docker-compose down -v
fi
