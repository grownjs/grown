#!/bin/sh

if [ ! -d external ]; then
  mkdir external
fi

cd external

if [ ! -d uWebSockets ]; then
  git clone https://github.com/uWebSockets/uWebSockets.git
fi

cd uWebSockets
rm -rf *
git checkout -- .
git pull

# stable patch
#git checkout 2d7faa6

cd nodejs
make
cd ../..
