import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // =============State variables================

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [currentView, setCurrentView] = useState("products");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authVersion, setAuthVersion] = useState(0);
  const [allCarts, setAllCarts] = useState([]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newImage, setNewImage] = useState("");
  const storedUsername = localStorage.getItem("username");

  const [adminTab, setAdminTab] = useState("users");


  //===============Auth AND token helpers====================

  const token = localStorage.getItem("token");

  const isLoggedIn = () => !!localStorage.getItem("token");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };
  

  // =================Derived variables=================

  const filteredProducts = products.filter((p) => {
    const matchCategory = category === "All" || p.category === category;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
  return matchCategory && matchSearch;
  });

  const totalPrice = (cart || []).reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const grouped = allCarts.reduce((acc, item) => {
    if (!acc[item.username]) {
      acc[item.username] = [];
    }
    acc[item.username].push(item);
    return acc;
  }, {});


  // ================Debugging logs=====================
  
  if (!token) {
  console.log("NO TOKEN FOUND — USER NOT LOGGED IN");
  }



 // =================Initial data fetch=================

  useEffect(() => {
   fetch("http://127.0.0.1:8000/products")
     .then(res => res.json())
     .then(data => setProducts(data));

   const token = localStorage.getItem("token");

   if (!token) {
    setCart([]);
    return;
   }

   fetch("http://127.0.0.1:8000/cart", {
     headers: {
       Authorization: `Bearer ${token}`,
     },
   })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => setCart(data))
    .catch(() => setCart([]));
  }, [authVersion]);

 // ==============Admin data fetch===========================

 useEffect(() => {
   if (currentView !== "admin") return;

   fetch("http://127.0.0.1:8000/admin/carts", {
     headers: getAuthHeaders()
   })
    .then(res => res.json())
    .then(data => setAllCarts(data))
    .catch(err => console.log(err));

 }, [currentView]);




 // =================Cart operations===================

 function refreshCart() {
   const token = localStorage.getItem("token");
   if (!token) return;

   fetch("http://127.0.0.1:8000/cart", {
     headers: getAuthHeaders()
    })
    .then((res) => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then((data) => setCart(data))
    .catch(() => setCart([]));
  }


  function addToCart(product) {
   if (!isLoggedIn()) {
     showAuthMessage("Please log in first");
   return;
 }

   const existingItem = cart.find(item => item.product_id === product.id);

   const url = existingItem
    ? `http://127.0.0.1:8000/cart/add/${product.id}`
    : `http://127.0.0.1:8000/cart?product_id=${product.id}`;

  const method = existingItem ? "PUT" : "POST";

  fetch(url, {
    method,
    headers: getAuthHeaders()
  })
    .then(res => {
      if (!res.ok) throw new Error("Cart update failed");
      return res.json();
    })
    .then(() => {
      refreshCart();
    })
    .catch(err => {
      console.error(err);
      showAuthMessage("Could not update cart");
    });
 }



  function removeFromCart(productId) {
    fetch(`http://127.0.0.1:8000/cart/${productId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    })
    .then(res => {
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    })
    .then(() => {
      refreshCart();
    })
    .catch(err => {
      console.error(err);
      showAuthMessage("Failed to remove item");
    });
 }



  function updateQuantity(productId, newQty) {
  if (newQty < 1) return;
  if (newQty > 100) newQty = 100;

  fetch(`http://127.0.0.1:8000/cart/${productId}?quantity=${newQty}`, {
    method: "PUT",
    headers: getAuthHeaders()
  })
    .then(res => {
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    })
    .then(() => {
      refreshCart();
    })
    .catch(err => {
      console.error(err);
      showAuthMessage("Could not update quantity");
    });
 } 






  // =================Auth operations=====================

 function login(username, password) {
  showAuthMessage("");

  fetch("http://127.0.0.1:8000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Invalid username or password");
      }

      return data;
    })
    .then(data => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", username);

      setUsername("");
      setPassword("");

      setAuthVersion(v => v + 1);
      setCurrentView("products");

      showAuthMessage("Login successful!");
    })
    .catch(err => {
      showAuthMessage(err.message);
    });
}



 function register(username, password) {
  showAuthMessage("");

  if (!username.trim() || !password.trim()) {
    showAuthMessage("Please fill in all fields");
    return;
  }

  if (password !== confirmPassword) {
    showAuthMessage("Passwords do not match");
    return;
  }

  fetch("http://127.0.0.1:8000/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  })
    .then(async (res) => {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail);
      }

      return data;
    })
    .then(() => {
      showAuthMessage("Account created successfully!");
      setConfirmPassword("");
    })
    .catch((err) => {
      showAuthMessage(err.message);
    });
}


 function logout() {
  localStorage.removeItem("token");
  setCart([]);
  setAuthVersion(v => v + 1);
  setUsername("");
  setPassword("");
  setConfirmPassword("");
  setCurrentView("products");
 }




 //UI
 function showAuthMessage(msg) {
  setAuthMessage(msg);

  setTimeout(() => {
    setAuthMessage("");
  }, 3000); 
 }




 // =================User helpers================

 function getUserRole() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.role;
 }

 function goToView(view) {
  setCurrentView(view);
  setUsername("");
  setPassword("");
  setConfirmPassword("");
 }




 // =================Admin operations================

 function addProduct() {
  fetch(
    `http://127.0.0.1:8000/admin/products?name=${newName}&price=${newPrice}&category=${newCategory}&image=${newImage}`,
    {
      method: "POST",
      headers: getAuthHeaders()
    }
  )
    .then(() => {
      setAuthVersion(v => v + 1);

      setNewName("");
      setNewPrice("");
      setNewCategory("");
      setNewImage("");
    });
 }



 function deleteProduct(productId) {
   fetch(`http://127.0.0.1:8000/admin/products/${productId}`, {
     method: "DELETE",
     headers: getAuthHeaders()
   })
     .then(res => {
       if (!res.ok) throw new Error("Delete failed");
       return res.json();
     })
     .then(() => {
       setAuthVersion(v => v + 1);
       refreshCart();
       showAuthMessage("Product deleted successfully!");
     })
     .catch(err => {
       console.error(err);
       showAuthMessage("Failed to delete product");
     });
  }











 // =====================================Main render logic=======================================



