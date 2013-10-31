#!/bin/bash

PATH=$(pwd)/node_modules/.bin:$PATH

rm -rf target
mkdir target
pushd target > /dev/null
yamd ../warp9
yamd -c ../warp9
yamd -a ../warp9
popd > /dev/null
nodeunit tests
