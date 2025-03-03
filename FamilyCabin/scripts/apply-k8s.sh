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

# Check if envsubst is installed
if ! command -v envsubst &> /dev/null; then
  echo "Error: envsubst command not found. Please install the 'gettext' package."
  exit 1
fi

# Function to apply a YAML file with variable substitution
apply_file() {
  local file="$1"
  echo "Applying $file with variable substitution..."
  
  # Create a temporary file for the substituted content
  local temp_file=$(mktemp)
  
  # Substitute environment variables and apply
  envsubst < "$file" > "$temp_file"
  kubectl apply -f "$temp_file"
  
  # Remove temporary file
  rm "$temp_file"
}

# Apply a specific file if provided as an argument
if [ "$1" != "" ]; then
  if [ -f "$1" ]; then
    apply_file "$1"
  else
    echo "Error: File $1 not found"
    exit 1
  fi
  exit 0
fi

# If no specific file provided, apply all YAML files in k8s directory
K8S_DIR="$PROJECT_ROOT/k8s"
if [ ! -d "$K8S_DIR" ]; then
  echo "Error: k8s directory not found at $K8S_DIR"
  exit 1
fi

echo "Applying all YAML files in $K8S_DIR..."
for file in "$K8S_DIR"/*.yaml; do
  if [ -f "$file" ]; then
    apply_file "$file"
  fi
done

echo "Configuration applied successfully"