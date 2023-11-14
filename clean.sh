#!/bin/bash -e
docker-compose down -v --remove-orphans
docker-compose rm -fv
docker image rm orchestracities/configuration-api 
docker image rm orchestracities/management-ui
docker image rm orchestracities/anubis-management-api:master

rm -rf keycloak
rm -rf opa-service
