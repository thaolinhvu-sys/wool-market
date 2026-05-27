from fastapi import FastAPI, Query, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import mysql.connector
import os
from dotenv import load_dotenv

import bcrypt
import jwt
from datetime import datetime, timedelta


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        return payload
    
    except jwt.ExpiredSignatureError:
     raise HTTPException(status_code=401, detail="Token expired")
    
    except jwt.InvalidTokenError:
     raise HTTPException(status_code=401, detail="Invalid token")
    

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password=os.getenv("db_password"),
        database="shopping_cart_db"
    )






#===================== HEALTH CHECK ======================

@app.get("/")
def home():
    return {"message": "backend is working"}



#======================== PRODUCTS ===========================

@app.get("/products")
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    cursor.close()
    conn.close()
    return products



#========================== AUTH ============================


#Login

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
def login(data: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM users WHERE username = %s", (data.username,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not bcrypt.checkpw(data.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = jwt.encode(
    {
        "user_id": user["id"],
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(hours=2)
    },
    SECRET_KEY,
    algorithm=ALGORITHM
)

    return {"token": token}



#Register

class RegisterRequest(BaseModel):
    username: str
    password: str

@app.post("/register")
def register(data: RegisterRequest):
    
    username = data.username.strip()
    password = data.password.strip()

    if not username or not password:
        raise HTTPException(status_code=400,detail="Username and password required")

    if len(password) < 6:
        raise HTTPException(status_code=400,detail="Password must be at least 6 characters")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE username = %s",
        (username,)
    )

    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        conn.close()

        raise HTTPException(status_code=400,detail="Username already exists")

    hashed = bcrypt.hashpw(password.encode(),bcrypt.gensalt())

    cursor.execute(
        "INSERT INTO users (username, password) VALUES (%s, %s)",
        (username, hashed.decode())
    )

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "user created"}




#=========================== CART ================================


#Get cart

@app.get("/cart")
def get_cart(authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            cart_items.product_id,
            products.name,
            products.price,
            cart_items.quantity
        FROM cart_items
        JOIN products ON cart_items.product_id = products.id
        WHERE cart_items.user_id = %s
    """, (user_id,))
    cart = cursor.fetchall()
    cursor.close()
    conn.close()
    return cart




#Create cart item

@app.post("/cart")
def create_cart_item(product_id: int = Query(...), authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (%s, %s, 1)",
            (user_id, product_id)
        )
        conn.commit()
    except mysql.connector.IntegrityError:
        pass

    cursor.close()
    conn.close()

    print("DEBUG USER_ID:", user_id, type(user_id))

    return {"message": "created"}




#Update cart item quantity

@app.put("/cart/{product_id}")
def update_quantity(product_id: int, quantity: int = Query(...), authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE cart_items
        SET quantity = %s
        WHERE user_id = %s AND product_id = %s
    """, (quantity, user_id, product_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "updated"}



#Increment quantity

@app.put("/cart/add/{product_id}")
def increment_quantity(product_id: int, authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    # check current quantity
    cursor.execute("""
        SELECT quantity FROM cart_items
        WHERE user_id = %s AND product_id = %s
    """, (user_id, product_id))

    row = cursor.fetchone()

    if row and row[0] >= 100:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Max quantity is 100")

    # increment safely
    cursor.execute("""
        UPDATE cart_items
        SET quantity = quantity + 1
        WHERE user_id = %s AND product_id = %s
    """, (user_id, product_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "incremented"}



#Decrement quantity

@app.put("/cart/remove/{product_id}")
def decrement_quantity(product_id: int, authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE cart_items
        SET quantity = quantity - 1
        WHERE product_id = %s AND user_id = %s AND quantity > 1
    """, (product_id, user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "quantity decreased"}



#Delete cart item

@app.delete("/cart/{product_id}")
def delete_cart_item(product_id: int, authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM cart_items
        WHERE product_id = %s AND user_id = %s
    """, (product_id, user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {"message": "deleted"}




#========================= ADMIN =============================

#Get all carts

@app.get("/admin/carts")
def get_all_carts(authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            users.username,
            products.name AS product,
            products.price,
            cart_items.quantity
        FROM users
        LEFT JOIN cart_items ON users.id = cart_items.user_id
        LEFT JOIN products ON products.id = cart_items.product_id
        ORDER BY users.username;
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data



#Create product

@app.post("/admin/products")
def create_product(
    name: str = Query(...),
    price: float = Query(...),
    category: str = Query(...),
    image: str = Query(...),
    authorization: str = Header(None)
):
    user = get_current_user(authorization)

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO products (name, price, category, image)
        VALUES (%s, %s, %s, %s)
    """, (name, price, category, image))

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Product created"}



#Delete product

@app.delete("/admin/products/{product_id}")
def delete_product(
    product_id: int,
    authorization: str = Header(None)
):
    user = get_current_user(authorization)

    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM cart_items WHERE product_id = %s",
        (product_id,)
    )

    cursor.execute(
        "DELETE FROM products WHERE id = %s",
        (product_id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {"message": "Product deleted"}