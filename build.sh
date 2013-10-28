#!/bin/bash

pushd target > /dev/null
python ../yamd.py ../warp9
python ../yamd.py -c ../warp9
popd > /dev/null
nodeunit tests
