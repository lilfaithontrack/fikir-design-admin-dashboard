# Fikir Design Admin Dashboard - API Documentation

This document describes all API endpoints available in the Fikir Design Admin Dashboard.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API does not require authentication. In production, implement JWT or session-based authentication.

---

## Categories API

### Get Categories
```
GET /api/categories
```

**Query Parameters:**
- `tree` (boolean, optional): Set to `true` to return nested tree structure
- `type` (string, optional): Filter by type (`product_type`, `category`, `subcategory`)
- `parentId` (number, optional): Get children of specific parent

**Response:** Array of categories or nested tree

**Example:**
```bash
curl http://localhost:3000/api/categories?tree=true
```

### Create Category
```
POST /api/categories
```

**Body:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "categoryType": "subcategory",
  "parentId": 3,
  "sortOrder": 1
}
```

**Response:** Created category object

### Update Category
```
PUT /api/categories
```

**Body:** Category update data with `id` field

**Response:** Updated category object

### Delete Category
```
DELETE /api/categories?id=<category_id>
```

**Response:** Success message

### Get Single Category
```
GET /api/categories/[id]
```

**Response:** Category with full path (breadcrumb)

### Move Category
```
PATCH /api/categories/[id]
```

**Body:**
```json
{
  "action": "move",
  "parentId": 3
}
```

**Response:** Updated category

### Reorder Categories
```
PATCH /api/categories/[id]
```

**Body:**
```json
{
  "action": "reorder",
  "categoryIds": [1, 2, 3, 4]
}
```

**Response:** Success message

---

## Users API

### Get Users
```
GET /api/users
```

**Query Parameters:**
- `role` (string, optional): Filter by role
- `isActive` (boolean, optional): Filter by active status

**Response:** Array of users (without password)

**Example:**
```bash
curl http://localhost:3000/api/users?role=admin
```

### Create User
```
POST /api/users
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+251911234567",
  "role": "staff",
  "isActive": true
}
```

**Response:** Created user object (without password)

### Get Single User
```
GET /api/users/[id]
```

**Response:** User object

### Update User
```
PUT /api/users/[id]
```

**Body:** User update data (password will be hashed automatically)

**Response:** Updated user object

### Delete User
```
DELETE /api/users/[id]
```

**Response:** Success message

---

## Products API

### Get Products
```
GET /api/products
```

**Query Parameters:**
- `categoryId` (number, optional): Filter by category
- `productTypeId` (number, optional): Filter by product type
- `status` (string, optional): Filter by status
- `search` (string, optional): Search in name and SKU
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:** 
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/products?categoryId=5&page=1&limit=10
```

### Create Product
```
POST /api/products
```

**Body:**
```json
{
  "name": "Traditional Habesha Kemis",
  "slug": "traditional-habesha-kemis",
  "descriptionShort": "Beautiful traditional dress",
  "descriptionDetailed": "Full description...",
  "sku": "HK-001",
  "basePrice": 2500.00,
  "categoryId": 12,
  "productTypeId": 3,
  "status": "active",
  "requiresShipping": true,
  "weight": 0.5,
  "weightUnit": "kg"
}
```

**Response:** Created product with relations

### Get Single Product
```
GET /api/products/[id]
```

**Response:** Product with all relations (images, variants, inventory, etc.)

### Update Product
```
PUT /api/products/[id]
```

**Body:** Product update data

**Response:** Updated product

### Delete Product
```
DELETE /api/products/[id]
```

**Response:** Success message

---

## Product Types API

### Get Product Types
```
GET /api/product-types
```

**Query Parameters:**
- `isActive` (boolean, optional): Filter by active status

**Response:** Array of product types with product count

**Example:**
```bash
curl http://localhost:3000/api/product-types?isActive=true
```

### Create Product Type
```
POST /api/product-types
```

**Body:**
```json
{
  "name": "shirt",
  "displayName": "Shirt",
  "description": "Standard shirt",
  "icon": "shirt",
  "hasVariants": true,
  "hasSize": true,
  "hasColor": true,
  "sizeOptions": ["XS", "S", "M", "L", "XL", "XXL"],
  "colorOptions": ["White", "Black", "Blue", "Red"],
  "isActive": true,
  "sortOrder": 1
}
```

