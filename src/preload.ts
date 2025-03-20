import { contextBridge, ipcRenderer } from "electron";

// Define types for the expected arguments and return types
interface Product {
  id: number; // Unique identifier for the product
  name: string; // Name of the product
  category_id: number;
  purchase_price: number; // Purchase price of the product
  selling_price: number; // Selling price of the product
  vat: number; // Value-added tax percentage
  stock_level: number; // Available stock level
  supplier_name: string; // Name of the supplier
}

interface ProductCategory {
  name: string;
  description: string;
}

interface ShopOwner {
  id?: number; // Unique identifier for the shop owner (optional during registration)
  shopName: string; // Name of the shop
  kraPin: string; // KRA PIN
  postalAddress: string; // Postal address
  email: string; // Email address of the shop owner
  phone: string; // Contact number of the shop owner
}
// Define the structure of the sale data
interface SaleData {
  productId: number; // ID of the product sold
  quantity: number; // Quantity sold
  discount?: number; // Optional discount applied
  totalPrice: number; // Total price after discount
  paymentMethod: string; // Payment method used (e.g., cash, card)
  sale_date?: string; // Optional sale date (default: current date)
  isBulk?: boolean; // Optional field to indicate if the sale is bulk
  bulkQuantity?: number; // Optional field for the bulk quantity purchased
}

interface User {
  username: string;
  email: string;
  password: string;
  role: string;
}

type AuthResponse = {
  success: boolean;
  message: string;
  role?: string;
};

type GenericResponse = {
  success: boolean;
  message: string;
};

type ProductListResponse = {
  success: boolean;
  products?: Product[];
  message?: string;
};

type ProductCategoryResponse = {
  success: boolean;
  categories?: ProductCategory[];
  message?: string;
};

type SalesReportResponse = {
  success: boolean;
  report?: any; // Replace `any` with your report data structure if available
  message?: string;
};

// Valid channels for communication
const validChannels = [
  "authenticate-user",
  "register-user",
  "add-product",
  "get-products",
  "add-category",
  "get-categories",
  "add-shop-owner",
  "get-shop-owner",
  "record-sale",
  "get-daily-sales-report",
  "get-monthly-sales-report",
  "get-yearly-sales-report",
  "db-query",
  "minimize-window", // Added for custom title bar
  "maximize-window", // Added for custom title bar
  "close-window",    // Added for custom title bar
  "set-window-type", // To handle login/main window type
  "user-role",       // Added for user role
];

