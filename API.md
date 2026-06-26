# Obstakl Property Rental & Booking Platform - API Documentation

This document lists all available endpoints of the Obstakl backend API, including payload structures, descriptions, and required permissions.

## Base URL
```
http://localhost:5000/api
```

---

## 1. Authentication & Session Management
gets Token and keys from frontend server. Frontend will use JWT plugin with better auth. Backend will validate using jose.

Example:

### Get Token
* **URL:** http://<Frontend-domain>/token
* **Method:** `GET`
* **Response:**
```json
  { 
    "token": "ey..."
  }
```

### Get JWKS
* **URL:** http://<Frontend-domain>/api/auth/jwks
* **Method:** `GET`
* **Response:**
```json
   {
    "keys": [
        {
            "crv": "Ed25519",
            "x": "bDHiLTt7u-VIU7rfmcltcFhaHKLVvWFy-_csKZARUEU",
            "kty": "OKP",
            "kid": "c5c7995d-0037-4553-8aee-b5b620b89b23"
        }
    ]
  }
```

---

## 2. Properties Management

### Get Properties (Filter, Search, Sort & Paginate)
* **URL:** `/properties`
* **Method:** `GET`
* **Access:** Public
* **Query Parameters:**
  * `search` or `location`: Partial string search on location (e.g. `New York`).
  * `propertyType`: String (e.g. `Apartment`, `House`, `Condo`).
  * `minPrice`: Number.
  * `maxPrice`: Number.
  * `sort`: String (`priceAsc` / `priceDesc` or `lowToHigh` / `highToLow`).
  * `page`: Number (Defaults to `1`).
  * `limit`: Number (Defaults to `9`).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Properties fetched successfully",
  "data": [
    {
      "_id": "60c72b2f9b1d8b2bad683f2c",
      "title": "Modern Luxury Penthouse",
      "description": "Penthouse in downtown Manhattan...",
      "location": "Manhattan, New York",
      "propertyType": "Apartment",
      "rent": 4500,
      "rentType": "Monthly",
      "bedrooms": 3,
      "bathrooms": 3.5,
      "propertySize": 2200,
      "amenities": ["Gym", "Pool", "Elevator"],
      "images": ["https://example.com/img1.jpg"],
      "extraFeatures": { "parking": 2 },
      "status": "Approved",
      "rejectionFeedback": "",
      "owner": {
        "id": "60c72b2f9b1d8b2bad683f2d",
        "name": "Alice Owner",
        "email": "owner@obstakl.com"
      },
      "createdAt": "2026-06-18T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 9,
    "totalPages": 1
  }
}
```

### Get Featured Properties
* **URL:** `/properties/featured`
* **Method:** `GET`
* **Access:** Public (Returns up to 6 approved properties)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Featured properties fetched successfully",
  "data": [ ... ]
}
```

### Add Property
* **URL:** `/properties`
* **Method:** `POST`
* **Access:** Private (Role restriction: **Owner**)
* **Payload Structure:**
```json
{
  "title": "Luxury Penthouse",
  "description": "High end rooftop penthouse...",
  "location": "Miami, Florida",
  "propertyType": "Apartment",
  "rent": 5000,
  "rentType": "Monthly",
  "bedrooms": 3,
  "bathrooms": 3,
  "propertySize": 2500,
  "amenities": ["Pool", "Gym", "Private Parking"],
  "images": ["https://example.com/p1.jpg"],
  "extraFeatures": { "pets": true }
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Property listed successfully and is pending approval",
  "data": {
    "title": "Luxury Penthouse",
    "description": "High end rooftop penthouse...",
    "location": "Miami, Florida",
    "propertyType": "Apartment",
    "rent": 5000,
    "rentType": "Monthly",
    "bedrooms": 3,
    "bathrooms": 3,
    "propertySize": 2500,
    "amenities": ["Pool", "Gym", "Private Parking"],
    "images": ["https://example.com/p1.jpg"],
    "extraFeatures": { "pets": true },
    "status": "Pending",
    "rejectionFeedback": "",
    "owner": {
      "id": "60c72b2f9b1d8b2bad683f2d",
      "name": "Alice Owner",
      "email": "owner@obstakl.com"
    },
    "createdAt": "2026-06-18T13:00:00.000Z",
    "_id": "60c72b2f9b1d8b2bad683f2f"
  }
}
```

### Get Owner Listed Properties
* **URL:** `/properties/my-listings`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Owner**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "My properties fetched successfully",
  "data": [ ... ]
}
```

### Get Property by ID
* **URL:** `/properties/:id`
* **Method:** `GET`
* **Access:** Private (All logged-in roles can access)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Property fetched successfully",
  "data": {
    "_id": "60c72b2f9b1d8b2bad683f2c",
    "title": "Modern Luxury Penthouse",
    "status": "Approved",
    "rejectionFeedback": "",
    ...
  }
}
```

