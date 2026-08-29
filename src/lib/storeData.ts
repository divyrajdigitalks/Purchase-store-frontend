// Store Data Engine & Database Schema Management
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Requester' | 'Purchase' | 'Store' | 'Accounts' | 'Management';
  department: string;
  active: boolean;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  status: 'Active' | 'Completed' | 'On Hold';
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNo: string;
  panNo: string;
  bankDetails: {
    bankName: string;
    accountNo: string;
    ifscCode: string;
  };
  creditPeriod: number; // in days
  address: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Item {
  id: string;
  itemCode: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  subCategory: string;
  unit: string;
  description: string;
  minStock: number;
  reorderLevel: number;
}

export interface PRItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  remarks: string;
}

export interface PRTimeline {
  status: string;
  user: string;
  timestamp: string;
  remarks?: string;
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  requestDate: string;
  projectId: string;
  projectName?: string;
  requestedBy: string;
  requesterName?: string;
  requiredDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  items: PRItem[];
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'PO Generated' | 'Order Placed' | 'Partially Received' | 'Fully Received' | 'Closed';
  rejectionReason?: string;
  attachmentUrl?: string;
  history: PRTimeline[];
}

export interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  rate: number;
  tax: number; // percentage
  discount: number; // amount
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  prId: string;
  prNumber: string;
  projectId: string;
  projectName?: string;
  vendorId: string;
  vendorName?: string;
  items: POItem[];
  creditPeriod: number;
  expectedDeliveryDate: string;
  deliveryLocation: string;
  termsConditions: string;
  remarks: string;
  status: 'Draft' | 'Approved' | 'Order Placed' | 'Acknowledged' | 'Partially Supplied' | 'Fully Supplied' | 'Closed';
  totalPOAmount: number;
}

export interface GRNItem {
  itemId: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  shortQty: number;
  excessQty: number;
  damagedQty: number;
  unit: string;
  batchNumber: string;
}

export interface GRN {
  id: string;
  grnNumber: string;
  grnDate: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName?: string;
  projectId: string;
  projectName?: string;
  items: GRNItem[];
  vehicleNumber: string;
  challanNumber: string;
  vendorInvoiceNumber: string;
  remarks: string;
  attachmentUrl?: string;
  receivedBy: string;
  receiverName?: string;
}

export interface Stock {
  projectId: string;
  itemId: string;
  quantity: number;
}

export interface StockTransaction {
  id: string;
  date: string;
  itemId: string;
  itemName?: string;
  projectId: string;
  projectName?: string;
  transactionType: 'Inward' | 'Outward';
  referenceNumber: string; // GRN or Issue Number
  inwardQty: number;
  outwardQty: number;
  balanceQty: number;
  userId: string;
  userName?: string;
}

export interface StoreOutwardItem {
  itemId: string;
  itemName: string;
  issueQuantity: number;
  unit: string;
}

export interface StoreOutward {
  id: string;
  issueNumber: string;
  issueDate: string;
  projectId: string;
  projectName?: string;
  items: StoreOutwardItem[];
  issuedTo: string;
  department: string;
  purpose: string;
  remarks: string;
  approvedBy?: string;
  approvedByName?: string;
  issuedBy: string;
  issuedByName?: string;
}

export interface VendorBill {
  id: string;
  vendorId: string;
  vendorName?: string;
  poId: string;
  poNumber: string;
  billNumber: string;
  billDate: string;
  billAmount: number;
  creditPeriod: number;
  dueDate: string;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: 'Upcoming' | 'Due' | 'Payment Request Pending' | 'Payment Requested' | 'Partially Paid' | 'Paid' | 'Overdue';
}

