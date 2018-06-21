#!/bin/bash

# Make sure we're in the right directory
cd `dirname $0`

project=wekan-updater
repo=eu.gcr.io/divine-arcade-94510/$project
tag=$1

color=`echo -ne "\033[0;32m"`
reset=`echo -ne "\033[0m"`

if [ ! "$tag" ]; then
	echo "There are no tags within this repository"
	exit 1
fi

cat <<EOF

The following image will be built
  Project name: $color$project$reset
  Tag: $color$tag$reset
  GS URL: $color$repo$reset

Make sure the informations are correct and press enter or CTRL-C to abord.

EOF

read

# On recompile le JS en l'uglifiant.
cd client && PRODUCTION=Y webpack && sed -i "s/%dev%/${tag}/g" build/app.js && cd ..

if [ "$?" -ne 0 ]; then
  cat <<EOF
	
	build failed !
EOF
  exit 1
fi

docker build --no-cache --rm -t "$repo:$tag" .

cat <<EOF

  Type enter to automatically upload this image to
    $color$repo$tag$reset
  or CTRL-C to abort.

EOF

read
gcloud docker -a
docker push "$repo:$tag"

