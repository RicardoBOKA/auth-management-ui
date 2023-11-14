#!/bin/bash -e

rep=$(curl -s --unix-socket /var/run/docker.sock http://ping > /dev/null)
status=$?

if [ $status -eq 7 ]; then
    echo 'docker is not running - test will not be executed'
    exit 1
fi

echo "Downloading Keycloak scripts..."
mkdir -p keycloak
cd keycloak
wget https://github.com/orchestracities/keycloak-scripts/releases/download/v0.0.6/oc-custom.jar -O oc-custom.jar
wget https://raw.githubusercontent.com/orchestracities/keycloak-scripts/master/realm-export-empty.json -O realm-export.json
cd ..

# echo "Increase keycloak session duration to 36000"
# sed 's/1800/36000/' keycloak/realm-export.json > keycloak/realm-export.json

echo "Downloading opa-service config..."
mkdir -p opa-service
cd opa-service
wget https://raw.githubusercontent.com/orchestracities/anubis/master/config/opa-service/default_policies.ttl -O default_policies.ttl
wget https://raw.githubusercontent.com/orchestracities/anubis/master/config/opa-service/default_wac_config.yml -O default_wac_config.yml
cd ..

echo "Deploying services via Docker Compose..."
if [[ $1 == "dev" ]]; then
    docker-compose -f docker-compose-dev.yml up -d
else
    docker-compose up -d
fi

wait=0
while ! nc -z localhost 27017 && $wait -le 60;
do
  echo "Waiting for MongoDB..."
  sleep 5
  wait=$((wait+5))
  echo "Elapsed time: $wait"
done

wait=0
HOST="http://localhost:8080"
while [ "$(curl -s -o /dev/null -L -w ''%{http_code}'' $HOST)" != "200" ] && [ $wait -le 60 ]
do
  echo "Waiting for Keycloak..."
  sleep 5
  wait=$((wait+1))
  echo "Elapsed time: $wait"
done

wait=0
HOST="http://localhost:8085"
while [ "$(curl -s -o /dev/null -L -w ''%{http_code}'' $HOST)" != "200" ] && [ $wait -le 60 ]
do
  echo "Waiting for Anubis API..."
  sleep 5
  wait=$((wait+1))
  echo "Elapsed time: $wait"
done

if [ $wait -gt 60 ]; then
  echo "timeout while waiting services to be ready"
  if [[ $1 == "dev" ]]; then
      docker-compose -f docker-compose-dev.yml down -v
  else
      docker-compose down -v
  fi
  exit -1
fi

echo "Obtaining token from Keycloak..."

export json=$( curl -sS --location --request POST 'http://localhost:8080/realms/default/protocol/openid-connect/token' \
--header 'Host: keycloak:8080' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'username=admin@mail.com' \
--data-urlencode 'password=admin' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'client_id=configuration')

export token=$( jq -r ".access_token" <<<"$json" )

echo ""
echo "decoded token:"
echo ""

jq -R 'split(".") | .[1] | @base64d | fromjson' <<< $( jq -r ".access_token" <<<"$json" )

echo ""
echo "Setting up tenant Tenant1..."
echo ""
curl -s -i -X 'POST' \
  'http://127.0.0.1:8085/v1/tenants/' \
  -H 'accept: */*' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Tenant1"
}'

echo ""
echo "Setting up tenant Tenant2..."
echo ""

curl -s -i -X 'POST' \
  'http://127.0.0.1:8085/v1/tenants/' \
  -H 'accept: */*' \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Tenant2"
}'

echo ""
echo "Setting up policy that allows creating entities under tenant Tenant1 and path / ..."
echo ""

curl -s -i -X 'POST' \
'http://127.0.0.1:8085/v1/policies/' \
-H 'accept: */*' \
-H "Authorization: Bearer $token" \
-H 'fiware-service: Tenant1' \
-H 'fiware-servicepath: /' \
-H 'Content-Type: application/json' \
-d '{
"access_to": "*",
"resource_type": "entity",
"mode": ["acl:Write"],
"agent": ["acl:AuthenticatedAgent"]
}'

