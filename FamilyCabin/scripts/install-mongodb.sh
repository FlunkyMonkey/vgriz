#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

# Add Bitnami Helm repo if not present
if ! helm repo list | grep -q bitnami; then
  echo "Adding Bitnami Helm repository..."
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm repo update
fi

# Install MongoDB using Helm
echo "Installing MongoDB..."
helm install mongodb bitnami/mongodb \
  -f helm/mongodb-values.yaml \
  -n $DB_NAMESPACE

echo "MongoDB installation complete"