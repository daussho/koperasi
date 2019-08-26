
# Create new config

    cd "$(dirname "$0")"
	cryptogen generate --config=./crypto-config.yaml
	export FABRIC_CFG_PATH=$PWD
	configtxgen -profile ComposerOrdererGenesis -outputBlock ./composer-genesis.block
	configtxgen -profile ComposerChannel -outputCreateChannelTx ./composer-channel.tx -channelID composerchannel

# Start fabric
	sudo FABRIC_VERSION="hlfv12" ./startFabric.sh 
	FABRIC_VERSION="hlfv12" ./createPeerAdminCard.sh

	composer card delete -c admin@koperasi

> Optional

	FABRIC_VERSION="hlfv12" ./createPeerAdminCard.sh

# Start MongoDB
	sudo docker run -d --name mongo --network composer_default -p 27017:27017 mongo
	source envvars.txt
	echo $COMPOSER_CARD
	echo $COMPOSER_PROVIDERS

# Generate a business network archive
	composer archive create -t dir -n .

> Optional

	composer card import --file networkadmin.card

# Deploying the business network
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
	composer-rest-server
	composer-rest-server -c restadmin@koperasi -n never -a true -m true -u true -w true

- Enter **admin@koperasi** as the card name.
- Select never use namespaces when asked whether to use namespaces in the generated API.
- Select No when asked whether to secure the generated API.
- Select Yes when asked whether to enable event publication.
- Select No when asked whether to enable TLS security.

# Stop fabric
	sudo FABRIC_VERSION="hlfv12" ./stopFabric.sh