export interface PaymentRequest {
  id: string;
  vendorId: string;
  vendorName?: string;
  billId: string;
  billNumber: string;
  poNumber: string;
  billAmount: number;
  dueDate: string;
  outstandingAmount: number;
  requestedAmount: number;
  requestDate: string;
  requestedBy: string;
  requesterName?: string;
  remarks: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface PaymentEntry {
  id: string;
  paymentId: string;
  paymentDate: string;
  vendorId: string;
  vendorName?: string;
  billId: string;
  billNumber: string;
  poNumber: string;
  paymentAmount: number;
  paymentMode: 'Bank Transfer/NEFT/RTGS' | 'Cheque' | 'UPI' | 'Cash';
  transactionNumber: string;
  remarks: string;
  attachmentUrl?: string;
  enteredBy: string;
  enteredByName?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  module: string;
  referenceId: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  recipientRole: 'Admin' | 'Requester' | 'Purchase' | 'Store' | 'Accounts' | 'Management' | 'All';
  title: string;
  message: string;
  readBy: string[];
  referenceModule?: string;
  referenceId?: string;
  timestamp: string;
}

// Initial Database seeds
const INITIAL_USERS: User[] = [
  { id: 'usr-1', name: 'Alok Sharma', email: 'admin@system.com', role: 'Admin', department: 'IT / Operations', active: true },
  { id: 'usr-2', name: 'Rahul Verma', email: 'req@system.com', role: 'Requester', department: 'Civil Project site-A', active: true },
  { id: 'usr-3', name: 'Priya Patel', email: 'pur@system.com', role: 'Purchase', department: 'Procurement Cell', active: true },
  { id: 'usr-4', name: 'Manish Singh', email: 'store@system.com', role: 'Store', department: 'Central Storehouse', active: true },
  { id: 'usr-5', name: 'Neha Gupta', email: 'acc@system.com', role: 'Accounts', department: 'Finance & Accounts', active: true },
  { id: 'usr-6', name: 'Siddharth Roy', email: 'mgmt@system.com', role: 'Management', department: 'Executive Director', active: true },
];

const INITIAL_PROJECTS: Project[] = [
  { id: 'prj-1', name: 'Metro Line Extension Phase 2', location: 'Sector 62, Noida', status: 'Active' },
  { id: 'prj-2', name: 'Smart City Housing Block C', location: 'New Town, Kolkata', status: 'Active' },
  { id: 'prj-3', name: 'NH4 Expansion Highway', location: 'Pune-Bangalore Bypass', status: 'On Hold' },
];

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'ven-1',
    name: 'Tata Steel Ltd',
    contactPerson: 'Sanjay Dutt',
    email: 'sanjay.dutt@tatasteel.com',
    phone: '+91 98765 43210',
    gstNo: '19AAACT0125R1Z2',
    panNo: 'AAACT0125R',
    bankDetails: { bankName: 'State Bank of India', accountNo: '30456123985', ifscCode: 'SBIN0001235' },
    creditPeriod: 45,
    address: 'Tata Centre, 43 J.L. Nehru Road, Kolkata'
  },
  {
    id: 'ven-2',
    name: 'UltraTech Cement Co',
    contactPerson: 'Karan Johar',
    email: 'karan.j@ultratech.com',
    phone: '+91 87654 32109',
    gstNo: '27AAACW5892D1Z0',
    panNo: 'AAACW5892D',
    bankDetails: { bankName: 'HDFC Bank', accountNo: '501002345678', ifscCode: 'HDFC0000012' },
    creditPeriod: 30,
    address: 'Ahura Centre, Mahakali Caves Road, Andheri East, Mumbai'
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Structural Materials', description: 'Steel bars, cement, brickwork items' },
  { id: 'cat-2', name: 'Electrical & Piping', description: 'Conduits, copper wires, pvc pipes and joints' },
  { id: 'cat-3', name: 'Safety Equipment', description: 'Helmets, safety boots, harnesses, reflective vests' },
];

const INITIAL_ITEMS: Item[] = [
  { id: 'itm-1', itemCode: 'STM-REBAR-12', name: 'Steel TMT Rebar 12mm', categoryId: 'cat-1', subCategory: 'Reinforcement Steel', unit: 'Metric Ton', description: 'High-strength structural steel rebar', minStock: 5, reorderLevel: 10 },
  { id: 'itm-2', itemCode: 'STM-OPC-43', name: 'OPC 43 Grade Cement', categoryId: 'cat-1', subCategory: 'Cement Binders', unit: 'Bags', description: 'Ordinary Portland Cement 43 Grade', minStock: 100, reorderLevel: 250 },
  { id: 'itm-3', itemCode: 'SAF-HELM-YEL', name: 'Yellow Safety Helmet Class A', categoryId: 'cat-3', subCategory: 'PPE Headwear', unit: 'Pieces', description: 'Standard high-density PE safety helmet', minStock: 20, reorderLevel: 40 },
];

// Helper to load/save state
const DB_KEY = 'purchase_mgmt_db';

