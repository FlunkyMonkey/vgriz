# FamilyCabin.io - Final Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Infrastructure Components](#infrastructure-components)
4. [Deployment Steps](#deployment-steps)
5. [Troubleshooting Solutions](#troubleshooting-solutions)
6. [Next Steps](#next-steps)
7. [Maintenance Procedures](#maintenance-procedures)

<a name="overview"></a>
## 1. Overview

FamilyCabin.io is a web application designed for families who share vacation properties such as cabins or lake houses. The platform provides a centralized space for family members to coordinate usage, share information, and manage the shared property.

**Core Features:**
- Shared calendar for booking and viewing property usage
- Notice board for important announcements
- Document storage for procedures, manuals, and important documents
- Message board with photo support for family communication
- Guest book with PIN-protected access for visitors
- Single Sign-On (SSO) authentication with Google, Apple, and Facebook
- Optional payment processing addon for shared expenses

This guide documents the infrastructure setup for FamilyCabin.io, providing a foundation for further application development.

<a name="architecture"></a>
## 2. Architecture

### 2.1 High-Level Architecture Diagram

```
                                +-------------+
                                |  CloudFlare |
                                |   DNS/CDN   |
                                +------+------+
                                       |
                                       v
+----------------+            +----------------+
|    Internet    |            |    MetalLB     |
|                +----------->|  Load Balancer |
+----------------+            +-------+--------+
                                      |
                                      v
                              +---------------+
                              |   Ingress     |
                              |  Controller   |
                              +-------+-------+
                                      |
           +----------------------+---+---+----------------------+
           |                      |       |                      |
           v                      v       v                      v
    +-------------+        +-------------+ +-------------+ +-------------+
    |  Frontend   |        |   API       | |   Auth      | |   Storage   |
    |  Service    |        |   Service   | |   Service   | |   Service   |
    +------+------+        +------+------+ +------+------+ +------+------+
           |                      |              |               |
           |                      |              |               |
           |                      v              |               |
           |               +-------------+       |               |
           +-------------->|  MongoDB    |<------+               |
           |               |  Database   |                       |
           |               +-------------+                       |
           |                                                     |
           +-----------------------------------------------------+
```

### 2.2 Kubernetes Architecture

The application is deployed on a Kubernetes cluster with the following components:

- **Namespaces**:
  - `familycabin`: Main application namespace
  - `familycabin-db`: Database namespace

- **Deployments**:
  - Frontend deployment (NGINX placeholder)
  - API deployment (NGINX placeholder)
  - MongoDB deployment (v4.4)

- **Services**:
  - Frontend service
  - API service
  - MongoDB service

- **Ingress**:
  - Single ingress for both frontend and API

- **PersistentVolumeClaims**:
  - Storage PVC for application data
  - MongoDB PVC for database storage

<a name="infrastructure-components"></a>
## 3. Infrastructure Components

### 3.1 Storage

- **NFS Storage**: Using `nfs-client` StorageClass for persistent storage
- **Application Storage**: 10Gi PersistentVolumeClaim for application data
- **Database Storage**: 8Gi PersistentVolumeClaim for MongoDB data

### 3.2 Database

- **MongoDB 4.4**: Compatible with CPUs without AVX instruction set support
- **Authentication**: Root and application user configured
- **Database name**: `familycabin`
- **Connection string**: `mongodb://familycabin:mongodb-password@mongodb.familycabin-db.svc.cluster.local:27017/familycabin`

### 3.3 Networking

- **Ingress**: NGINX ingress controller
- **Domain**: app.familycabin.io
- **TLS**: Wildcard certificate
- **Load Balancer**: MetalLB for external access
- **CloudFlare**: For DNS and CDN

### 3.4 Configuration

- **ConfigMap**: Environment variables for API service
- **Secrets**: Sensitive data and credentials
- **Environment Variables**: Set up for all necessary services

<a name="deployment-steps"></a>
## 4. Deployment Steps

This section summarizes the steps taken to deploy the infrastructure:

### 4.1 Namespace Setup

```bash
kubectl create namespace familycabin
kubectl create namespace familycabin-db
```

### 4.2 Storage Setup

```bash
# Create PVCs
cat > storage-pvc.yaml << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: familycabin-storage-pvc
  namespace: familycabin
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: nfs-client
EOF

kubectl apply -f storage-pvc.yaml

# Create MongoDB PVC
cat > mongodb-pvc.yaml << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb
  namespace: familycabin-db
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 8Gi
  storageClassName: nfs-client
EOF

kubectl apply -f mongodb-pvc.yaml
```

### 4.3 MongoDB Setup

```bash
# Create MongoDB 4.4 deployment
cat > mongodb-4.4.yaml << EOF
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: familycabin-db
  labels:
    app: mongodb
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:4.4
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "root"
        - name: MONGO_INITDB_ROOT_PASSWORD
          value: "mongodb-root-password"
        - name: MONGO_INITDB_DATABASE
          value: "familycabin"
        volumeMounts:
        - name: mongodb-data
          mountPath: /data/db
        resources:
          requests:
            memory: 128Mi
            cpu: 100m
          limits:
            memory: 256Mi
            cpu: 200m
      volumes:
      - name: mongodb-data
        persistentVolumeClaim:
          claimName: mongodb
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: familycabin-db
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
  type: ClusterIP
EOF

kubectl apply -f mongodb-4.4.yaml

# Create MongoDB user
cat > mongo-setup.js << EOF
use familycabin;
db.createUser({
  user: "familycabin",
  pwd: "mongodb-password", 
  roles: [{ role: "readWrite", db: "familycabin" }]
});
EOF

kubectl create configmap mongo-setup-script -n familycabin-db --from-file=mongo-setup.js
kubectl apply -f - << EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: mongodb-setup
  namespace: familycabin-db
spec:
  template:
    spec:
      containers:
      - name: mongo-setup
        image: mongo:4.4
        command: ["mongo", "--host", "mongodb", "--username", "root", "--password", "mongodb-root-password", "--authenticationDatabase", "admin", "/script/mongo-setup.js"]
        volumeMounts:
        - name: script
          mountPath: /script
      volumes:
      - name: script
        configMap:
          name: mongo-setup-script
      restartPolicy: Never
  backoffLimit: 4
EOF
```

### 4.4 ConfigMap and Secrets

```bash
# Create ConfigMap
kubectl create configmap familycabin-config -n familycabin \
  --from-literal=NODE_ENV=production \
  --from-literal=PORT=3000 \
  --from-literal=MONGODB_URI="mongodb://familycabin:mongodb-password@mongodb.familycabin-db.svc.cluster.local:27017/familycabin" \
  --from-literal=FRONTEND_URL="https://app.familycabin.io" \
  --from-literal=GUEST_PIN="1234" \
  --from-literal=AUTO_APPROVE_GUESTBOOK="false" \
  --from-literal=LOG_LEVEL="info"

# Create Secret
kubectl create secret generic familycabin-secrets -n familycabin \
  --from-literal=JWT_SECRET="$(openssl rand -base64 32)" \
  --from-literal=MONGODB_ROOT_PASSWORD="mongodb-root-password" \
  --from-literal=MONGODB_PASSWORD="mongodb-password" \
  --from-literal=GOOGLE_CLIENT_ID="to-be-configured" \
  --from-literal=GOOGLE_CLIENT_SECRET="to-be-configured" \
  --from-literal=FACEBOOK_APP_ID="to-be-configured" \
  --from-literal=FACEBOOK_APP_SECRET="to-be-configured" \
  --from-literal=APPLE_CLIENT_ID="to-be-configured" \
  --from-literal=APPLE_TEAM_ID="to-be-configured" \
  --from-literal=APPLE_KEY_ID="to-be-configured"
```

### 4.5 API Deployment

```bash
kubectl apply -f - << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: familycabin-api
  namespace: familycabin
spec:
  replicas: 2
  selector:
    matchLabels:
      app: familycabin-api
  template:
    metadata:
      labels:
        app: familycabin-api
    spec:
      containers:
      - name: api
        image: nginx:alpine  # Placeholder image
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: storage
          mountPath: /app/storage
        envFrom:
        - configMapRef:
            name: familycabin-config
        - secretRef:
            name: familycabin-secrets
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: familycabin-storage-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: familycabin-api
  namespace: familycabin
spec:
  selector:
    app: familycabin-api
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
EOF
```

### 4.6 Frontend Deployment

```bash
kubectl apply -f - << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: familycabin-frontend
  namespace: familycabin
spec:
  replicas: 2
  selector:
    matchLabels:
      app: familycabin-frontend
  template:
    metadata:
      labels:
        app: familycabin-frontend
    spec:
      containers:
      - name: frontend
        image: nginx:alpine  # Placeholder image
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 200m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: familycabin-frontend
  namespace: familycabin
spec:
  selector:
    app: familycabin-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
EOF
```

### 4.7 Ingress Setup

```bash
kubectl apply -f - << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: familycabin-ingress
  namespace: familycabin
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - "app.familycabin.io"
    secretName: familycabin-tls
  rules:
  - host: "app.familycabin.io"
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: familycabin-api
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: familycabin-frontend
            port:
              number: 80
EOF
```

<a name="troubleshooting-solutions"></a>
## 5. Troubleshooting Solutions

During the deployment, we encountered and resolved several issues:

### 5.1 Storage Class Issue

**Problem**: The initial configuration specified `local-path` as the storage class, but it wasn't available in the cluster.

**Solution**: Updated the configuration to use the available `nfs-client` storage class.

```bash
# Check available storage classes
kubectl get storageclasses

# Update the PVC to use nfs-client
cat > storage-pvc.yaml << EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: familycabin-storage-pvc
  namespace: familycabin
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
  storageClassName: nfs-client
EOF

kubectl apply -f storage-pvc.yaml
```

### 5.2 Environment Variable Substitution

**Problem**: Environment variables in YAML files weren't being substituted.

**Solution**: Created a script to handle environment variable substitution before applying YAML files.

```bash
#!/bin/bash
# apply-k8s.sh
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
else
  echo "No file specified"
  exit 1
fi
```

### 5.3 MongoDB CPU Compatibility

**Problem**: MongoDB 5.0+ requires CPU with AVX support, which wasn't available on the server.

**Solution**: Used MongoDB 4.4 which doesn't require AVX instruction support.

```bash
# Create MongoDB 4.4 deployment instead of 5.0+
cat > mongodb-4.4.yaml << EOF
# Deployment manifest for MongoDB 4.4
...
        image: mongo:4.4
...
EOF

kubectl apply -f mongodb-4.4.yaml
```

### 5.4 Multiple API Pods

**Problem**: During troubleshooting, multiple API pods were created, leading to confusion.

**Solution**: Cleaned up all pods and restarted the deployment.

```bash
# Clean up all API pods
kubectl delete pods -l app=familycabin-api -n familycabin --grace-period=0 --force

# Restart the deployment
kubectl rollout restart deployment familycabin-api -n familycabin
```

<a name="next-steps"></a>
## 6. Next Steps

With the infrastructure in place, the following steps are needed to complete the application:

### 6.1 Backend Development

1. **Create API Service**: Develop the Node.js/Express backend application
2. **Implement API Endpoints**:
   - User authentication and authorization
   - Calendar event management
   - Notice board CRUD operations
   - Document management with file uploads
   - Message board with photo support
   - Guest book functionality

3. **Build and Deploy API Image**:
   ```bash
   # Example Dockerfile for API
   FROM node:16-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["node", "src/server.js"]
   
   # Deploy updated image
   kubectl set image deployment/familycabin-api api=your-registry/familycabin-api:latest -n familycabin
   ```

### 6.2 Frontend Development

1. **Create React Application**: Develop the React frontend with:
   - Dashboard UI
   - Calendar component
   - Notices component
   - Document repository UI
   - Message board UI
   - Guest book UI
   - User profile and settings

2. **Build and Deploy Frontend Image**:
   ```bash
   # Example Dockerfile for Frontend
   FROM node:16-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   
   # Deploy updated image
   kubectl set image deployment/familycabin-frontend frontend=your-registry/familycabin-frontend:latest -n familycabin
   ```

### 6.3 Authentication Setup

1. **Create OAuth Applications**:
   - Google Cloud Console: Create OAuth 2.0 credentials
   - Facebook Developer Portal: Create a new app
   - Apple Developer Portal: Set up Sign in with Apple

2. **Update Secrets**:
   ```bash
   kubectl edit secret familycabin-secrets -n familycabin
   # Update the values for:
   # - GOOGLE_CLIENT_ID
   # - GOOGLE_CLIENT_SECRET
   # - FACEBOOK_APP_ID
   # - FACEBOOK_APP_SECRET
   # - APPLE_CLIENT_ID
   # - APPLE_TEAM_ID
   # - APPLE_KEY_ID
   ```

### 6.4 Testing

1. **API Testing**: Test all API endpoints
2. **Frontend Testing**: Test all UI components and flows
3. **Integration Testing**: Test end-to-end user flows
4. **Performance Testing**: Ensure the application performs well under load

<a name="maintenance-procedures"></a>
## 7. Maintenance Procedures

### 7.1 Backup Procedures

```bash
# MongoDB backup script
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$TIMESTAMP.gz"

# Create a MongoDB dump
kubectl exec -it $(kubectl get pods -n familycabin-db -l app=mongodb -o jsonpath='{.items[0].metadata.name}') -n familycabin-db -- \
  mongodump --host localhost --username root --password mongodb-root-password --authenticationDatabase admin --gzip --archive > $BACKUP_FILE

echo "Backup saved to $BACKUP_FILE"
```

### 7.2 Restore Procedures

```bash
# MongoDB restore script
#!/bin/bash
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# Restore from backup
kubectl exec -i $(kubectl get pods -n familycabin-db -l app=mongodb -o jsonpath='{.items[0].metadata.name}') -n familycabin-db -- \
  mongorestore --host localhost --username root --password mongodb-root-password --authenticationDatabase admin --gzip --archive < $BACKUP_FILE

echo "Restore completed"
```

### 7.3 Updating Application

```bash
# Update API deployment
kubectl set image deployment/familycabin-api api=your-registry/familycabin-api:new-version -n familycabin

# Update Frontend deployment
kubectl set image deployment/familycabin-frontend frontend=your-registry/familycabin-frontend:new-version -n familycabin
```

### 7.4 Scaling

```bash
# Scale API deployment
kubectl scale deployment familycabin-api --replicas=3 -n familycabin

# Scale Frontend deployment
kubectl scale deployment familycabin-frontend --replicas=3 -n familycabin
```

### 7.5 Monitoring Commands

```bash
# Check pod status
kubectl get pods -n familycabin -n familycabin-db

# Check logs
kubectl logs deployment/familycabin-api -n familycabin
kubectl logs deployment/familycabin-frontend -n familycabin
kubectl logs deployment/mongodb -n familycabin-db

# Check resource usage
kubectl top pods -n familycabin
kubectl top pods -n familycabin-db
```

---

This implementation guide serves as a comprehensive reference for the FamilyCabin.io infrastructure setup. The next phase of development should focus on implementing the actual application code for both the frontend and backend components.
