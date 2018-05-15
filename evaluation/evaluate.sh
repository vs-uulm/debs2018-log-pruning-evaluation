#!/usr/bin/env bash
source ../pipelines/pruning/scripts/config.sh

for config in "${CONFIGS[@]}"; do
    approach=$(echo $config | sed 's/:.*//')
    config=$(echo $config | sed 's/[^:]*://')

    for workload in /workloads/*; do
        for step in $(seq 1 $STEPS); do
            log="/out/pruned-${approach}-${config}-${step}-$(basename $workload)"
            STEPS=$STEPS STEP=$step CONFIG=$config node approaches/$approach $workload $log &
        done
        wait
    done
done

for config in "${CONFIGS[@]}"; do
    approach=$(echo $config | sed 's/:.*//')
    config=$(echo $config | sed 's/[^:]*://')

    for workload in /workloads/*; do
        for step in $(seq 1 $STEPS); do
            log="/out/pruned-${approach}-${config}-${step}-$(basename $workload)"
            out="/out/result-${approach}-${config}-${step}-$(basename $workload)"

            CONFIG="" node analyze $log $out &
        done
        wait
    done
done
