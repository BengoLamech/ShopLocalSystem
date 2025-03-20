const path = require("path");
const Database = require("better-sqlite3");


// Database path (default to current directory for development)
const dbPath = process.env.DB_PATH || path.join(__dirname, "app.db");

let db: any;

// Initialize the database
try {
  // Open the database synchronously
  db = new Database(dbPath, { verbose: console.log }); 
  db.pragma("foreign_keys = ON"); // Enforce foreign key constraints
  console.log("Connected to SQLite database.");
} catch (error) {
  console.error("Error opening database:", error instanceof Error ? error.message : "Unknown error");
}


// Type Definitions
/**
 * @typedef {Object} SuccessResponse
 * @property {boolean} success
 * @property {string} [message]
 * @property {number} [userId]
 * @property {number} [productId]
 * @property {number} [saleId]
 * @property {Object} [user]
 */

interface SuccessResponse {
  success: boolean;
  message?: string;
  userId?: number;
  productId?: number;
  categoryId?: number;
  saleId?: number;
  user?: User;
}
interface SaleData { 
  id: number;             
  totalSales: number;
  productId: number;
  quantity: number;
  discount?: number;
  totalPrice: number;
  paymentMethod: string;
  saleDate?: string;
  isBulk?: boolean;
  bulkQuantity?: number;
  productName: string;    
}
interface SaleDataWithId extends SaleData {
  id: number;
  productName:string;
}
interface ShopOwner {
  shopName: string;
  kraPin: string;
  postalAddress: string;
  email: string;
  phone?: string; // Optional field
}
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}
// Product interface
interface Product {
  id: number; // Unique identifier for the product
  name: string; // Name of the product
  category_id: number; // Product category
  purchase_price: number; // Purchase price of the product
  selling_price: number; // Selling price of the product
  vat: number; // Value-added tax percentage
  stock_level: number; // Available stock level
  supplier_name: string; // Name of the supplier
}


// Table Creation Functions
const createUsersTable = (): void => {
  try {
    db.prepare(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'cashier'
      )`
    ).run();
  } catch (err) {
    console.error("Error creating users table:", err);
  }
};

const updateProductsTable = (): void => {
  try {
    // Check if the 'products' table exists
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();
    db.pragma("foreign_keys = OFF"); // Disable foreign key checks temporarily

    if (tableExists) {
      
      console.log("the table exist.");
    } else {
      console.log("'products' table does not exist, no need to drop.");
    }

    // Create the 'products' table with the correct schema
    db.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        purchase_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        vat INTEGER NOT NULL,
        stock_level INTEGER NOT NULL,
        supplier_name TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES product_categories(id)
      )
    `).run();
    console.log("Successfully recreated the 'products' table with the correct schema.");

    db.pragma("foreign_keys = ON"); // Re-enable foreign key checks

  } catch (err) {
    console.error("Error dropping and recreating 'products' table:", err);
    db.pragma("foreign_keys = ON"); // Ensure foreign keys are re-enabled in case of error
  }
};


const createSalesTable = (): void => {
  try {
    db.prepare(
      `CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        discount REAL NOT NULL,
        total_price REAL NOT NULL,
        payment_method TEXT NOT NULL,
        sale_date TEXT NOT NULL,
        is_bulk BOOLEAN NOT NULL DEFAULT 0,  
        bulk_quantity INTEGER NOT NULL DEFAULT 0, 
        FOREIGN KEY (product_id) REFERENCES products(id)
      )`
    ).run();
  } catch (err) {
    console.error("Error creating sales table:", err);
  }
};
// Product Categories Table
const createProductCategoriesTable = (): void => {
  try {
    db.prepare(
      `CREATE TABLE IF NOT EXISTS product_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      )`
    ).run();
  } catch (err) {
    console.error("Error creating product categories table:", err);
  }
};
// Add Description Column (if it doesn't exist)
const addDescriptionColumn = (): void => {
  try {
    // Adding the description column if it doesn't exist
    db.prepare("ALTER TABLE product_categories ADD COLUMN description TEXT").run();
    console.log("Column 'description' added to product_categories.");
  } catch (err) {
    console.error("Error adding description column:", err);
  }
};

const createShopOwnerTable = (): void => {
  try {   
   
    db.prepare(
      `CREATE TABLE IF NOT EXISTS shop_owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shopName TEXT NOT NULL,
        kraPin TEXT UNIQUE NOT NULL,
        postalAddress TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT
      )`
    ).run();
    console.log("Shop owners table created successfully.");
  } catch (err) {
    console.error("Error creating shop owners table:", err);
  }
};


