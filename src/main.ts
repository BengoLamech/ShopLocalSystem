import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
const database = require("../public/components/DatabaseFolder/database"); // Import database module
const {  
  getInventoryData,
  updateProductInDatabase,  
  createProductCategory,  
  getShopOwnerDetails,
  getProfitAnalysis,
  getSalesHistory,
  deleteSale,
  updateShopOwnerDetails,
  getAllProducts,
  getAllUsers,
  getAllCategories,
  db,
 } = database;
app.commandLine.appendSwitch("disable-gpu"); // Disable GPU acceleration
app.commandLine.appendSwitch("disable-gpu-compositing"); // Disable GPU compositing

let loginWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let userRole: string | null = null;
// Function to create the login window
const createLoginWindow = () => {
  loginWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false, 
      contextIsolation: true, 
    },
    frame: false,
  });
  loginWindow.loadFile(path.join(__dirname, "../Login.html"));
};

// Function to create the main window
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false, 
      contextIsolation: true, 
    },
  });
  mainWindow.loadFile(path.join(__dirname, "../index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};
// Handle Logout Request
ipcMain.on("logout", () => {
  if (mainWindow) {
    mainWindow.close(); // Close the main window
    mainWindow = null;
  }
  createLoginWindow(); // Reopen the login window
});

// IPC handler for user authentication
ipcMain.handle("authenticate-user", async (_event, { email, password }) => {
  const response = await database.authenticateUser(email, password);
  console.log("Authentication response:", response);

  if (response.success) {
    userRole = response.user.role; // Store role globally
    console.log("Stored User Role:", userRole);
    if (loginWindow) {
      loginWindow.close(); // Close the login window completely
      loginWindow = null;
    }

    if (!mainWindow) {
      createMainWindow();
    } else {
      mainWindow.show();
    }

    // Ensure mainWindow is fully loaded before sending the role
    mainWindow!.webContents.once("did-finish-load", () => {
      console.log("Sending role to main window:", response.user.role);
      mainWindow!.webContents.send("user-role", response.user.role);
    });

    return { success: true, role: response.user.role };
  } else {
    return { success: false, message: response.message };
  }
});
// Allow frontend to fetch user role
ipcMain.handle("get-user-role", async () => {
  console.log("Returning Stored User Role:", userRole);
  return userRole;
});

// IPC handler for user registration (creating new user)
ipcMain.handle("register-user", async (_event, user) => {
  const { username, email, password, role } = user;

  if (!username || !email || !password || !role) {
    console.error("Missing required fields:", { username, email, password, role });
    return { success: false, message: "All fields are required." };
  }

  try {
    const result = database.createUser(username, email, password, role);
    return { success: true, message: "User registered successfully.", userId: result.userId };
  } catch (error) {
    console.error("Error during user registration:", error);
    return { success: false, message: "An error occurred during registration." };
  }
});

// IPC Handlers for window control
ipcMain.on("minimize-window", () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.minimize();
});

ipcMain.on("maximize-window", () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  }
});

ipcMain.on("close-window", () => {
  const window = BrowserWindow.getFocusedWindow();
  if (window) window.close();
});

// IPC Handler to fetch the current window type
ipcMain.handle("getWindowType", () => {
  return mainWindow ? "main" : "login"; // Return "main" if mainWindow exists, else "login"
});

