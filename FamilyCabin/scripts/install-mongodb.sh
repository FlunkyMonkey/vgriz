#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Get the parent directory (project root)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# Load environment variables from the project root
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
  echo "Error: .env file not found in $PROJECT_ROOT"
  exit 1
fi

# Add Bitnami Helm repo if not present
if ! helm repo list | grep -q bitnami; then
  echo "Adding Bitnami Helm repository..."
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm repo update
fi

# Ensure the helm directory exists
HELM_DIR="$PROJECT_ROOT/helm"
if [ ! -d "$HELM_DIR" ]; then
  echo "Creating helm directory..."
  mkdir -p "$HELM_DIR"
fi

# Create the MongoDB values file if it doesn't exist
VALUES_FILE="$HELM_DIR/mongodb-values.yaml"
if [ ! -f "$VALUES_FILE" ]; then
  echo "Creating MongoDB values file..."
  cat > "$VALUES_FILE" << EOF
architecture: replicaset
replicaCount: 1

auth:
  enabled: true
  rootPassword: "${MONGODB_ROOT_PASSWORD}"
  username: "${MONGODB_USERNAME}"
  password: "${MONGODB_PASSWORD}"
  database: "${MONGODB_DATABASE}"

persistence:
  enabled: true
  size: 8Gi
  storageClass: "${STORAGE_CLASS}"

resources:
  requests:
    memory: 256Mi
    cpu: 250m
  limits:
    memory: 512Mi
    cpu: 500m

metrics:
  enabled: true
  serviceMonitor:
    enabled: true
    namespace: "monitoring"
EOF
fi

# Install MongoDB using Helm
echo "Installing MongoDB..."
helm install mongodb bitnami/mongodb \
  -f "$VALUES_FILE" \
  -n $DB_NAMESPACE

echo "MongoDB installation complete"