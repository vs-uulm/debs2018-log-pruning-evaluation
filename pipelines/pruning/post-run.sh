#!/usr/bin/env bash
# [wf] execute post-run.sh stage
source ./scripts/config.sh

mkdir -p $PLOTDIR

docker run --rm \
    -v "$(realpath scripts/analysis.R):/analysis.R:ro" \
    -v "$(realpath $OUTDIR):/input:rw" \
    -v "$(realpath $PLOTDIR):/out:rw" \
    -u "$(id -u):$(id -g)" \
    -e "HOME=/tmp" \
    -w "/tmp" \
    -i rocker/tidyverse:3.5.0 \
    /bin/sh -c "Rscript /analysis.R"
