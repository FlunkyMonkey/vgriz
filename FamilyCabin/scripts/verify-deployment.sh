#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found"
  exit 1
fi

echo "Verifying FamilyCabin.io Infrastructure Deployment..."
echo "---------------------------------------------------"

# Check namespaces
echo "Checking namespaces..."
kubectl get namespace $NAMESPACE
kubectl get namespace $DB_NAMESPACE

# Check ConfigMap and Secrets
echo -e "\nChecking ConfigMap and Secrets..."
kubectl get configmap -n $NAMESPACE
kubectl get secret -n $NAMESPACE

# Check PVCs
echo -e "\nChecking Persistent Volume Claims..."
kubectl get pvc -n $NAMESPACE

# Check Deployments
echo -e "\nChecking Deployments..."
kubectl get deployment -n $NAMESPACE
kubectl get deployment -n $DB_NAMESPACE

# Check Services
echo -e "\nChecking Services..."
kubectl get service -n $NAMESPACE
kubectl get service -n $DB_NAMESPACE

# Check Ingress
echo -e "\nChecking Ingress..."
kubectl get ingress -n $NAMESPACE

# Check Pods
echo -e "\nChecking Pod Status..."
kubectl get pods -n $NAMESPACE
kubectl get pods -n $DB_NAMESPACE

echo -e "\nVerification complete!"