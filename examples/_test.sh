#!/bin/sh

yarn example uws & pid=$!

sleep 2

test="$(curl -sS localhost:5000)"

sleep 1

pkill -9 $pid

(echo "$test" | grep "OK in 0") || (echo "Failed: $test" && exit 1)