export function getDatabase() {
  if (typeof window === 'undefined') {
    return {
      users: INITIAL_USERS,
      projects: INITIAL_PROJECTS,
      vendors: INITIAL_VENDORS,
      categories: INITIAL_CATEGORIES,
      items: INITIAL_ITEMS,
      purchaseRequests: [],
      purchaseOrders: [],
      grns: [],
      stock: [],
      stockTransactions: [],
      storeOutwards: [],
      vendorBills: [],
      paymentRequests: [],
      paymentEntries: [],
      auditLogs: [],
      notifications: [],
    };
  }

  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Ensure all fields are arrays
      return {
        users: parsed.users || INITIAL_USERS,
        projects: parsed.projects || INITIAL_PROJECTS,
        vendors: parsed.vendors || INITIAL_VENDORS,
        categories: parsed.categories || INITIAL_CATEGORIES,
        items: parsed.items || INITIAL_ITEMS,
        purchaseRequests: parsed.purchaseRequests || [],
        purchaseOrders: parsed.purchaseOrders || [],
        grns: parsed.grns || [],
        stock: parsed.stock || [],
        stockTransactions: parsed.stockTransactions || [],
        storeOutwards: parsed.storeOutwards || [],
        vendorBills: parsed.vendorBills || [],
        paymentRequests: parsed.paymentRequests || [],
        paymentEntries: parsed.paymentEntries || [],
        auditLogs: parsed.auditLogs || [],
        notifications: parsed.notifications || [],
      };
    } catch (e) {
      console.error(e);
    }
  }

  // Pre-seed some default transactions for the demo flow
  const seed = {
    users: INITIAL_USERS,
    projects: INITIAL_PROJECTS,
    vendors: INITIAL_VENDORS,
    categories: INITIAL_CATEGORIES,
    items: INITIAL_ITEMS,
    purchaseRequests: [
      {
        id: 'pr-1',
        prNumber: 'PR-2026-00001',
        requestDate: '2026-08-25',
        projectId: 'prj-1',
        projectName: 'Metro Line Extension Phase 2',
        requestedBy: 'usr-2',
        requesterName: 'Rahul Verma',
        requiredDate: '2026-09-05',
        priority: 'High',
        items: [
          { itemId: 'itm-1', itemName: 'Steel TMT Rebar 12mm', quantity: 25, unit: 'Metric Ton', remarks: 'Required for pillar casting' },
          { itemId: 'itm-2', itemName: 'OPC 43 Grade Cement', quantity: 500, unit: 'Bags', remarks: 'Required for foundation work' }
        ],
        status: 'Approved',
        history: [
          { status: 'Draft', user: 'usr-2', timestamp: '2026-08-25T10:00:00Z', remarks: 'Created request' },
          { status: 'Submitted', user: 'usr-2', timestamp: '2026-08-25T10:30:00Z', remarks: 'Sent for approval' },
          { status: 'Approved', user: 'usr-3', timestamp: '2026-08-26T14:20:00Z', remarks: 'PR approved after site inspection' }
        ]
      }
    ],
    purchaseOrders: [],
    grns: [],
    stock: [
      { projectId: 'prj-1', itemId: 'itm-1', quantity: 15 },
      { projectId: 'prj-1', itemId: 'itm-2', quantity: 80 },
      { projectId: 'prj-2', itemId: 'itm-3', quantity: 50 },
    ],
    stockTransactions: [
      {
        id: 'stx-1',
        date: '2026-08-20',
        itemId: 'itm-1',
        itemName: 'Steel TMT Rebar 12mm',
        projectId: 'prj-1',
        projectName: 'Metro Line Extension Phase 2',
        transactionType: 'Inward',
        referenceNumber: 'GRN-2026-00001',
        inwardQty: 15,
        outwardQty: 0,
        balanceQty: 15,
        userId: 'usr-4',
        userName: 'Manish Singh'
      }
    ],
    storeOutwards: [],
    vendorBills: [],
    paymentRequests: [],
    paymentEntries: [],
    auditLogs: [
      { id: 'log-1', userId: 'usr-1', userName: 'Alok Sharma', action: 'System Setup', newValue: 'Seeded initial database parameters', module: 'System', referenceId: 'system', timestamp: '2026-08-29T12:00:00.000Z' }
    ],
    notifications: [
      { id: 'not-1', recipientRole: 'Purchase', title: 'New PR Pending Review', message: 'PR-2026-00001 has been submitted by Rahul Verma', readBy: [], referenceModule: 'PR', referenceId: 'pr-1', timestamp: '2026-08-25T10:30:00Z' }
    ],
  };

  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
}

export function saveDatabase(data: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }
}

// Global logger helper
export function addAuditLog(userId: string, action: string, oldValue: string, newValue: string, module: string, referenceId: string) {
  const db = getDatabase();
  const user = db.users.find(u => u.id === userId) || { name: 'System' };
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName: user.name,
    action,
    oldValue,
    newValue,
    module,
    referenceId,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(newLog);
  saveDatabase(db);
}

// Global notification creator helper
export function sendNotification(recipientRole: User['role'] | 'All', title: string, message: string, referenceModule?: string, referenceId?: string) {
  const db = getDatabase();
  const newNotif: Notification = {
    id: `not-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    recipientRole,
    title,
    message,
    readBy: [],
    referenceModule,
    referenceId,
    timestamp: new Date().toISOString()
  };
  db.notifications.unshift(newNotif);
  saveDatabase(db);
}
