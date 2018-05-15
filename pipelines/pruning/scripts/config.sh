#!/usr/bin/env bash
WORKLOADDIR="./workloads"
PLOTDIR="./plots"
OUTDIR="./out"

STEPS="10"

CONFIGS=(
    "ES:"
    "CS:"
    "CE:"
    "CP:"

    "BB:k=25"
    "TW:k=25,w=15"

    "PB:p=0.1"
    "HR:k=20"
)
