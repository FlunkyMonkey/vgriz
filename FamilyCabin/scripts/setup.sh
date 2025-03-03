#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

# Create namespaces if they don't exist
kubectl get namespace $NAMESPACE >/dev/null 2>&1 || kubectl create namespace $NAMESPACE
kubectl get namespace $DB_NAMESPACE >/dev/null 2>&1 || kubectl create namespace $DB_NAMESPACE

# Set current namespace
kubectl config set-context --current --namespace=$NAMESPACE

echo "Environment setup complete"
EOF