//Login Page

 if (currentView === "login") {
  return (
    <div className="auth-page">

       {authMessage && (
           <p className="auth-toast">{authMessage}</p>
          )}
          
      <div className="auth-box">

        <h1>Login</h1>

        <div className="auth-form">

          <input
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={() => login(username, password)}>
            Login
          </button>

          <p>Don't have an account?</p>

          <button onClick={() => goToView("register")}>
            Register
          </button>
          <span className="back-link" onClick={() => goToView("products")}>Back</span>
        </div>

      </div>
    </div>
  );
 }




 // Registration page
 if (currentView === "register") {
  return (
    <div className="auth-page">

       {authMessage && (
           <p className="auth-toast">{authMessage}</p>
          )}


      <div className="auth-box">

        <h1>Register</h1>

        <div className="auth-form">
          <input
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button onClick={() => register(username, password)}>Sign Up</button>

          <p>Already have an account?</p>

          <button onClick={() => goToView("login")}>Login</button>

          <span className="back-link" onClick={() => goToView("products")}>Back</span>

        </div>

      </div>
    </div>
  );
 }



// Admin dashboard
 if (currentView === "admin") {
  return (
    <div className="admin-layout">

      
      <div className="admin-sidebar">
       <h2>Admin</h2>

       <div className="admin-menu">
         <div className={`admin-item ${adminTab === "users" ? "active" : ""}`}
          onClick={() => setAdminTab("users")} >
         User Carts
       </div>

       <div className={`admin-item ${adminTab === "products" ? "active" : ""}`}
         onClick={() => setAdminTab("products")} >
         Add Products
       </div>
     </div>


     <div className="admin-bottom">
       <div className="admin-item exit" 
         onClick={() => setCurrentView("products")} >
         Back to Store
        </div>
     </div>
     </div>

      
     <div className="admin-content">

       <div className="admin-header">
         <h1>Dashboard</h1>
       </div>

       {adminTab === "users" && (
         <div className="admin-table">
            {Object.entries(grouped).map(([username, items]) => (
              <div key={username} className="admin-user-card">

                <h2 className="admin-username">{username}</h2>

                <div className="admin-table-header">
                  <span>Product</span>
                  <span>Quantity</span>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="admin-table-row">
                    <span>{item.product}</span>
                    <span>{item.quantity}</span>
                  </div>
                ))}

              </div>
              ))}

          </div>
        )}

       {adminTab === "products" && (
          <div className="admin-product-form">

            <input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />

            <input
              placeholder="Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />

            <input
              placeholder="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <input
              placeholder="Image"
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
            />

            <button onClick={addProduct}>Add Product</button>

          </div>
        )}

      </div>

    </div>
  );
 }



 // Product page
 if (currentView === "products") {
  return (
    <div>

      {authMessage && (
        <p className="auth-toast">{authMessage}</p>
      )}

      <header className="header">

        <h1 className="logo">Wool Market</h1>

        

        <input
          type="text"
          placeholder="Whatever you're looking for :)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
        />

        <div className="header-buttons">

          {token && (
           <span className="hello-user">Hello, {localStorage.getItem("username")} !</span>
  )}

          {getUserRole() === "admin" && (
            <button className="login-btn"
             onClick={() => setCurrentView("admin")}>Admin Panel</button>
          )}

          {!token ? (
           <button
             className="login-btn"
             onClick={() => setCurrentView("login")}> Login / Sign Up</button>
           ) : (
           <button className="login-btn"
             onClick={logout}>Logout</button>
          )}

         <button className="cart-btn"
           onClick={() => setCurrentView("cart")} >🛒 ({cart.reduce((t, i) => t + i.quantity, 0)})</button>
       </div>
      
      </header>

      <div className="categories">
         <div className="category-bar">
            <button onClick={() => setCategory("All")}>All</button>
            <button onClick={() => setCategory("Produce")}>Fruit & Veg</button>
            <button onClick={() => setCategory("Dairy")}>Dairy</button>
            <button onClick={() => setCategory("Bakery")}>Bakery</button> 
            <button onClick={() => setCategory("Snacks")}>Snacks</button>
            <button onClick={() => setCategory("Drinks")}>Drinks</button>
            <button onClick={() => setCategory("Pantry")}>Pantry</button>
         </div>
       </div>

       <div className="product-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">

              <img
                src={`/images/${product.image}`}
                alt={product.name}
                className="product-image"
              />

             <p><strong>{product.name}</strong></p>
             <p>${product.price.toFixed(2)}</p>
             <p className="category">{product.category}</p>

             <button
              className="add-btn"
              onClick={() => addToCart(product)}>Add to Basket</button>

             {getUserRole() === "admin" && (
               <button className="delete-btn"
                 onClick={() => deleteProduct(product.id)}>Delete</button>
              )}

            </div>
          ) )}
       </div>

    </div>
   );
  }



 // Cart page
 return (
  <div className="cart-page">

    <div className="cart-header">

      <button className="back-btn"
         onClick={() => setCurrentView("products")}>← Back</button>

      <h1>Cart</h1>

    </div>

    <div className="cart-items">

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        cart.map((item) => { 
          const product = products.find((p) => p.id === item.product_id);

          return (
            <div key={item.product_id} className="cart-item">

              <img src={`/images/${product?.image}`}
                className="cart-item-image"
              />

              <div className="cart-item-details">
                <p><strong>{product?.name || item.name}</strong></p>
                <p>
                  ${((item.price || 0) * item.quantity).toFixed(2)}
                </p>
              </div>

              <div className="cart-item-buttons">

                <button onClick={() => 
                {if (item.quantity >= 100) return;
                fetch(`http://127.0.0.1:8000/cart/add/${item.product_id}`,
                      {method: "PUT",headers: getAuthHeaders()}
                    ).then(refreshCart);}}>+</button>

                <input className="quantity-box"
                 type="number"
                 min="1"
                 max="100"
                 value={item.quantity}
                 onChange={(e) => {
                   let newQty = Number(e.target.value);

                   if (newQty < 1) newQty = 1;
                   if (newQty > 100) newQty = 100;

                   fetch( `http://127.0.0.1:8000/cart/${item.product_id}?quantity=${newQty}`,
                     {method: "PUT",headers: getAuthHeaders()}).then(refreshCart);}}
               />

                <button onClick={() =>
                    { if (item.quantity <= 1) return;
                    fetch(`http://127.0.0.1:8000/cart/remove/${item.product_id}`,
                      {method: "PUT",headers: getAuthHeaders()}
                    ).then(refreshCart);}}>-</button>

                <button onClick={() => removeFromCart(item.product_id)}>Remove</button>

              </div>

            </div>
          );
        })
      )}

    </div>

    <div className="cart-footer">
      Total: ${totalPrice.toFixed(2)}
    </div>

  </div>
 );
 
}

export default App;
