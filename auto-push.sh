#!/bin/bash
while true; do
  git add .
  git commit -m "Auto-commit"
  git push
  sleep 300
  # 300 secondi = 5 minuti
done 