**Response:** Created product type

---

## Customers API

### Get Customers
```
GET /api/customers
```

**Query Parameters:**
- `search` (string, optional): Search in name, email, phone
- `status` (string, optional): Filter by status
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:** 
```json
{
  "customers": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Example:**
```bash
curl http://localhost:3000/api/customers?search=john
```

### Create Customer
```
POST /api/customers
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+251911234567",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "status": "active",
  "notes": "VIP customer"
}
```

**Response:** Created customer

### Get Single Customer
```
GET /api/customers/[id]
```

**Response:** Customer with recent orders (last 10)

### Update Customer
```
PUT /api/customers/[id]
```

**Body:** Customer update data

**Response:** Updated customer

### Delete Customer
```
DELETE /api/customers/[id]
```

**Response:** Success message

---

## Orders API

### Get Orders
```
GET /api/orders
```

**Query Parameters:**
- `status` (string, optional): Filter by status
- `customerId` (number, optional): Filter by customer
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:** 
```json
{
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Order Status Options:**
- `pending`
- `assigned`
- `design_in_progress`
- `design_completed`
- `sewing_in_progress`
- `sewing_completed`
- `quality_check`
- `quality_passed`
- `ready_for_delivery`
- `delivery_in_progress`
- `delivered`
- `cancelled`
- `on_hold`

**Example:**
```bash
curl http://localhost:3000/api/orders?status=pending
```

### Create Order
```
POST /api/orders
```

**Body:**
```json
{
  "orderNumber": "ORD-2024-001",
  "customerId": 1,
  "status": "pending",
  "subtotal": 5000.00,
  "tax": 500.00,
  "shipping": 200.00,
  "discount": 0,
  "total": 5700.00,
  "currency": "ETB",
  "notes": "Urgent order",
  "items": [
    {
      "productId": 1,
      "name": "Habesha Kemis",
      "sku": "HK-001",
      "quantity": 2,
      "price": 2500.00,
      "discount": 0,
      "tax": 250.00,
      "total": 5250.00
    }
  ]
}
```

**Response:** Created order with items

### Get Single Order
```
GET /api/orders/[id]
```

**Response:** Order with customer and items

### Update Order
```
PATCH /api/orders/[id]
```

**Body:** Order update data (typically status updates)

**Response:** Updated order

**Example:**
```json
{
  "status": "design_in_progress",
  "notes": "Started design work"
}
```

### Delete Order
```
DELETE /api/orders/[id]
```

**Response:** Success message

---

## Inventory API

### Get Inventory
```
GET /api/inventory
```

**Query Parameters:**
- `productId` (number, optional): Filter by product
- `lowStock` (boolean, optional): Set to `true` to get low stock items

**Response:** Array of inventory records with product details

**Example:**
```bash
curl http://localhost:3000/api/inventory?lowStock=true
```

### Create Inventory
```
POST /api/inventory
```

**Body:**
```json
{
  "productId": 1,
  "quantity": 50,
  "lowStockThreshold": 10
}
```

**Response:** Created inventory record

### Update Inventory
```
PUT /api/inventory
```

**Body:** Inventory update data with `id` field

**Response:** Updated inventory record

---

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Pagination

List endpoints support pagination with the following parameters:
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response includes:**
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Filtering & Search

Most list endpoints support filtering and search through query parameters:
- Filter by specific fields (e.g., `status`, `categoryId`)
- Search across multiple fields using `search` parameter
- Boolean filters use string values `"true"` or `"false"`

---

## Date/Time Format

All datetime fields are returned in ISO 8601 format:
```
2024-01-15T10:30:00.000Z
```

---

## Currency

All monetary values are in Ethiopian Birr (ETB) by default. Currency field can be specified per order.

---

## Next Steps

1. Implement authentication middleware
2. Add rate limiting
3. Implement request validation
4. Add API versioning
5. Create API documentation with Swagger/OpenAPI
6. Add webhook support for real-time updates
