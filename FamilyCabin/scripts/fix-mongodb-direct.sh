#!/bin/bash
set -e

echo "=== TROUBLESHOOTING MONGODB DEPLOYMENT ==="

# Step 1: Check why MongoDB pod is pending
echo "Checking why MongoDB pod is pending..."
POD_NAME=$(kubectl get pods -n familycabin-db -o jsonpath='{.items[0].metadata.name}')
kubectl describe pod $POD_NAME -n familycabin-db

# Step 2: Check if the PVC is correct
echo -e "\nChecking PVC status..."
kubectl get pvc -n familycabin-db

# Step 3: Verify the storage class
echo -e "\nVerifying storage class..."
STORAGE_CLASS=$(kubectl get pvc -n familycabin-db -o jsonpath='{.items[0].spec.storageClassName}')
echo "Storage class being used: $STORAGE_CLASS"
kubectl describe storageclass $STORAGE_CLASS

# Step 4: Let's create a direct MongoDB deployment without Helm
echo -e "\nCreating direct MongoDB deployment without Helm..."

# Uninstall the Helm-based MongoDB
echo "Removing Helm-based MongoDB..."
helm uninstall mongodb -n familycabin-db

# Create MongoDB deployment directly
echo "Creating MongoDB deployment with explicit configuration..."
cat > mongodb-direct.yaml << EOF
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
        image: mongo:5.0
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

kubectl apply -f mongodb-direct.yaml

# Step 5: Create a MongoDB user for the application
echo -e "\nSetting up MongoDB user (this may take a minute)..."
sleep 20  # Give MongoDB time to start

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
        image: mongo:5.0
        command: ["mongosh", "--host", "mongodb", "--username", "root", "--password", "mongodb-root-password", "--authenticationDatabase", "admin", "--file", "/script/mongo-setup.js"]
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

# Step 6: Update the API ConfigMap with the correct MongoDB URI
echo -e "\nUpdating API ConfigMap with MongoDB connection string..."
sleep 10  # Give the job time to start

kubectl patch configmap familycabin-config -n familycabin --type=merge -p "{\"data\":{\"MONGODB_URI\":\"mongodb://familycabin:mongodb-password@mongodb.familycabin-db.svc.cluster.local:27017/familycabin\"}}"

# Step 7: Restart the API deployment (and clean up old pods)
echo -e "\nCleaning up old API pods..."
kubectl delete pods -l app=familycabin-api -n familycabin --grace-period=0 --force

echo -e "\nRestarting API deployment..."
kubectl rollout restart deployment familycabin-api -n familycabin

echo -e "\n=== DEPLOYMENT STATUS ==="
echo "Check MongoDB pod status:"
kubectl get pods -n familycabin-db

echo -e "\nCheck API pod status:"
kubectl get pods -n familycabin

echo -e "\nSetup complete! It may take a minute for all pods to stabilize."
echo "Run these commands to monitor progress:"
echo "kubectl get pods -n familycabin-db"
echo "kubectl get pods -n familycabin"