// Initialize Tables
createUsersTable();
createProductCategoriesTable();
createShopOwnerTable();
updateProductsTable();
createSalesTable();


// CRUD Functions
const authenticateUser = (email: string, password: string): SuccessResponse => {
  try {
    const user: User | undefined = db
      .prepare("SELECT * FROM users WHERE email = ? AND password = ?")
      .get(email, password);

    if (user) {
      return { success: true, user };
    }
    return { success: false, message: "Invalid email or password" };
  } catch (err) {
    console.error("Error authenticating user:", err);
    return { success: false, message: "Error authenticating user" };
  }
};

// Function to create shop owner with hardcoded values
const createShopOwner = () => {
  const shopName = "Shop-12";
  const kraPin = "KRA123456";
  const postalAddress = "123 Beauty Lane, Nairobi";
  const email = "contact@beautysalon.com";
  const phone = "0723-456789";

  try {
    // Prepare SQL query to insert shop owner details
    const stmt = db.prepare(`
      INSERT INTO shop_owners (shop_name, kra_pin, postal_address, email, phone)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Execute the query with the hardcoded data
    const result = stmt.run(shopName, kraPin, postalAddress, email, phone);

    // Log the inserted ID for confirmation
    console.log("Inserted Shop Owner ID:", result.lastInsertRowid);

    return {
      success: true,
      message: "Shop owner added successfully.",
      ownerId: result.lastInsertRowid,
    };
  } catch (error: unknown) {
    // Check if the error is an instance of Error
    if (error instanceof Error) {
      console.error("Error adding shop owner:", error.message); // Access message safely
      return { success: false, message: `Failed to add shop owner. Error: ${error.message}` };
    } else {
      console.error("Unknown error:", error);
      return { success: false, message: "Failed to add shop owner. Unknown error occurred." };
    }
  }
};

// Function to get shop owner details
const getShopOwnerDetails = () => {
  try {
    console.log("Checking existing shop owners...");

    // Count the total number of shop owners
    const count = db.prepare("SELECT COUNT(*) AS count FROM shop_owners").get();
    console.log("Total shop owners:", count.count);

    // Fetch the first shop owner
    const owner = db.prepare("SELECT * FROM shop_owners LIMIT 1").get();

    if (owner) {
      console.log("Fetched Shop Owner:", owner);
      return { success: true, shopOwner: owner };
    } else {
      console.log("No shop owner found.");
      return { success: false, message: "No shop owner found." };
    }
  } catch (error) {
    console.error("Error fetching shop owner details:", error);
    return { success: false, message: "Failed to fetch shop owner details." };
  }
};
// Function to fetch all products
 const getAllProducts = () => {
  try {
    const stmt = db.prepare("SELECT * FROM products");
    return stmt.all(); // Fetch all products
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("An error occurred while fetching products.");
  }
};
// Function to update shop owner details
 const updateShopOwnerDetails = (updatedData: {
  shopName: string;
  kraPin: string;
  postalAddress: string;
  email: string;
  phone: string;
}) => {
  try {
    const stmt = db.prepare(`
      UPDATE shop_owners 
      SET shopName = ?, kraPin = ?, postalAddress = ?, email = ?, phone = ?
      WHERE id = 1
    `);
    stmt.run(
      updatedData.shopName,
      updatedData.kraPin,
      updatedData.postalAddress,
      updatedData.email,
      updatedData.phone
    );
    return { success: true };
  } catch (error) {
    console.error("Error updating shop owner:", error);
    return { success: false, message: "Database update failed" };
  }
};
// Function to update product details in the database
const updateProductInDatabase = (product: Product) => {
  // Make sure all required fields are present and valid
  if (!product.name || !product.category_id || product.purchase_price < 0 || product.selling_price < 0 || product.vat < 0 || product.stock_level < 0 || !product.supplier_name) {
    throw new Error("Invalid product data. Ensure all fields are provided and values are non-negative.");
  }

  // SQL Update query to update the product
  const updateQuery = `
    UPDATE products
    SET name = ?, category_id = ?, purchase_price = ?, selling_price = ?, vat = ?, stock_level = ?, supplier_name = ?
    WHERE id = ?
  `;

  // Execute the update query
  const statement = db.prepare(updateQuery);
  const result = statement.run(
    product.name,
    product.category_id, // Ensuring category_id is passed from the frontend selection
    product.purchase_price,
    product.selling_price,
    product.vat,
    product.stock_level,
    product.supplier_name,
    product.id
  );

  if (result.changes === 0) {
    throw new Error("No product was updated. Ensure the product exists.");
  }

  return result;  
};

// Function to create a product category
const createProductCategory = (name: string, description: string): SuccessResponse => {
  console.log("Creating category with name:", name, "and description:", description);
 
  try {
    const result = db.prepare(
      "INSERT INTO product_categories (name, description) VALUES (?, ?)"
    ).run(name, description);

    return { success: true, categoryId: result.lastInsertRowid };
  } catch (err) {
    console.error("Error creating product category:", err);
    return { success: false, message: "Category creation failed" };
  }
};

// Ensure category exists before adding product
const checkCategoryExists = (categoryId: number): boolean => {
  const category = db.prepare("SELECT id FROM product_categories WHERE id = ?").get(categoryId);
  return category !== undefined;
};
/**
 * Function to create a new user
 */
const createUser = (
  username: string,
  email: string,
  password: string,
  role: string = "cashier"
): SuccessResponse => {
  const validRoles = ["cashier", "admin"];
  if (!validRoles.includes(role)) {
    return { success: false, message: "Unknown role. Please contact support." };
  }

  try {
    const result = db
      .prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)")
      .run(username, email, password, role);
    return { success: true, userId: result.lastInsertRowid };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, message: err.message };
    }
    return { success: false, message: "Unknown error occurred" };
  }
};

// Function to create a product with category
const createProductWithCategory = (
  name: string,
  category_id: number,
  purchase_price: number,
  selling_price: number,
  vat: number,
  stock_level: number,
  supplier_name: string
): SuccessResponse => {
  // Ensure the category_id exists in the product_categories table
  if (!checkCategoryExists(category_id)) {
    return { success: false, message: "Category does not exist" };
  }

  try {
    const result = db
      .prepare(
        `INSERT INTO products (name, category_id, purchase_price, selling_price, vat, stock_level, supplier_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(name, category_id, purchase_price, selling_price, vat, stock_level, supplier_name);

    return { success: true, productId: result.lastInsertRowid };
  } catch (err) {
    console.error("Error creating product:", err);
    return { success: false, message: "Product creation failed" };
  }
};

const recordSale = async (
  productId: number,
  quantity: number,
  discount: number,
  totalPrice: number,
  paymentMethod: string,
  saleDate?: string
): Promise<SuccessResponse> => {
  const date = saleDate || new Date().toISOString();
  
  const transaction = db.transaction((productId: number, quantity: number, discount: number, totalPrice: number, paymentMethod: string, saleDate: string) => {
    const product = db.prepare("SELECT stock_level FROM products WHERE id = ?").get(productId);
    if (!product) throw new Error("Product not found");
    if (product.stock_level < quantity) throw new Error("Insufficient stock");

    db.prepare("UPDATE products SET stock_level = stock_level - ? WHERE id = ?").run(quantity, productId);
    db.prepare("INSERT INTO sales (product_id, quantity, discount, total_price, payment_method, sale_date) VALUES (?, ?, ?, ?, ?, ?)").run(productId, quantity, discount, totalPrice, paymentMethod, saleDate);
  });

  try {
    transaction(productId, quantity, discount, totalPrice, paymentMethod, date);
    return { success: true };
  } catch (err) {
    console.error("Error recording sale:", err);
    return { success: false, message: "Sale recording failed" };
  }
};

const getDailySalesReport = () => {
  return db
    .prepare(
      `SELECT DATE(sale_date) AS sale_date, SUM(total_price) AS totalSales 
       FROM sales 
       GROUP BY DATE(sale_date) 
       ORDER BY DATE(sale_date)`
    )
    .all();
};

const getMonthlySalesReport = () => {
  return db
    .prepare(
      `SELECT strftime('%Y-%m', sale_date) AS sale_date, SUM(total_price) AS totalSales 
       FROM sales GROUP BY strftime('%Y-%m', sale_date) ORDER BY sale_date`
    )
    .all();
};

const getYearlySalesReport = () => {
  return db
    .prepare(
      `SELECT strftime('%Y', sale_date) AS sale_date, SUM(total_price) AS totalSales 
       FROM sales GROUP BY strftime('%Y', sale_date) ORDER BY sale_date`
    )
    .all();
};

// Function to get inventory data
const getInventoryData = () => {
  try {
    
    const query = 'SELECT id, name, stock_level FROM products';
    console.log("Executing query:", query);  
    
    // Executes the query and retrieves all rows
    const products = db.prepare(query).all();  

    // Check if products were fetched
    if (products.length > 0) {
      console.log("Products fetched:", products);  // Log the products fetched
      return { success: true, data: products };
    } else {
      console.log("No products found.");
      return { success: false, message: 'No products found in the inventory.' };
    }
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    return { success: false, message: 'Failed to fetch inventory data.' };
  }
};

// sale history
const getSalesHistory = (): SaleDataWithId[] => {
  const query = `
    SELECT 
      sales.id, 
      sales.product_id AS productId,       
      products.name AS productName, 
      sales.quantity, 
      sales.discount, 
      sales.total_price AS totalPrice, 
      sales.payment_method AS paymentMethod, 
      sales.sale_date AS sale_date
    FROM sales
    INNER JOIN products ON sales.product_id = products.id
  `;

  console.log('Executing query:', query);

  try {
    const stmt = db.prepare(query);
    const rows: any[] = stmt.all();  // Fetch raw data

    console.log("Raw database results:", rows); // Debugging output

    // Transform the raw database output into `SaleDataWithId[]`
    const formattedRows: SaleDataWithId[] = rows.map(row => ({
      id: row.id,  // Auto-incremented sales ID
      productId: row.productId,  // Stored in sales table
      productName: row.productName || "Unknown Product",  // Retrieved from products table
      quantity: row.quantity,
      discount: row.discount ?? 0, // Default to 0 if null
      totalPrice: row.totalPrice,
      paymentMethod: row.paymentMethod,
      saleDate: row.sale_date || "", // Handle null values
      totalSales: 0, // Placeholder (modify if needed)
      isBulk: false,  // Adjust if applicable
      bulkQuantity: 0 // Adjust if applicable
    }));

    console.log("Formatted sales data:", formattedRows); // Debugging output
    return formattedRows;
  } catch (error) {
    console.error('Error fetching sales history:', error);
    throw new Error('Failed to fetch sales history.');
  }
};


// Function to delete a sale from the database
const deleteSale = (saleId: number) => {
  const query = `
    DELETE FROM sales 
    WHERE id = ?
  `;

  try {
    const stmt = db.prepare(query);
    const result = stmt.run(saleId); // Execute the delete query

    if (result.changes > 0) {
      return { success: true }; // Sale successfully deleted
    } else {
      return { success: false, message: "Sale not found" }; // Sale with given ID not found
    }
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw new Error("Failed to delete sale");
  }
};
//users report
const getAllUsers = () => {
  try {
    const stmt = db.prepare("SELECT id, username, email FROM users");
    return stmt.all(); 
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users.");
  }
};

// Function to get profit analysis data
const getProfitAnalysis = () => {
  try {
    const dailyQuery = `SELECT SUM(total_price) AS dailyTotal 
                    FROM sales 
                    WHERE DATE(sale_date) = DATE('now')`;
    const monthlyQuery = `SELECT SUM(total_price) FROM sales WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', CURRENT_DATE)`;
    const yearlyQuery = `SELECT SUM(total_price) FROM sales WHERE strftime('%Y', sale_date) = strftime('%Y', CURRENT_DATE)`;

    // Execute the queries and get the results
    const dailyProfit = db.prepare(dailyQuery).get();
    const monthlyProfit = db.prepare(monthlyQuery).get();
    const yearlyProfit = db.prepare(yearlyQuery).get();

    // Return the result in the expected format
    return {
      success: true,
      data: {
        daily: dailyProfit['SUM(total_price)'] || 0,
        monthly: monthlyProfit['SUM(total_price)'] || 0,
        yearly: yearlyProfit['SUM(total_price)'] || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching profit analysis:", error);
    return { success: false, message: "Failed to fetch profit data" };
  }
};
// Function to fetch all categories
const getAllCategories = () => {
  try {
    const stmt = db.prepare("SELECT id, name, description FROM product_categories");
    return stmt.all(); 
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories.");
  }
};


// Export functions for external usage
module.exports = {
  getSalesHistory,
  deleteSale,   
  createShopOwner,
  authenticateUser,
  getProfitAnalysis,
  createUser,
  getAllCategories,
  updateShopOwnerDetails,
  getInventoryData,
  updateProductInDatabase,
  createProductWithCategory,
  recordSale,
  createProductCategory,
  getDailySalesReport,
  getMonthlySalesReport,
  getYearlySalesReport,
  getShopOwnerDetails,
  getAllProducts,
  db,
  getAllUsers,
};
