#!/bin/bash
set -e

echo "=== DEPLOYING MONGODB 4.4 (AVX NOT REQUIRED) ==="

# Step 1: Uninstall existing MongoDB deployments
echo "Removing any existing MongoDB deployments..."
helm uninstall mongodb -n familycabin-db 2>/dev/null || true
kubectl delete deployment mongodb -n familycabin-db 2>/dev/null || true
kubectl delete service mongodb -n familycabin-db 2>/dev/null || true
kubectl delete job mongodb-setup -n familycabin-db 2>/dev/null || true
kubectl delete configmap mongo-setup-script -n familycabin-db 2>/dev/null || true

# Step 2: Create MongoDB 4.4 deployment
echo "Creating MongoDB 4.4 deployment (no AVX required)..."
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

# Step 3: Wait for MongoDB to start
echo "Waiting for MongoDB 4.4 to start up..."
sleep 20

# Check if MongoDB is running
echo "Checking MongoDB pod status..."
kubectl get pods -n familycabin-db

# Step 4: Create a MongoDB user for the application
echo "Creating MongoDB setup script..."
cat > mongo-setup.js << EOF
use familycabin;
db.createUser({
  user: "familycabin",
  pwd: "mongodb-password", 
  roles: [{ role: "readWrite", db: "familycabin" }]
});
EOF

echo "Creating setup job..."
cat > mongo-setup-job.yaml << EOF
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

kubectl create configmap mongo-setup-script -n familycabin-db --from-file=mongo-setup.js
kubectl apply -f mongo-setup-job.yaml

# Step 5: Update the API ConfigMap with the correct MongoDB URI
echo "Updating API ConfigMap with MongoDB connection string..."
kubectl patch configmap familycabin-config -n familycabin --type=merge -p "{\"data\":{\"MONGODB_URI\":\"mongodb://familycabin:mongodb-password@mongodb.familycabin-db.svc.cluster.local:27017/familycabin\"}}"

# Step 6: Restart the API deployment (and clean up old pods)
echo "Cleaning up old API pods..."
kubectl delete pods -l app=familycabin-api -n familycabin --grace-period=0 --force

echo "Restarting API deployment..."
kubectl rollout restart deployment familycabin-api -n familycabin

echo -e "\n=== DEPLOYMENT STATUS ==="
echo "Check MongoDB status:"
kubectl get pods -n familycabin-db

echo -e "\nCheck user creation job status:"
kubectl get jobs -n familycabin-db

echo -e "\nCheck API pod status:"
kubectl get pods -n familycabin

echo -e "\nSetup complete! It may take a minute for all pods to stabilize."
echo "Monitor progress with these commands:"
echo "kubectl get pods -n familycabin-db"
echo "kubectl get pods -n familycabin"