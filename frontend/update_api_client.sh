#! /bin/bash

cd ../

npm -w api run build
cp -r out/api/client frontend/src/shared