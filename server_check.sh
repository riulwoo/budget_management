#!/bin/bash

if ! pgrep -f "node server.js" > /dev/null; then
  nohup node server.js > server.log 2>&1 &
fi