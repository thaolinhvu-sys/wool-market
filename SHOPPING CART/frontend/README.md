# Wool Market - E-commerce Shopping Cart

## Summary
Wool Market is a full-stack e-commerce web application inspired by the supermarket brand 'Woolworths'. The app allows users to browse products, add items to a shopping cart, and manage quantities in real time.

The system supports:

User authentication (register/login using JWT)
Role-based access control (admin vs user)
Product browsing and filtering by category
Shopping cart management (add, update, remove items)
Admin dashboard for managing products and viewing user carts

The purpose of this project is to simulate a real-world online shopping system with secure authentication and full CRUD functionality.

## Workload Allocation
This is an individual project. 

## Technical stack
- *Frontend*: React (Vite), JavaScript (ES6), CSS
- *State Management*: React useState + conditional rendering
- *Backend*: FastAPI (Python), JWT authentication, bcrypt password hashing
- *Database*: MySQL
- *Tools*: Uvicorn, npm, dotenv, Postman

## How to run the project
### Backend
1. Navigate to backend folder
2. Install dependencies:
```bash
  pip install fastapi uvicorn mysql-connector-python bcrypt pyjwt python-dotenv
``` 
3. Start server:
```bash
  uvicorn main:app --reload
``` 

Backend runs on: http://127.0.0.1:8000

### Frontend
1. Navigate to frontend folder
2. Install dependencies: 
```bash
  npm install
```
3. Start frontend :
```bash
  npm run dev
```

Frontend runs on: http://localhost:5173


## Folder Structure

```text
SHOPPING CART/
│
├── backend/
│   ├── main.py  # FastAPI backend (routes, auth, cart logic)
│   ├── .env # Environment variables (DB password, secret key)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx # Main React application
│   │   ├── App.css # Styling
│   │
│   ├── public/
│   │   ├── images/  # Product images
│   │
│   ├── package.json # Frontend dependencies
│   ├── README.md
│    
├── shopping_cart_db.sql # SQL script to create database and tables
```

## Features
- User authentication (JWT login/register)
- Role-based access control (admin/user)
- Product browsing with category filtering
- Shopping cart management (add, update, remove items)
- Admin dashboard for product and cart management
