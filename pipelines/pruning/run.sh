#!/usr/bin/env bash
# [wf] execute run.sh stage
source ./scripts/config.sh

mkdir -p $OUTDIR

docker run --rm \
    -v "$(realpath ../../evaluation):/src/evaluation:ro" \
    -v "$(realpath ./scripts/config.sh):/tmp/pipelines/pruning/scripts/config.sh:ro" \
    -v "$(realpath $WORKLOADDIR):/workloads:ro" \
    -v "$(realpath $OUTDIR):/out:rw" \
    -u "$(id -u):$(id -g)" \
    -e "HOME=/tmp" \
    -w "/tmp" \
    -i node:10.0.0-slim \
    /bin/sh -c "cp -a /src/evaluation . && cd evaluation && npm install && npm start"
