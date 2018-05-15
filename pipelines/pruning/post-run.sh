#!/usr/bin/env bash
# [wf] execute post-run.sh stage
source ./scripts/config.sh

mkdir -p $PLOTDIR

docker run --rm \
    -v "$(realpath scripts):/scripts:rw" \
    -v "$(realpath $OUTDIR):/input:rw" \
    -v "$(realpath $PLOTDIR):/out:rw" \
    -u "$(id -u):$(id -g)" \
    -w "/scripts" \
    -i rocker/tidyverse:3.5.0 \
    /bin/sh -c "Rscript /scripts/analysis.R"