// Expose APIs securely to the renderer process
contextBridge.exposeInMainWorld("electron", {
  
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
      send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
      on: (channel: string, listener: (...args: any[]) => void) => ipcRenderer.on(channel, listener),
      removeListener: (channel: string, listener: (...args: any[]) => void) => ipcRenderer.removeListener(channel, listener),
    },
    
 

  // Window controls
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  maximizeWindow: () => ipcRenderer.send("maximize-window"),
  closeWindow: () => ipcRenderer.send("close-window"),
  //Getting inventory data
  getInventoryData: () => ipcRenderer.invoke('get-inventory-data'),
  getProfitAnalysis: () => ipcRenderer.invoke("get-profit-analysis"),
  updateProductDetails: (updatedProduct: Product) => {
    return ipcRenderer.invoke("updateProductDetails", updatedProduct);
  },

  // Retrieve window type (login or main)
  getWindowType: (): Promise<string> =>
    new Promise((resolve) => {
      ipcRenderer.once("set-window-type", (_event, { isLoginWindow }) => {
        resolve(isLoginWindow ? "login" : "main");
      });
    }),

  // Authenticate user credentials (Login Window)
  authenticateUser: async (email: string, password: string): Promise<AuthResponse> => {
    if (!email || !password) {
      throw new Error("Email and password are required for authentication.");
    }
    return ipcRenderer.invoke("authenticate-user", { email, password });
  },

  // Register a new user (Main Window)
  registerUser: async (user: User): Promise<GenericResponse> => {
    const { username, email, password, role } = user;
    if (!username || !email || !password || !role) {
      throw new Error("All fields (username, email, password, and role) are required for registration.");
    }
    return ipcRenderer.invoke("register-user", user);
  },

  // Add a new product to the database (Main Window)
  addProduct: async (product: Product): Promise<GenericResponse> => {
    const { name, category_id, purchase_price, selling_price, vat, stock_level, supplier_name } = product;
    if (!name || !category_id || purchase_price < 0 || selling_price < 0 || vat < 0 || stock_level < 0 || !supplier_name) {
      throw new Error("Invalid product data. Ensure all fields are provided and values are non-negative.");
    }
    return ipcRenderer.invoke("add-product", product);
  },

  // Add a new product category
  addCategory: async (category: ProductCategory): Promise<GenericResponse> => {
    console.log("Sending category data to main process:", category); // Debugging log
    if (!category.name || !category.description) {
      throw new Error("Category name and description are required.");
    }
    return ipcRenderer.invoke("add-product-category", category);
  },
  

  getSalesHistory: () => ipcRenderer.invoke('get-sales-history'),
  // Getting product categories
  getCategories: async (): Promise<ProductCategoryResponse> => {
    try {
      const response = await ipcRenderer.invoke("get-categories");
      
      if (response.success) {
        return { success: true, categories: response.categories }; // Returning the full category data
      } else {
        return { success: false, message: response.message || "Failed to fetch categories." };
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      return { success: false, message: "Failed to fetch categories." };
    }
  },

  // Add or update shop owner details (Main Window)
  addShopOwner: async (owner: ShopOwner): Promise<GenericResponse> => {
    const { shopName, email, phone, kraPin, postalAddress } = owner;
  
    if (!shopName || !email || !phone || !kraPin || !postalAddress) {
      throw new Error("All shop owner details are required.");
    }
  
    return ipcRenderer.invoke("add-shop-owner", owner);
  },

  // Get shop owner details 
  getShopOwner: async (): Promise<ShopOwner | null> => {
    try {
      console.log("Fetching shop owner details...");
      const response = await ipcRenderer.invoke("get-shop-owner-details");
  
      console.log("Shop Owner Response:", response);
  
      if (response.success) {
        console.log("Shop Owner Found:", response.shopOwner);
        return response.shopOwner;
      } else {
        console.error("Failed to fetch shop owner details:", response.message);
        return null;
      }
    } catch (error) {
      console.error("Error fetching shop owner details:", error);
      return null;
    }
  },
  
  

  // Get a list of all products (Main Window)
  getProducts: async (): Promise<ProductListResponse> => {
    try {
      const response = await ipcRenderer.invoke("get-products");
      if (response.success) {
        return { success: true, products: response.products };
      } else {
        return { success: false, message: response.message || "Failed to fetch products." };
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      return { success: false, message: "Failed to fetch products." };
    }
  },

  recordSale: async (saleData: SaleData): Promise<GenericResponse> => {
    const { productId, quantity, totalPrice, paymentMethod, sale_date, isBulk, bulkQuantity } = saleData;
  
    // Validate sale data
    if (!productId || quantity <= 0 || totalPrice < 0 || !paymentMethod) {
      throw new Error("Invalid sale data. Ensure all fields are provided and values are valid.");
    }
  
    // If the sale is bulk, ensure bulkQuantity is provided and valid
    if (isBulk) {
      if (bulkQuantity === undefined || bulkQuantity <= 0 || bulkQuantity > quantity) {
        throw new Error("Invalid bulk quantity. Ensure bulk quantity is a positive value and less than or equal to quantity.");
      }
    }
  
    try {
      // Send the sale data to the main process
      return await ipcRenderer.invoke("record-sale", saleData);
    } catch (err) {
      console.error("Error recording sale:", err);
      return { success: false, message: "Failed to record sale." };
    }
  },
  

  // Generate daily sales report (Main Window)
  getDailySalesReport: async (): Promise<SalesReportResponse> => {
    try {
      const response = await ipcRenderer.invoke("get-daily-sales-report");
      if (response.success) {
        return { success: true, report: response.report };
      } else {
        return { success: false, message: response.message || "Failed to generate report." };
      }
    } catch (error) {
      console.error("Error generating daily sales report:", error);
      return { success: false, message: "Failed to generate report." };
    }
  },

  // Generate monthly sales report (Main Window)
  getMonthlySalesReport: async (): Promise<SalesReportResponse> => {
    try {
      const response = await ipcRenderer.invoke("get-monthly-sales-report");
      if (response.success) {
        return { success: true, report: response.report };
      } else {
        return { success: false, message: response.message || "Failed to generate report." };
      }
    } catch (error) {
      console.error("Error generating monthly sales report:", error);
      return { success: false, message: "Failed to generate report." };
    }
  },

  // Generate yearly sales report (Main Window)
  getYearlySalesReport: async (): Promise<SalesReportResponse> => {
    try {
      const response = await ipcRenderer.invoke("get-yearly-sales-report");
      if (response.success) {
        return { success: true, report: response.report };
      } else {
        return { success: false, message: response.message || "Failed to generate report." };
      }
    } catch (error) {
      console.error("Error generating yearly sales report:", error);
      return { success: false, message: "Failed to generate report." };
    }
  },

  // Send a custom DB query (Main Window)
  sendDBQuery: async (query: string, params: any[]): Promise<any> => {
    if (!query) {
      throw new Error("A valid SQL query string is required.");
    }
    return ipcRenderer.invoke("db-query", { query, params });
  },

  // Fetch the user role after successful authentication (Main Window)
  getUserRole: async (): Promise<string | null> => {
    try {
      const role = await ipcRenderer.invoke("user-role");
      return role || null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  },
//sales report and product report
  // Generate a sales report between two dates
  generateSalesReport: async (startDate: string, endDate: string): Promise<any> => {
    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required to generate a sales report.");
    }
    return ipcRenderer.invoke("generate-sales-report", { startDate, endDate });
  },

  // Generate a full products report
  generateProductsReport: async (): Promise<any> => {
    try {
      return ipcRenderer.invoke("generate-products-report");
    } catch (error) {
      console.error("Error generating products report:", error);
      throw error;
    }
  },

  // Generate a report for product categories
  generateCategoriesReport: async (): Promise<any> => {
    try {
      return ipcRenderer.invoke("generate-categories-report");
    } catch (error) {
      console.error("Error generating categories report:", error);
      throw error;
    }
  },

  // Generate a users report
  generateUsersReport: async (): Promise<any> => {
    try {
      return ipcRenderer.invoke("generate-users-report");
    } catch (error) {
      console.error("Error generating users report:", error);
      throw error;
    }
  },

  // Fetch shop owner details
  getShopOwnerDetails: async (): Promise<any> => {
    try {
      return ipcRenderer.invoke("get-shop-owner-details");
    } catch (error) {
      console.error("Error fetching shop owner details:", error);
      throw error;
    }
  },

  // Update shop owner details
  updateShopOwnerDetails: async (updatedDetails: {
    shopName: string;
    kraPin: string;
    postalAddress: string;
    email: string;
    phone: string;
  }): Promise<any> => {
    const { shopName, kraPin, postalAddress, email, phone } = updatedDetails;
    if (!shopName || !kraPin || !postalAddress || !email || !phone) {
      throw new Error("All shop owner details are required to update.");
    }

    return ipcRenderer.invoke("update-shop-owner-details", updatedDetails);
  },
  // Listen for events from the main process (both windows)
  on: (channel: string, listener: (...args: any[]) => void): void => {
    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    ipcRenderer.on(channel, listener);
  },

  // Remove a listener for a specific channel (both windows)
  removeListener: (channel: string, listener: (...args: any[]) => void): void => {
    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    ipcRenderer.removeListener(channel, listener);
  },
});
