# Wekan / Docker updater

Updates cards in a wekan board that reflect the status of all docker-compose projects currently existing on a docker host.

/!\ Swarm services is not handled right now.

The cards are added into the first available column for now.

# Env variables

* **BOARD** : The id of the board (that is in the URL after `/b/`)
* **EMAIL** : The email of the wekan user. It needs to be administrator to work.
* **PASSWORD** : The password of the user
* **SWIMLANE** : The *name* (not id) of the swimlane where the cards will be added

optional variables:
* **WEKAN_URL** : An URL to reach a wekan server.