### Update Property
* **URL:** `/properties/:id`
* **Method:** `PUT`
* **Access:** Private (Role restriction: **Owner** of the property, or **Admin**)
* *Note: When an Owner updates their property, its status is automatically reset to "Pending" and "rejectionFeedback" is cleared.*
* **Payload Structure:** Same as addition (all fields optional).
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Property updated successfully",
  "data": { ... }
}
```

### Delete Property
* **URL:** `/properties/:id`
* **Method:** `DELETE`
* **Access:** Private (Role restriction: **Owner** of the property, or **Admin**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Property deleted successfully"
}
```

---

## 3. Booking & Payment Management

### Create Payment Intent
* **URL:** `/bookings/create-payment-intent`
* **Method:** `POST`
* **Access:** Private (Role restriction: **Tenant**)
* **Payload Structure:**
```json
{
  "propertyId": "60c72b2f9b1d8b2bad683f2c"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment intent created successfully",
  "data": {
    "clientSecret": "pi_3Mtwf2LkdIwHu7ix28a_secret_...",
    "paymentIntentId": "pi_3Mtwf2LkdIwHu7ix28a",
    "amount": 4500
  }
}
```

### Confirm Booking & Save Transaction
* **URL:** `/bookings/confirm`
* **Method:** `POST`
* **Access:** Private (Role restriction: **Tenant**)
* **Payload Structure:**
```json
{
  "propertyId": "60c72b2f9b1d8b2bad683f2c",
  "moveInDate": "2026-07-01T00:00:00.000Z",
  "contactNumber": "+1234567890",
  "additionalNotes": "Please leave keys under the doormat",
  "transactionId": "ch_3Mtwf2LkdIwHu7ix28a",
  "amountPaid": 4500
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Booking and transaction created successfully",
  "data": {
    "_id": "60c72b2f9b1d8b2bad683f3a",
    "propertyId": "60c72b2f9b1d8b2bad683f2c",
    "propertyName": "Modern Luxury Penthouse",
    "tenant": {
      "id": "60c72b2f9b1d8b2bad683f2a",
      "name": "John Tenant",
      "email": "john.tenant@example.com"
    },
    "owner": {
      "id": "60c72b2f9b1d8b2bad683f2d",
      "name": "Alice Owner",
      "email": "owner@obstakl.com"
    },
    "moveInDate": "2026-07-01T00:00:00.000Z",
    "contactNumber": "+1234567890",
    "additionalNotes": "Please leave keys under the doormat",
    "bookingStatus": "Pending",
    "paymentStatus": "Paid",
    "amountPaid": 4500,
    "transactionId": "ch_3Mtwf2LkdIwHu7ix28a",
    "createdAt": "2026-06-18T13:30:00.000Z"
  }
}
```

### Get My Bookings
* **URL:** `/bookings/my-bookings`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Tenant**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "My bookings fetched successfully",
  "data": [ ... ]
}
```

### Get Booking Requests
* **URL:** `/bookings/requests`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Owner**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking requests fetched successfully",
  "data": [ ... ]
}
```

### Update Booking Status (Approve / Reject Request)
* **URL:** `/bookings/:id/status`
* **Method:** `PATCH`
* **Access:** Private (Role restriction: **Owner** of property, or **Admin**)
* **Payload Structure:**
```json
{
  "status": "Approved" // Options: "Approved", "Rejected"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Booking request approved successfully",
  "data": { ... }
}
```

### Get Owner Dashboard Analytics
* **URL:** `/bookings/owner-analytics`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Owner**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Owner analytics fetched successfully",
  "data": {
    "totalEarnings": 4500,
    "totalProperties": 4,
    "totalBookings": 1,
    "monthlyEarningsChart": [
      { "name": "Jul 2025", "earnings": 0 },
      ...
      { "name": "Jun 2026", "earnings": 4500 }
    ]
  }
}
```

### Download Owner Monthly Earnings Report (PDF)
* **URL:** `/bookings/owner-report`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Owner**)
* **Description:** Stream or triggers download of styled PDF report.
* **Response:** File stream (Content-Type: `application/pdf`).

### Get All Bookings
* **URL:** `/bookings/all`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Admin**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All bookings fetched successfully",
  "data": [ ... ]
}
```

