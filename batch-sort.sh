#!/bin/sh
# run sort.js on all files from an input directory
# example: ./batch-sort.sh /home/yves/data/public/test > log.txt 2>&1

for filepath in $1/*; do
  # anonymise
  node sort -i $filepath -m
done
