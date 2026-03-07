#!/bin/sh

# Start spring-boot:run in background
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=true" -Dspring-boot.run.profiles=dev &
APP_PID=$!

# Wait for initial compilation to finish
sleep 10

# Watch for .java file changes and trigger recompilation
echo "[dev-entrypoint] Watching src/ for changes..."
while true; do
  # Use find to detect files modified in the last 2 seconds
  CHANGED=$(find src/main/java -name "*.java" -newer /tmp/.last_compile 2>/dev/null)
  if [ -n "$CHANGED" ]; then
    echo "[dev-entrypoint] Detected changes, recompiling..."
    mvn compile -q 2>&1 | tail -5
    echo "[dev-entrypoint] Recompilation done. Devtools should restart."
  fi
  touch /tmp/.last_compile
  sleep 2
done
