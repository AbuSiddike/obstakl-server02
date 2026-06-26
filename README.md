# Obstakl - Property Rental & Booking Platform (Backend Server)

This is the backend server for **Obstakl**, a property rental and booking marketplace that connects tenants and property owners through a transparent and secure platform. It features modular architecture, role-based access control, secure payment integration, review systems, and administrative moderation.

## Key Features
- **Modular Architecture**: Built with scalable structure dividing controllers, routes, middlewares, config, and utils.
- **Authentication & Authorization**: Session-based JWT token generation (with cookie/header support) and social login capability.
- **Role-Based Access Control (RBAC)**: Custom middlewares protecting routes based on roles: `Tenant`, `Owner`, and `Admin`.
- **Property Management**: Advanced searching by location, type-filtering, sorting, and pagination implemented directly on the backend database queries.
- **Stripe Payments**: End-to-end integration for secure reservation fee payments.
- **Moderation Workflow**: Admin review system allowing approval or rejection of properties with detailed feedback. Owners can view rejection feedback immediately.
- **Analytics Dashboard**: Aggregated earnings, properties, and bookings overview with 12-month analytics.
- **Optional Feature Accomplished**: Dynamic PDF generation for monthly earnings and booking summaries using PDFKit.

## Tech Stack & Libraries
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (using native `mongodb` driver)
- **Security & Auth**: `jsonwebtoken`, `bcryptjs`, `cookie-parser`
- **Payment Gateway**: `stripe`
- **PDF Report Generation**: `pdfkit`
- **Development Tooling**: `nodemon`, `dotenv`, `cors`

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or a local MongoDB database instance.

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd obstakl-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
Create a `.env` file in the root directory and define the variables as detailed in `.env.example`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
CLIENT_URL=http://localhost:5173
```

### Seeding the Database
To populate the database with test users, properties (approved, pending, rejected), reviews, and booking transactions under the database `'obstakl'`:
```bash
node seed.js
```
#### Seeded User Credentials:
- **Admin**: `admin@obstakl.com` / `adminpassword123`
- **Owner**: `owner@obstakl.com` / `ownerpassword123`
- **Tenant**: `tenant@obstakl.com` / `tenantpassword123`

### Running the Server
- **Development mode** (with hot reloading):
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```

---

## API Documentation
Please refer to the [API.md](./API.md) file for a detailed overview of all routes, payloads, request bodies, query params, and responses.
