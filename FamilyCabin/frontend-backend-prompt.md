# FamilyCabin.io Frontend and Backend Development Prompt

## Project Context

We've successfully deployed the infrastructure for FamilyCabin.io, a web application for families who share vacation properties. The application includes the following components:

- Kubernetes deployments for API and Frontend services (currently using NGINX placeholders)
- MongoDB 4.4 database with authentication
- PersistentVolumeClaims for application and database storage
- Ingress configuration with TLS
- ConfigMaps and Secrets for environment variables

Now, we need to develop the actual frontend and backend code to implement the application features.

## Required Features

FamilyCabin.io should include the following key features:

### Core Features
1. Shared calendar for booking and viewing property usage
2. Notice board for important announcements
3. Document storage for procedures, manuals, and important documents
4. Message board with photo support for family communication
5. Guest book with PIN-protected access for visitors
6. Single Sign-On (SSO) authentication with Google, Apple, and Facebook
7. User management and permissions
8. Responsive design that works on both desktop and mobile

### Tech Stack Requirements

**Backend (API Service)**:
- Node.js with Express.js
- MongoDB for data storage
- JWT for authentication
- RESTful API design
- File upload capability
- Unit tests

**Frontend**:
- React.js single-page application
- React Router for navigation
- Redux or Context API for state management
- UI component library (e.g., Material-UI, Tailwind CSS)
- Responsive design
- Form validation
- Unit tests

## Infrastructure Integration Points

The application should integrate with the existing infrastructure:

- **MongoDB Connection**: Use the connection string from the ConfigMap
  ```
  mongodb://familycabin:mongodb-password@mongodb.familycabin-db.svc.cluster.local:27017/familycabin
  ```

- **File Storage**: Use the mounted path at `/app/storage` for file uploads

- **Environment Variables**: Access variables from the ConfigMap and Secrets

- **Authentication**: Implement SSO using the credentials that will be provided in Secrets

## Development Requirements

### Backend (API Service)

1. **Project Structure**:
   - Create a well-organized Node.js/Express project structure
   - Implement middleware for authentication, error handling, etc.
   - Create models, controllers, and routes for each feature

2. **API Endpoints**:
   - Authentication (login, logout, register, SSO)
   - User management (profile, permissions)
   - Calendar events (CRUD operations)
   - Notices (CRUD operations)
   - Documents (upload, download, metadata CRUD)
   - Messages (CRUD operations, photo uploads)
   - Guest book (entries with PIN protection)

3. **Authentication**:
   - Implement JWT-based authentication
   - Set up OAuth for Google, Facebook, and Apple SSO
   - Create middleware to verify authentication and permissions

4. **File Handling**:
   - Implement secure file upload functionality
   - Generate and store metadata for uploaded files
   - Create API endpoints for file download

5. **Database Design**:
   - Create MongoDB schemas for all entities
   - Implement data validation
   - Set up indexes for performance

6. **Dockerfile**:
   - Create a Dockerfile for the API service
   - Ensure it follows best practices for Node.js applications

### Frontend (React Application)

1. **Project Structure**:
   - Create a well-organized React project structure
   - Set up component hierarchy
   - Implement state management (Redux or Context API)

2. **UI Components**:
   - Dashboard with overview of all features
   - Calendar component for booking and viewing
   - Notice board component
   - Document repository component
   - Message board component with photo display
   - Guest book component
   - User profile and settings component

3. **Authentication UI**:
   - Login and registration forms
   - SSO buttons for Google, Facebook, and Apple
   - Authentication state management

4. **File Handling UI**:
   - File upload components with preview
   - File download functionality
   - Document viewing

5. **Responsive Design**:
   - Ensure the application works well on both desktop and mobile devices
   - Implement responsive UI components

6. **Dockerfile**:
   - Create a Dockerfile for the frontend
   - Configure NGINX to serve the React application and proxy API requests

## Brand Requirements

The design should follow these brand guidelines:

- **Theme**: Family and outdoors centric
- **Color Scheme**: Should capture the "family lake vibe"
- **Look and Feel**: Warm, inviting, and easy to use

## Deliverables

1. **Backend (API Service)**:
   - Complete Node.js/Express application code
   - API documentation (Swagger or similar)
   - Unit tests
   - Dockerfile

2. **Frontend**:
   - Complete React application code
   - Component documentation
   - Unit tests
   - Dockerfile

3. **Deployment Instructions**:
   - How to build and push Docker images
   - How to update Kubernetes deployments
   - Environment variable configuration

4. **User Guide**:
   - Documentation for end users
   - Feature overview and instructions

## Additional Context

The application will initially run on-premises but may be migrated to AWS Cloud if it gains traction. Please ensure that the code is written with cloud migration in mind.

The existing infrastructure is running on a Kubernetes cluster with the following characteristics:
- RKE2 Cluster hosted on ProxMox
- Managed by Rancher
- Using MetalLB for Load-Balancing
- Wildcard TLS certificate
- CloudFlare for domain registration, external DNS, and CDN
- Prometheus/Grafana and Zabbix for observability

Please provide a detailed implementation of both the frontend and backend components according to these requirements.
