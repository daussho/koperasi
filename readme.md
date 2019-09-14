
# Create new config

    cd "$(dirname "$0")"
	cryptogen generate --config=./crypto-config.yaml
	export FABRIC_CFG_PATH=$PWD
	configtxgen -profile ComposerOrdererGenesis -outputBlock ./composer-genesis.block
	configtxgen -profile ComposerChannel -outputCreateChannelTx ./composer-channel.tx -channelID composerchannel

# Start
## Remove card
	composer card delete -c PeerAdmin@hlfv1
	composer card delete -c admin@koperasi
	composer card delete -c restadmin@koperasi
	composer card delete -c OP_0@koperasi
	composer card delete -c MEM_0@koperasi

## Start fabric
	sudo FABRIC_VERSION="hlfv12" ./startFabric.sh 
	FABRIC_VERSION="hlfv12" ./createPeerAdminCard.sh

# Start MongoDB
	cd ..
	sudo docker run -d --name mongo --network composer_default -p 27017:27017 mongo
	source envvars.txt
	echo $COMPOSER_CARD
	echo $COMPOSER_PROVIDERS

# Generate a business network archive
> Optional

	composer archive create -t dir -n .

# Deploying the business network
	composer card import --file networkadmin.card
	composer network install --card PeerAdmin@hlfv1 --archiveFile  koperasi@0.1.2.bna
	composer network start --networkName koperasi --networkVersion 0.1.2 --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file networkadmin.card

# Testing network
	composer network ping --card admin@koperasi

# Create Rest Admin
	composer participant add -c admin@koperasi -d '{"$class":"org.hyperledger.composer.system.NetworkAdmin", "participantId":"restadmin"}'

	composer identity issue -c admin@koperasi -f restadmin.card -u restadmin -a "resource:org.hyperledger.composer.system.NetworkAdmin#restadmin"

	composer card import -f  restadmin.card
	composer network ping -c restadmin@koperasi

# Generating a REST server
> For 1 peer

	sed -e 's/localhost:7051/peer0.org1.example.com:7051/' -e 's/localhost:7053/peer0.org1.example.com:7053/' -e 's/localhost:7054/ca.org1.example.com:7054/'  -e 's/localhost:7050/orderer.example.com:7050/'  < $HOME/.composer/cards/restadmin@koperasi/connection.json  > /tmp/connection.json && cp -p /tmp/connection.json $HOME/.composer/cards/restadmin@koperasi/

> For 4 peer

	sed -e 's/localhost:7051/peer0.org1.example.com:7051/' -e 's/localhost:7053/peer0.org1.example.com:7053/' -e 's/localhost:8051/peer1.org1.example.com:8051/' -e 's/localhost:8053/peer1.org1.example.com:8053/' -e 's/localhost:9051/peer2.org1.example.com:9051/' -e 's/localhost:9053/peer2.org1.example.com:9053/' -e 's/localhost:10051/peer3.org1.example.com:10051/' -e 's/localhost:10053/peer3.org1.example.com:10053/' -e 's/localhost:7054/ca.org1.example.com:7054/' -e 's/localhost:7050/orderer.example.com:7050/'  < $HOME/.composer/cards/restadmin@koperasi/connection.json  > /tmp/connection.json && cp -p /tmp/connection.json $HOME/.composer/cards/restadmin@koperasi/ 

> Run rest server

	sudo docker run \
	-d \
	-e COMPOSER_CARD=${COMPOSER_CARD} \
	-e COMPOSER_NAMESPACES=${COMPOSER_NAMESPACES} \
	-e COMPOSER_AUTHENTICATION=${COMPOSER_AUTHENTICATION} \
	-e COMPOSER_MULTIUSER=${COMPOSER_MULTIUSER} \
	-e COMPOSER_PROVIDERS="${COMPOSER_PROVIDERS}" \
	-e COMPOSER_DATASOURCES="${COMPOSER_DATASOURCES}" \
	-v ~/.composer:/home/composer/.composer \
	--name rest \
	--network composer_default \
	-p 3000:3000 \
	myorg/composer-rest-server 

# Create operator
	composer participant add -c admin@koperasi -d '{"$class":"com.daussho.koperasi.User","userId":"OP_0", "name":"demo operator","address":"Bandung","type":"OPERATOR","timeStamp":"2019-08-26T05:48:17.396Z"}'
	
	composer identity issue -c admin@koperasi -f OP_0.card -u OP_0 -a "resource:com.daussho.koperasi.User#OP_0"

	composer card import -f OP_0.card

	sed -e 's/localhost:7051/peer0.org1.example.com:7051/' -e 's/localhost:7053/peer0.org1.example.com:7053/' -e 's/localhost:8051/peer1.org1.example.com:8051/' -e 's/localhost:8053/peer1.org1.example.com:8053/' -e 's/localhost:9051/peer2.org1.example.com:9051/' -e 's/localhost:9053/peer2.org1.example.com:9053/' -e 's/localhost:10051/peer3.org1.example.com:10051/' -e 's/localhost:10053/peer3.org1.example.com:10053/' -e 's/localhost:7054/ca.org1.example.com:7054/' -e 's/localhost:7050/orderer.example.com:7050/'  < $HOME/.composer/cards/OP_0@koperasi/connection.json  > /tmp/connection.json && cp -p /tmp/connection.json $HOME/.composer/cards/OP_0@koperasi/

	rm OP_0.card
	composer card export -f OP_0.card -c OP_0@koperasi

# Create member
	composer identity issue -c admin@koperasi -f MEM_0.card -u MEM_0 -a "resource:com.daussho.koperasi.User#MEM_0"

	composer card import -f MEM_0.card

	sed -e 's/localhost:7051/peer0.org1.example.com:7051/' -e 's/localhost:7053/peer0.org1.example.com:7053/' -e 's/localhost:8051/peer1.org1.example.com:8051/' -e 's/localhost:8053/peer1.org1.example.com:8053/' -e 's/localhost:9051/peer2.org1.example.com:9051/' -e 's/localhost:9053/peer2.org1.example.com:9053/' -e 's/localhost:10051/peer3.org1.example.com:10051/' -e 's/localhost:10053/peer3.org1.example.com:10053/' -e 's/localhost:7054/ca.org1.example.com:7054/' -e 's/localhost:7050/orderer.example.com:7050/'  < $HOME/.composer/cards/MEM_0@koperasi/connection.json  > /tmp/connection.json && cp -p /tmp/connection.json $HOME/.composer/cards/MEM_0@koperasi/

	rm MEM_0.card
	composer card export -f MEM_0.card -c MEM_0@koperasi

# Stop all docker
	sudo docker stop rest
	sudo docker rm rest
	sudo docker stop mongo
	sudo docker rm mongo
	sudo FABRIC_VERSION="hlfv12" ./stopFabric.sh
	sudo FABRIC_VERSION="hlfv12" ./teardownFabric.sh