// Handle product addition
ipcMain.handle("add-product", async (_event, product) => {
  const { name, category_id, purchase_price, selling_price, vat, stock_level, supplier_name } = product;

  if (!name || !category_id || purchase_price < 0 || selling_price < 0 || vat < 0 || stock_level < 0 || !supplier_name) {
    return { success: false, message: "Invalid product data. Please check all fields." };
  }

  try {
    const result = database.createProductWithCategory(name, category_id, purchase_price, selling_price, vat, stock_level, supplier_name);
    return { success: true, message: "Product added successfully.", productId: result.productId };
  } catch (error) {
    console.error("Error adding product:", error);
    return { success: false, message: "An error occurred while adding the product." };
  }
});
//add product category 
ipcMain.handle("add-product-category", async (_, category) => {
  try {
    console.log("Received category data in main process:", category);

    if (!category || typeof category !== "object") {
      throw new Error("Invalid category data provided.");
    }

    const { name, description } = category as { name: string; description: string };

    if (!name || !description) {
      throw new Error("Category name and description are required.");
    }

    console.log("Adding category:", name, description);

    // Call the function that matches your database logic
    const response = await createProductCategory(name, description);

    return response;
  } catch (error: unknown) {
    console.error("Error adding category:", error);

    // Ensure error is treated as an Error object
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return { success: false, message: errorMessage };
  }
});


// Fetch all products
ipcMain.handle("get-products", async () => {
  try {
    const products = database.db.prepare("SELECT * FROM products").all();
    return { success: true, products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, message: "An error occurred while fetching products." };
  }
});
// Handle getting product categories
ipcMain.handle("get-categories", async () => {
  try {
    // Fetch all categories from the database
    const categories = database.db.prepare("SELECT id, name, description FROM product_categories").all();
    
    // Return categories with both id and name
    return { 
      success: true, 
      categories: categories.map((cat: { id: number, name: string, description: string }) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description
      })) 
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, message: "An error occurred while fetching categories." };
  }
});

