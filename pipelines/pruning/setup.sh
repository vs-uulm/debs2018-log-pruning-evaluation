#!/usr/bin/env bash
# [wf] execute setup.sh stage
source ./scripts/config.sh

mkdir -p $WORKLOADDIR

docker run --rm \
    -v "$(realpath ../../generator):/src/generator:ro" \
    -v "$(realpath $WORKLOADDIR):/out:rw" \
    -u "$(id -u):$(id -g)" \
    -e "HOME=/tmp" \
    -w "/tmp" \
    -i node:10.0.0-slim \
    /bin/sh -c "cp -a /src/generator . && cd generator && npm install && npm start"
