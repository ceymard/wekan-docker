# Wekan / Docker updater

Updates cards in a wekan board that reflect the status of all docker-compose projects currently existing on a docker host.

Be careful when editing cards description to not remove the "auto" part.
You can use the rest of the card pretty much however you want, as long as you don't change its swimlane (otherwise another one will be created)

/!\ Swarm services is not handled right now.

The cards are added into the first available column for now.

# Requirements

You need the following :

* A running wekan
* A user account with admin privileges (which will be used to update the cards)
* A board in the wekan
* A named swimlane to host the cards
* An **Up** and a **Down** label in the board

# Env variables

Run the container with the following variables.
Also, mount /var/run/docker.sock in the container (as read-only is ok)

* **BOARD** : The id of the board (that is in the URL after `/b/`)
* **EMAIL** : The email of the wekan user. It needs to be administrator to work.
* **PASSWORD** : The password of the user
* **SWIMLANE** : The *name* (not id) of the swimlane where the cards will be added

optional variables:
* **WEKAN_URL** : An URL to reach a wekan server, defaults to *http://wekan*