curl -s -i -X 'POST' \
'http://127.0.0.1:8085/v1/policies/' \
-H 'accept: */*' \
-H "Authorization: Bearer $token" \
-H 'fiware-service: Tenant1' \
-H 'fiware-servicepath: /' \
-H 'Content-Type: application/json' \
-d '{
"access_to": "*",
"resource_type": "entity",
"mode": ["acl:Control"],
"agent": ["acl:AuthenticatedAgent"]
}'

curl -s -i -X 'POST' \
'http://127.0.0.1:8085/v1/policies/' \
-H 'accept: */*' \
-H "Authorization: Bearer $token" \
-H 'fiware-service: Tenant1' \
-H 'fiware-servicepath: /' \
-H 'Content-Type: application/json' \
-d '{
"access_to": "*",
"resource_type": "policy",
"mode": ["acl:Read"],
"agent": ["acl:AuthenticatedAgent"]
}'

curl -s -i -X 'POST' \
'http://127.0.0.1:8085/v1/policies/' \
-H 'accept: */*' \
-H "Authorization: Bearer $token" \
-H 'fiware-service: Tenant1' \
-H 'fiware-servicepath: /' \
-H 'Content-Type: application/json' \
-d '{
"access_to": "*",
"resource_type": "policy",
"mode": ["acl:Write"],
"agent": ["acl:AuthenticatedAgent"]
}'

curl -s -i -X 'POST' \
'http://127.0.0.1:8085/v1/policies/' \
-H 'accept: */*' \
-H "Authorization: Bearer $token" \
-H 'fiware-service: Tenant1' \
-H 'fiware-servicepath: /' \
-H 'Content-Type: application/json' \
-d '{
"access_to": "Tenant1",
"resource_type": "tenant",
"mode": ["acl:Read"],
"agent": ["acl:AuthenticatedAgent"]
}'

curl -s -i -X 'POST' \
'http://127.0.0.1:8085/v1/policies/' \
-H 'accept: */*' \
-H "Authorization: Bearer $token" \
-H 'fiware-service: Tenant1' \
-H 'fiware-servicepath: /' \
-H 'Content-Type: application/json' \
-d '{
"access_to": "Tenant1",
"resource_type": "tenant",
"mode": ["acl:Write"],
"agent": ["acl:AuthenticatedAgent"]
}'

curl -s -i -X 'POST' \
'http://127.0.0.1:8085/v1/policies/' \
-H 'accept: */*' \
-H "Authorization: Bearer $token" \
-H 'fiware-service: Tenant1' \
-H 'fiware-servicepath: /' \
-H 'Content-Type: application/json' \
-d '{
"access_to": "/",
"resource_type": "service_path",
"mode": ["acl:Read"],
"agent": ["acl:AuthenticatedAgent"]
}'

curl -s -i -X 'POST' \
'http://127.0.0.1:8085/v1/policies/' \
-H 'accept: */*' \
-H "Authorization: Bearer $token" \
-H 'fiware-service: Tenant1' \
-H 'fiware-servicepath: /' \
-H 'Content-Type: application/json' \
-d '{
"access_to": "/",
"resource_type": "service_path",
"mode": ["acl:Write"],
"agent": ["acl:AuthenticatedAgent"]
}'

echo "Re-check token from Keycloak..."

export json=$( curl -sS --location --request POST 'http://localhost:8080/realms/default/protocol/openid-connect/token' \
--header 'Host: keycloak:8080' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'username=admin@mail.com' \
--data-urlencode 'password=admin' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'client_id=configuration')

export token=$( jq -r ".access_token" <<<"$json" )

echo ""
echo "decoded token:"
echo ""

jq -R 'split(".") | .[1] | @base64d | fromjson' <<< $( jq -r ".access_token" <<<"$json" )


echo ""

echo "Create an entity in ServicePath / for Tenant1?"
echo "==============================================================="
export response=`curl -s -o /dev/null -w "%{http_code}" --request POST 'http://localhost:1026/v2/entities' \
--header 'Content: application/json' \
--header 'fiware-Service: Tenant1' \
--header 'fiware-ServicePath: /' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $token" \
--data-raw '{
  "id": "urn:ngsi-ld:AirQualityObserved:Tenant1",
  "type": "AirQualityObserved",
  "temperature": {
    "type": "Number",
    "value": 12.2,
    "metadata": {}
  }
}'`
if [ $response == "201" ]
then
  echo "PASSED"