### Get All Transactions
* **URL:** `/bookings/transactions`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Admin**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All transactions fetched successfully",
  "data": [ ... ]
}
```

---

## 4. Reviews & Ratings

### Add Review
* **URL:** `/reviews`
* **Method:** `POST`
* **Access:** Private (Role restriction: **Tenant**)
* **Payload Structure:**
```json
{
  "propertyId": "60c72b2f9b1d8b2bad683f2c",
  "rating": 5, // Range: 1 - 5
  "comment": "Incredible penthouse! Alice was a lovely host."
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Review added successfully",
  "data": {
    "_id": "60c72b2f9b1d8b2bad683ff5",
    "propertyId": "60c72b2f9b1d8b2bad683f2c",
    "rating": 5,
    "comment": "Incredible penthouse! Alice was a lovely host.",
    "tenant": {
      "id": "60c72b2f9b1d8b2bad683f2a",
      "name": "John Tenant",
      "email": "john.tenant@example.com"
    },
    "createdAt": "2026-06-18T13:45:00.000Z"
  }
}
```

### Get Property Reviews
* **URL:** `/reviews/property/:propertyId`
* **Method:** `GET`
* **Access:** Public
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Property reviews fetched successfully",
  "data": [ ... ]
}
```

### Delete Review
* **URL:** `/reviews/:id`
* **Method:** `DELETE`
* **Access:** Private (Role restriction: **Tenant** who wrote it, or **Admin**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Review deleted successfully"
}
```

---

## 5. Favorites List

### Get Favorites List
* **URL:** `/favorites`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Tenant**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Favorites fetched successfully",
  "data": [
    {
      "_id": "60c72b2f9b1d8b2bad683faf",
      "tenantId": "60c72b2f9b1d8b2bad683f2a",
      "propertyId": "60c72b2f9b1d8b2bad683f2c",
      "createdAt": "2026-06-18T13:50:00.000Z",
      "property": {
        "_id": "60c72b2f9b1d8b2bad683f2c",
        "title": "Modern Luxury Penthouse",
        "rent": 4500,
        "location": "Manhattan, New York",
        "status": "Approved"
      }
    }
  ]
}
```

### Add to Favorites
* **URL:** `/favorites`
* **Method:** `POST`
* **Access:** Private (Role restriction: **Tenant**)
* **Payload Structure:**
```json
{
  "propertyId": "60c72b2f9b1d8b2bad683f2c"
}
```
* **Success Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Property added to favorites",
  "data": {
    "_id": "60c72b2f9b1d8b2bad683faf",
    "tenantId": "60c72b2f9b1d8b2bad683f2a",
    "propertyId": "60c72b2f9b1d8b2bad683f2c",
    "createdAt": "2026-06-18T13:50:00.000Z"
  }
}
```

### Remove from Favorites
* **URL:** `/favorites/:propertyId`
* **Method:** `DELETE`
* **Access:** Private (Role restriction: **Tenant**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Property removed from favorites"
}
```

---

## 6. Admin Panel Operations

### Get All Users
* **URL:** `/admin/users`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Admin**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All users fetched successfully",
  "data": [ ... ]
}
```

### Change User Role
* **URL:** `/admin/users/:id/role`
* **Method:** `PATCH`
* **Access:** Private (Role restriction: **Admin**)
* **Payload Structure:**
```json
{
  "role": "Owner" // Options: "Tenant", "Owner", "Admin"
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User role changed to Owner successfully",
  "data": { ... }
}
```

### Get All Properties (For Admin moderation)
* **URL:** `/admin/properties`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Admin**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All properties fetched for moderation",
  "data": [ ... ]
}
```

### Approve / Reject Property listing (Moderation)
* **URL:** `/admin/properties/:id/status`
* **Method:** `PATCH`
* **Access:** Private (Role restriction: **Admin**)
* **Payload Structure (for Approval):**
```json
{
  "status": "Approved"
}
```
* **Payload Structure (for Rejection - Requires feedback):**
```json
{
  "status": "Rejected",
  "rejectionFeedback": "Property is missing valid address and fire exit plan."
}
```
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Property status updated to Rejected successfully",
  "data": {
    "_id": "60c72b2f9b1d8b2bad683f2f",
    "title": "Industrial warehouse studio",
    "status": "Rejected",
    "rejectionFeedback": "Property is missing valid address and fire exit plan.",
    ...
  }
}
```

### Get General Dashboard Statistics
* **URL:** `/admin/stats`
* **Method:** `GET`
* **Access:** Private (Role restriction: **Admin**)
* **Success Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Admin stats fetched successfully",
  "data": {
    "users": { "total": 35 },
    "properties": {
      "total": 12,
      "pending": 2,
      "approved": 8,
      "rejected": 2
    },
    "bookings": {
      "total": 15,
      "approved": 10
    },
    "revenue": {
      "total": 38000
    }
  }
}
```
