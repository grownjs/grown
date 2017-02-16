#!/bin/sh

if [ ! -d external ]; then
  mkdir external
fi

cd external

if [ ! -d uWebSockets ]; then
  git clone https://github.com/uWebSockets/uWebSockets.git
else
  cd uWebSockets
  git reset HEAD
  git checkout -- .
  git pull
  cd ..
fi

cd uWebSockets/nodejs
make
cd ../..