else
  echo "ERROR: Can't create entity"
  exit 1
fi


echo ""

echo "Create an entity in ServicePath / for Tenant2?"
echo "==============================================================="
export response=`curl -s -o /dev/null -w "%{http_code}" --request POST 'http://localhost:1026/v2/entities' \
--header 'Content: application/json' \
--header 'fiware-Service: Tenant2' \
--header 'fiware-ServicePath: /' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $token" \
--data-raw '{
  "id": "urn:ngsi-ld:AirQualityObserved:Tenant2",
  "type": "AirQualityObserved",
  "temperature": {
    "type": "Number",
    "value": 12.2,
    "metadata": {}
  }
}'`
if [ $response == "201" ]
then
  echo "PASSED"
else
  echo "ERROR: Can't create entity"
  exit 1
fi

echo ""

echo "Adding Users"
echo "==============================================================="

export json=$( curl -sS --location --request POST 'http://localhost:8080/realms/default/protocol/openid-connect/token' \
--header 'Host: keycloak:8080' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'username=admin@mail.com' \
--data-urlencode 'password=admin' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'client_id=configuration')

export token=$( jq -r ".access_token" <<<"$json" )

export groupsJson=$(curl -sS --location --request GET 'http://localhost:8080/admin/realms/default/groups?briefRepresentation=true' \
  -H 'Host: keycloak:8080' \
  -H 'Accept: application/json, text/plain, */*' \
  -H "Authorization: Bearer $token")

users=( "user1" "user2" )

for u in "${users[@]}"; do
  export userJson=$( curl -sS --location --request GET "http://localhost:8080/admin/realms/default/users?briefRepresentation=true&first=0&max=11&search=$u" \
    -H 'Host: keycloak:8080' \
    -H 'Accept: application/json, text/plain, */*' \
    -H "Authorization: Bearer $token")
  export uid=$(jq -c '.[] | .id' <<<"$userJson")
  export uid=$(sed -e 's/^"//' -e 's/"$//' <<<$uid)
  for gid in $(jq -c '.[] | .id' <<<"$groupsJson"); do
      export gid=$(sed -e 's/^"//' -e 's/"$//' <<<$gid)
      echo "adding user $uid to group $gid"
      curl -sS --location --request PUT "http://localhost:8080/admin/realms/default/users/$uid/groups/$gid" \
      -H 'Host: keycloak:8080' \
      -H 'Accept: application/json, text/plain, */*' \
      -H "Authorization: Bearer $token"
  done

done

echo "==============================================================="

if [[ $1 == "dev" ]]; then
    echo ""
    echo "Dev environment deployed"
else
    echo ""
    echo "Populate mongo db ..."
    docker run --name populatedb --env MONGO_DB="mongodb://root:example@mongo:27017/admin" --network=auth-management-ui_envoymesh orchestracities/configuration-api node main/mongo/populateDB.js
    docker rm -f populatedb

    wait=0
    HOST="http://localhost:3000"
    while [ "$(curl -s -o /dev/null -L -w ''%{http_code}'' $HOST)" != "200" ] && [ $wait -le 60 ]
    do
      echo "Waiting for Anubis UI..."
      sleep 5
      wait=$((wait+5))
      echo "Elapsed time: $wait"
    done

    if [ $wait -gt 60 ]; then
      echo "timeout while waiting Anubis UI to be ready"
      docker-compose down -v
      exit -1
    fi
    echo ""
    echo "Demo deployed!"
fi
if [[ $1 != 'silent' && $1 != 'dev' ]]; then
    echo "Your browser will open at: http://localhost:3000"
    echo "User: admin / Password: admin"
    if [ "$(uname)" == "Darwin" ]; then
        open http://localhost:3000
    elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        xdg-open http://localhost:3000
    elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW32_NT" ]; then
        start http://localhost:3000
    elif [ "$(expr substr $(uname -s) 1 10)" == "MINGW64_NT" ]; then
        start http://localhost:3000
    fi
fi
