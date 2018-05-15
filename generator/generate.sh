#!/usr/bin/env bash
for w in ./workloads/*; do
    echo "Generating $(basename $w .js)..."
    node index.js $w "/out/$(basename $w .js).txt" &
done
wait