// Users Fetch Handler
ipcMain.handle("get-users", async () => {
  try {
    const users = getAllUsers();
    return { success: true, users };
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
});


// Handle shop owner details
ipcMain.handle("add-shop-owner", async (_event, ownerDetails) => {
  const { shopName, kraPin, postalAddress, email, phone } = ownerDetails;

  if (!shopName || !kraPin || !postalAddress || !email || !phone) {
    return { success: false, message: "All fields are required for the shop owner." };
  }

  try {
    const result = database.createShopOwner(shopName, kraPin, postalAddress, email, phone);
    return { success: true, message: "Shop owner details added successfully.", ownerId: result.ownerId };
  } catch (error) {
    console.error("Error adding shop owner details:", error);
    return { success: false, message: "An error occurred while adding the shop owner details." };
  }
});

// Record a sale
ipcMain.handle("record-sale", async (_event, saleData) => {
  const { 
    productId, 
    quantity, 
    discount, 
    totalPrice, 
    paymentMethod, 
    saleDate, 
    isBulk,        
    bulkQuantity   
  } = saleData;

  try {   
    const result = database.recordSale(
      productId, 
      quantity, 
      discount, 
      totalPrice, 
      paymentMethod, 
      saleDate, 
      isBulk,        // Pass isBulk to indicate bulk sale
      bulkQuantity   // Pass bulkQuantity to indicate how many items in bulk
    );

    if (result.success) {
      return { success: true, message: "Sale recorded successfully.", saleId: result.saleId };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error("Error recording sale:", error);
    return { success: false, message: "An error occurred while recording the sale." };
  }
});


// Fetch sales reports
ipcMain.handle("get-daily-sales-report", async () => {
  try {
    const report = database.getDailySalesReport();
    return { success: true, report };
  } catch (error) {
    console.error("Error generating daily sales report:", error);
    return { success: false, message: "An error occurred while generating the report." };
  }
});

ipcMain.handle("get-monthly-sales-report", async () => {
  try {
    const report = database.getMonthlySalesReport();
    return { success: true, report };
  } catch (error) {
    console.error("Error generating monthly sales report:", error);
    return { success: false, message: "An error occurred while generating the report." };
  }
});

ipcMain.handle("get-yearly-sales-report", async () => {
  try {
    const report = database.getYearlySalesReport();
    return { success: true, report };
  } catch (error) {
    console.error("Error generating yearly sales report:", error);
    return { success: false, message: "An error occurred while generating the report." };
  }
});
//reports
// Sales Report Handler
ipcMain.handle("generate-sales-report", async (_event, { startDate, endDate }) => {
  try {
    const query = `
      SELECT 
        sales.id, 
        sales.product_id AS productId,       
        products.name AS productName, 
        sales.quantity, 
        sales.discount, 
        sales.total_price AS totalPrice, 
        sales.payment_method AS paymentMethod, 
        sales.sale_date AS saleDate
      FROM sales
      INNER JOIN products ON sales.product_id = products.id
      WHERE DATE(sales.sale_date) BETWEEN DATE(?) AND DATE(?)
      ORDER BY sales.sale_date ASC
    `;

    console.log("Executing query:", query, startDate, endDate);

    const sales = database.db.prepare(query).all(startDate, endDate);

    console.log("Sales report generated:", sales);
    return { success: true, sales };
  } catch (error) {
    console.error("Error generating sales report:", error);
    return { success: false, message: "An error occurred while generating the sales report." };
  }
});

// Products Report Handler
ipcMain.handle("generate-products-report", async () => {
  try {
    const products = getAllProducts();
    return { success: true, products };
  } catch (error) {
    console.error("Error generating products report:", error);    
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
});

// Categories Fetch Handler
ipcMain.handle("getCategories", async () => {
  try {
    const categories = getAllCategories();
    return { success: true, categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
});

ipcMain.handle("updateProductDetails", async (event, updatedProduct) => {
  try {
    // Assuming you have a function to update the product in your database
    const result = await updateProductInDatabase(updatedProduct);
    return {
      success: true,
      message: "Product updated successfully.",
    };
  } catch (error) {
    console.error("Failed to update product:", error);
    return {
      success: false,
      message: "Failed to update product.",
    };
  }
});

// Handle get-sales-history
ipcMain.handle('get-sales-history', async () => {
  console.log('Handling get-sales-history request');  

  try {
    // Fetch sales history
    const salesHistory = await getSalesHistory();
    console.log('Sales history successfully fetched:', salesHistory);
    return salesHistory; 
  } catch (error: unknown) {    
    if (error instanceof Error) {     
      console.error('Error in get-sales-history IPC handler:', error.message);      
      throw new Error(`Failed to fetch sales history: ${error.message}`);
    } else {      
      console.error('Unknown error in get-sales-history IPC handler:', error);      
      throw new Error('Failed to fetch sales history due to an unknown error.');
    }
  }
});
// Handle the 'revoke-sale' event (delete the sale)
ipcMain.handle('revoke-sale', async (event, saleId) => {
  try {
    const result = await deleteSale(saleId); // Call the delete function
    if (result.success) {
      return { success: true, message: "Sale deleted successfully." };
    } else {
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error("Error revoking sale:", error);
    throw new Error('Failed to revoke sale');
  }
});
// Handle the "get-inventory-data" request from the renderer
ipcMain.handle('get-inventory-data', async () => {
  try {
    console.log("Handling get-inventory-data request...");
    const result = getInventoryData(); 
    console.log("Inventory data result:", result); 
    return result;  
  } catch (error) {
    console.error("Error in IPC handler:", error);
    return { success: false, message: "Failed to fetch inventory data." };
  }
});


// Profit analysis
ipcMain.handle("get-profit-analysis", async () => {
  try {
    // Call the function to fetch profit analysis data from the database
    const profitData = await getProfitAnalysis();

    return profitData;
  } catch (error) {
    console.error("Error fetching profit data:", error);
    return { success: false, message: "Failed to fetch profit data" };
  }
});

// Shop Owner Details Handler
ipcMain.handle("get-shop-owner-details", async () => {
  const result = getShopOwnerDetails();
  return result; 
});
//handler for updating shop owner
ipcMain.handle("update-shop-owner-details", async (event, updatedData) => {
  return updateShopOwnerDetails(updatedData);
});
// App lifecycle
app.whenReady().then(() => {
  createLoginWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createLoginWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
