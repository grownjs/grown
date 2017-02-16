#!/bin/sh

yarn example uws & pid=$!

sleep 1

echo "OK: $pid"

curl localhost:5000

pkill -9 $pid
