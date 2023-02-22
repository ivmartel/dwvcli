#!/bin/sh
# run main.js anonymisation on all files from an input directory
# example: ./batch.sh /home/yves/data/public/test > log.txt 2>&1

for filepath in $1/*; do
  # anonymise
  node main -i $filepath -r rules.json -o "out-$(basename $filepath)"
  # read back
  node main -i "out-$(basename $filepath)"
done
