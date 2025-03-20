export {};

// Define the structure of the product object
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

// Define the structure of the product category object
interface ProductCategory {
  id?: number; // Unique identifier for the category
  name: string; // Name of the category
  description: string; // Description of the category
}

// Define the structure of the shop owner object
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
  totalSales: number;
  productId: number; // ID of the product sold
  quantity: number; // Quantity sold
  discount?: number; // Optional discount applied
  totalPrice: number; // Total price after discount
  paymentMethod: string; // Payment method used (e.g., cash, card)
  sale_date?: string; // Optional sale date (default: current date)
  isBulk?: boolean; // Optional field to indicate if the sale is bulk
  bulkQuantity?: number; // Optional field for the bulk quantity purchased
}
interface SaleDataWithId extends SaleData {
  id: number;
  productName:string;
}
// Define the structure of the user object
interface User {
  username: string; // Username of the user
  email: string; // Email address of the user
  password: string; // Password for the user account
  role: string; // Role of the user (e.g., admin, staff)
}

// Define the response structure for authentication
type AuthResponse = {
  success: boolean; // Whether the operation was successful
  message: string; // Message describing the result
  role?: string; // Optional role of the authenticated user
};

// Define the generic response format for other operations
type GenericResponse = {
  success: boolean; // Whether the operation was successful
  message: string; // Message describing the result
};

// Define the structure of the response containing a list of products
type ProductListResponse = {
  success: boolean; // Whether the operation was successful
  products?: Product[]; // Optional list of products
  message?: string; // Optional message describing the result
};

// Define the structure of a sales report response
type SalesReportResponse = {
  success: boolean; // Whether the report generation was successful
  report?: SaleData[]; // Optional array of sales data
  message?: string; // Optional message describing the result
};

type CategoryListResponse = {
  success: boolean; // Whether the operation was successful
  categories?: ProductCategory[]; // Optional list of categories
  message?: string; // Optional message describing the result
};

// Extend the ElectronAPI interface to include methods that you want to expose
interface ElectronAPI {
  
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>; // For invoking IPC methods
    send: (channel: string, ...args: any[]) => void; // For sending messages to the main process
    on: (channel: string, listener: (...args: any[]) => void) => void; // For listening to IPC events
    removeListener: (channel: string, listener: (...args: any[]) => void) => void; // For removing event listeners
  };
  
  getSalesHistory: () => Promise<SaleData[]>;
 // Profit analysis method
 getProfitAnalysis: () => Promise<{ success: boolean; data: any }>;
  // User authentication and registration
  authenticateUser: (email: string, password: string) => Promise<AuthResponse>;
  registerUser: (user: User) => Promise<GenericResponse>;

  // Product management
  addProduct: (product: Product) => Promise<GenericResponse>;
  getProducts: () => Promise<ProductListResponse>;
  updateProductDetails: (product: Product) => Promise<GenericResponse>;

  // Product category management
  addCategory: (category: ProductCategory) => Promise<GenericResponse>;
  getCategories: () => Promise<CategoryListResponse>;

  // Shop owner management
  addShopOwner: (shopOwner: ShopOwner) => Promise<GenericResponse>; // Added method for adding a shop owner
  getShopOwner: () => Promise<{ success: boolean; shopOwner?: ShopOwner; message?: string }>;
  updateShopOwnerDetails: (updatedDetails: ShopOwner) => Promise<GenericResponse>;

  // Report generation
  getDailySalesReport: () => Promise<SalesReportResponse>; // Added method for daily sales report
  getMonthlySalesReport: () => Promise<SalesReportResponse>; // Added method for monthly sales report
  getYearlySalesReport: () => Promise<SalesReportResponse>; // Added method for yearly sales report
  generateSalesReport: (startDate: string, endDate: string) => Promise<{ success: boolean; sales?: SaleData[]; message?: string }>;
  generateProductsReport: () => Promise<{ success: boolean; products?: Product[]; message?: string }>;
  generateCategoriesReport: () => Promise<{ success: boolean; categories?: ProductCategory[]; message?: string }>;
  generateUsersReport: () => Promise<{ success: boolean; users?: User[]; message?: string }>;

  // Sale recording
  recordSale: (sale: SaleData) => Promise<GenericResponse>; // Added method for recording sales

  // Window type (login or main)
  getWindowType: () => Promise<string>;

  // Window control functions
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;

  send: (channel: string, ...args: any[]) => void;
}

// Extend the global window object to include the ElectronAPI
declare global {
  interface Window {
    electron: ElectronAPI; // Exposed Electron API
    global?: Window; // Optional fallback for `global`
  }
}
