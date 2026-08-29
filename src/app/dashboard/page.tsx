"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  getDatabase,
  saveDatabase,
  addAuditLog,
  sendNotification,
  User,
  Project,
  Vendor,
  Category,
  Item,
  PurchaseRequest,
  PurchaseOrder,
  GRN,
  Stock,
  StockTransaction,
  StoreOutward,
  VendorBill,
  PaymentRequest,
  PaymentEntry,
  AuditLog,
  Notification
} from '@/lib/storeData';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Radio } from '@/components/ui/Radio';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Database,
  FileSpreadsheet,
  FileCheck,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  History,
  Bell,
  Search,
  LogOut,
  Users,
  Plus,
  X,
  AlertTriangle,
  Download,
  Building,
  FileText,
  Menu,
  Sliders
} from 'lucide-react';

type SidebarTab = 
  | 'dashboard'
  | 'masters'
  | 'pr'
  | 'po'
  | 'grn'
  | 'stock'
  | 'outward'
  | 'bills'
  | 'payment-req'
  | 'payments'
  | 'reports'
  | 'audit'
  | 'notifications';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [db, setDb] = useState<ReturnType<typeof getDatabase> | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  
  // Navigation layout state: 'sidebar' or 'header'
  const [navLayout, setNavLayout] = useState<'sidebar' | 'header'>('sidebar');
  
  const [openModal, setOpenModal] = useState<string | null>(null); 
  const [selectedPr, setSelectedPr] = useState<PurchaseRequest | null>(null);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [selectedPrDetail, setSelectedPrDetail] = useState<PurchaseRequest | null>(null);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);
  const [selectedReqPay, setSelectedReqPay] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Requester' as User['role'], department: '' });
  const [projectForm, setProjectForm] = useState({ name: '', location: '', status: 'Active' as Project['status'] });
  const [vendorForm, setVendorForm] = useState({ name: '', contactPerson: '', email: '', phone: '', gstNo: '', panNo: '', bankName: '', accountNo: '', ifscCode: '', creditPeriod: 30, address: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [itemForm, setItemForm] = useState({ itemCode: '', name: '', categoryId: '', subCategory: '', unit: 'Metric Ton', description: '', minStock: 0, reorderLevel: 0 });

  const [prForm, setPrForm] = useState({ projectId: '', requiredDate: '', priority: 'Medium' as PurchaseRequest['priority'], items: [] as { itemId: string; quantity: number; remarks: string }[], attachmentUrl: '' });
  const [prItemInput, setPrItemInput] = useState({ itemId: '', quantity: 1, remarks: '' });
  
  const [poForm, setPoForm] = useState({ prId: '', vendorId: '', creditPeriod: 30, expectedDeliveryDate: '', deliveryLocation: '', termsConditions: '', remarks: '', items: [] as { itemId: string; quantity: number; rate: number; tax: number; discount: number }[] });
  
  const [grnForm, setGrnForm] = useState({ poId: '', vehicleNumber: '', challanNumber: '', vendorInvoiceNumber: '', remarks: '', items: [] as { itemId: string; receivedQty: number; damagedQty: number; batchNumber: string }[] });
  
  const [outwardForm, setOutwardForm] = useState({ projectId: '', issuedTo: '', department: '', purpose: '', remarks: '', items: [] as { itemId: string; issueQuantity: number }[] });
  const [outwardItemInput, setOutwardItemInput] = useState({ itemId: '', quantity: 1 });

  const [paymentReqForm, setPaymentReqForm] = useState({ billId: '', requestedAmount: 0, remarks: '' });
  const [paymentEntryForm, setPaymentEntryForm] = useState({ billId: '', paymentAmount: 0, paymentMode: 'Bank Transfer/NEFT/RTGS' as PaymentEntry['paymentMode'], transactionNumber: '', remarks: '' });

  useEffect(() => {
    const active = localStorage.getItem('active_user');
    if (active) {
      setCurrentUser(JSON.parse(active));
    } else {
      window.location.href = '/login';
    }
    setDb(getDatabase());
  }, []);

  const updateDB = (newDb: typeof db) => {
    if (!newDb) return;
    saveDatabase(newDb);
    setDb({ ...newDb });
  };

  const simulateRole = (role: User['role']) => {
    if (!db || !currentUser) return;
    const match = db.users.find(u => u.role === role);
    if (match) {
      localStorage.setItem('active_user', JSON.stringify(match));
      setCurrentUser(match);
      toast.success(`Role switched to ${role}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('active_user');
    window.location.href = '/login';
  };

  const getProjectName = (id: string) => db?.projects.find(p => p.id === id)?.name || 'Unknown Project';
  const getVendorName = (id: string) => db?.vendors.find(v => v.id === id)?.name || 'Unknown Vendor';
  const getItemName = (id: string) => db?.items.find(i => i.id === id)?.name || 'Unknown Item';
  const getItemUnit = (id: string) => db?.items.find(i => i.id === id)?.unit || 'Pcs';
  const getUserName = (id: string) => db?.users.find(u => u.id === id)?.name || 'System';

  const calculateAvailableStock = (projectId: string, itemId: string) => {
    if (!db) return 0;
    const stockItem = db.stock.find(s => s.projectId === projectId && s.itemId === itemId);
    return stockItem ? stockItem.quantity : 0;
  };

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    if (prForm.items.length === 0) {
      toast.error('Please add at least one item to the request');
      return;
    }

    const prNum = `PR-${new Date().getFullYear()}-${String(db.purchaseRequests.length + 101).padStart(5, '0')}`;
    const itemsWithNames = prForm.items.map(it => {
      const dbIt = db.items.find(i => i.id === it.itemId)!;
      return {
        itemId: it.itemId,
        itemName: dbIt.name,
        quantity: it.quantity,
        unit: dbIt.unit,
        remarks: it.remarks || ''
      };
    });

    const newPr: PurchaseRequest = {
      id: `pr-${Date.now()}`,
      prNumber: prNum,
      requestDate: new Date().toISOString().split('T')[0],
      projectId: prForm.projectId,
      projectName: getProjectName(prForm.projectId),
      requestedBy: currentUser.id,
      requesterName: currentUser.name,
      requiredDate: prForm.requiredDate,
      priority: prForm.priority,
      items: itemsWithNames,
      status: 'Submitted',
      history: [
        { status: 'Draft', user: currentUser.id, timestamp: new Date().toISOString(), remarks: 'Draft created' },
        { status: 'Submitted', user: currentUser.id, timestamp: new Date().toISOString(), remarks: 'PR Submitted' }
      ]
    };

    const updated = { ...db, purchaseRequests: [newPr, ...db.purchaseRequests] };
    updateDB(updated);
    
    addAuditLog(currentUser.id, 'Create PR', '', `Created PR ${prNum}`, 'Purchase Request', newPr.id);
    sendNotification('Purchase', 'New PR Submitted', `Purchase Request ${prNum} requires review.`, 'PR', newPr.id);

    setPrForm({ projectId: '', requiredDate: '', priority: 'Medium', items: [], attachmentUrl: '' });
    setOpenModal(null);
    toast.success(`Purchase Request ${prNum} generated!`);
  };

  const handlePRStatusUpdate = (prId: string, status: PurchaseRequest['status'], reason: string = '') => {
    if (!db || !currentUser) return;
    const prIndex = db.purchaseRequests.findIndex(pr => pr.id === prId);
    if (prIndex === -1) return;

    const pr = db.purchaseRequests[prIndex];
    const oldStatus = pr.status;
    pr.status = status;
    if (status === 'Rejected') {
      pr.rejectionReason = reason;
    }
    pr.history.push({
      status,
      user: currentUser.id,
      timestamp: new Date().toISOString(),
      remarks: reason || `Status updated to ${status}`
    });

    const updated = { ...db };
    updated.purchaseRequests[prIndex] = pr;
    updateDB(updated);

    addAuditLog(currentUser.id, 'PR Status Update', oldStatus, status, 'Purchase Request', prId);
    sendNotification('Requester', `PR ${status}`, `Your Purchase Request ${pr.prNumber} has been ${status}.`, 'PR', prId);
    
    toast.success(`PR status updated to ${status}`);
    setOpenModal(null);
    setSelectedPr(null);
    setRejectionReason('');
  };

  const handleOpenPOCreation = (pr: PurchaseRequest) => {
    if (!db) return;
    const poItems = pr.items.map(it => ({
      itemId: it.itemId,
      quantity: it.quantity,
      rate: 0,
      tax: 18,
      discount: 0
    }));

    setPoForm({
      prId: pr.id,
      vendorId: '',
      creditPeriod: 30,
      expectedDeliveryDate: '',
      deliveryLocation: pr.projectName || 'Central Site Store',
      termsConditions: 'Standard payment terms apply.',
      remarks: '',
      items: poItems
    });
    setSelectedPr(pr);
    setOpenModal('po');
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser || !selectedPr) return;
    if (!poForm.vendorId) {
      toast.error('Please select a vendor');
      return;
    }

    const poNum = `PO-2026-${String(db.purchaseOrders.length + 125).padStart(5, '0')}`;
    
    let totalAmt = 0;
    const itemsWithTotals = poForm.items.map(it => {
      const subtotal = it.quantity * it.rate;
      const taxAmt = subtotal * (it.tax / 100);
      const rowTotal = subtotal + taxAmt - it.discount;
      totalAmt += rowTotal;

      return {
        itemId: it.itemId,
        itemName: getItemName(it.itemId),
        quantity: it.quantity,
        rate: it.rate,
        tax: it.tax,
        discount: it.discount,
        totalAmount: rowTotal
      };
    });

    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: poNum,
      poDate: new Date().toISOString().split('T')[0],
      prId: selectedPr.id,
      prNumber: selectedPr.prNumber,
      projectId: selectedPr.projectId,
      projectName: selectedPr.projectName,
      vendorId: poForm.vendorId,
      vendorName: getVendorName(poForm.vendorId),
      items: itemsWithTotals,
      creditPeriod: Number(poForm.creditPeriod),
      expectedDeliveryDate: poForm.expectedDeliveryDate,
      deliveryLocation: poForm.deliveryLocation,
      termsConditions: poForm.termsConditions,
      remarks: poForm.remarks,
      status: 'Order Placed',
      totalPOAmount: totalAmt
    };

    const prIndex = db.purchaseRequests.findIndex(pr => pr.id === selectedPr.id);
    if (prIndex !== -1) {
      db.purchaseRequests[prIndex].status = 'PO Generated';
      db.purchaseRequests[prIndex].history.push({
        status: 'PO Generated',
        user: currentUser.id,
        timestamp: new Date().toISOString(),
        remarks: `Purchase Order ${poNum} Generated`
      });
    }

    const updated = {
      ...db,
      purchaseOrders: [newPo, ...db.purchaseOrders],
      purchaseRequests: [...db.purchaseRequests]
    };
    updateDB(updated);

    addAuditLog(currentUser.id, 'Create PO', '', `Created PO ${poNum}`, 'Purchase Order', newPo.id);
    sendNotification('Store', 'Material Expected Against PO', `New order placed under ${poNum}.`, 'PO', newPo.id);

    setOpenModal(null);
    setSelectedPr(null);
    toast.success(`Purchase Order ${poNum} created successfully!`);
  };

  const handleOpenGRNCreation = (po: PurchaseOrder) => {
    const grnItems = po.items.map(it => ({
      itemId: it.itemId,
      receivedQty: it.quantity,
      damagedQty: 0,
      batchNumber: `BAT-${Date.now().toString().slice(-4)}`
    }));

    setGrnForm({
      poId: po.id,
      vehicleNumber: '',
      challanNumber: '',
      vendorInvoiceNumber: '',
      remarks: '',
      items: grnItems
    });
    setSelectedPo(po);
    setOpenModal('grn');
  };

  const handleCreateGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser || !selectedPo) return;

    const grnNum = `GRN-${new Date().getFullYear()}-${String(db.grns.length + 501).padStart(5, '0')}`;
    
    const processedItems = grnForm.items.map(it => {
      const poItem = selectedPo.items.find(poi => poi.itemId === it.itemId)!;
      const shortQty = Math.max(0, poItem.quantity - it.receivedQty);
      const excessQty = Math.max(0, it.receivedQty - poItem.quantity);

      let currentStock = db.stock.find(st => st.projectId === selectedPo.projectId && st.itemId === it.itemId);
      const incomingGoodQty = Math.max(0, it.receivedQty - it.damagedQty);

      if (currentStock) {
        currentStock.quantity += incomingGoodQty;
      } else {
        db.stock.push({
          projectId: selectedPo.projectId,
          itemId: it.itemId,
          quantity: incomingGoodQty
        });
      }

      const bal = calculateAvailableStock(selectedPo.projectId, it.itemId) + incomingGoodQty;
      db.stockTransactions.push({
        id: `stx-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        date: new Date().toISOString().split('T')[0],
        itemId: it.itemId,
        itemName: getItemName(it.itemId),
        projectId: selectedPo.projectId,
        projectName: selectedPo.projectName,
        transactionType: 'Inward',
        referenceNumber: grnNum,
        inwardQty: incomingGoodQty,
        outwardQty: 0,
        balanceQty: bal,
        userId: currentUser.id,
        userName: currentUser.name
      });

      return {
        itemId: it.itemId,
        itemName: getItemName(it.itemId),
        orderedQty: poItem.quantity,
        receivedQty: it.receivedQty,
        shortQty,
        excessQty,
        damagedQty: it.damagedQty,
        unit: getItemUnit(it.itemId),
        batchNumber: it.batchNumber
      };
    });

    const newGrn: GRN = {
      id: `grn-${Date.now()}`,
      grnNumber: grnNum,
      grnDate: new Date().toISOString().split('T')[0],
      poId: selectedPo.id,
      poNumber: selectedPo.poNumber,
      vendorId: selectedPo.vendorId,
      vendorName: selectedPo.vendorName,
      projectId: selectedPo.projectId,
      projectName: selectedPo.projectName,
      items: processedItems,
      vehicleNumber: grnForm.vehicleNumber,
      challanNumber: grnForm.challanNumber,
      vendorInvoiceNumber: grnForm.vendorInvoiceNumber,
      remarks: grnForm.remarks,
      receivedBy: currentUser.id,
      receiverName: currentUser.name
    };

    const isPartial = processedItems.some(it => it.receivedQty < it.orderedQty);
    const poIndex = db.purchaseOrders.findIndex(po => po.id === selectedPo.id);
    if (poIndex !== -1) {
      db.purchaseOrders[poIndex].status = isPartial ? 'Partially Supplied' : 'Fully Supplied';
    }

    const prIndex = db.purchaseRequests.findIndex(pr => pr.id === selectedPo.prId);
    if (prIndex !== -1) {
      db.purchaseRequests[prIndex].status = isPartial ? 'Partially Received' : 'Fully Received';
    }

    const billNum = grnForm.vendorInvoiceNumber || `BILL-${Date.now().toString().slice(-6)}`;
    const billDate = new Date().toISOString().split('T')[0];
    const creditPeriod = selectedPo.creditPeriod;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditPeriod);

    const newBill: VendorBill = {
      id: `bill-${Date.now()}`,
      vendorId: selectedPo.vendorId,
      vendorName: selectedPo.vendorName,
      poId: selectedPo.id,
      poNumber: selectedPo.poNumber,
      billNumber: billNum,
      billDate,
      billAmount: selectedPo.totalPOAmount,
      creditPeriod,
      dueDate: dueDate.toISOString().split('T')[0],
      paidAmount: 0,
      outstandingAmount: selectedPo.totalPOAmount,
      paymentStatus: 'Upcoming'
    };

    const updated = {
      ...db,
      grns: [newGrn, ...db.grns],
      purchaseOrders: [...db.purchaseOrders],
      purchaseRequests: [...db.purchaseRequests],
      vendorBills: [newBill, ...db.vendorBills]
    };
    updateDB(updated);

    addAuditLog(currentUser.id, 'Create GRN', '', `Received material for GRN ${grnNum}`, 'Store Inward', newGrn.id);
    addAuditLog(currentUser.id, 'Create Vendor Bill', '', `Generated Bill ${billNum}`, 'Accounts Ledger', newBill.id);
    sendNotification('Accounts', 'Vendor Invoice Generated', `Vendor bill generated under invoice ${billNum}.`, 'Bill', newBill.id);

    setOpenModal(null);
    setSelectedPo(null);
    toast.success(`GRN ${grnNum} registered and invoice generated!`);
  };

  const handleCreateOutward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    if (outwardForm.items.length === 0) {
      toast.error('Please add items to issue');
      return;
    }

    for (const it of outwardForm.items) {
      const avail = calculateAvailableStock(outwardForm.projectId, it.itemId);
      if (it.issueQuantity > avail) {
        toast.error(`Insufficient Stock for ${getItemName(it.itemId)}. Available Quantity: ${avail}`);
        return;
      }
    }

    const issueNum = `ISS-2026-${String(db.storeOutwards.length + 101).padStart(5, '0')}`;
    
    const processedItems = outwardForm.items.map(it => {
      const currentStock = db.stock.find(st => st.projectId === outwardForm.projectId && st.itemId === it.itemId)!;
      currentStock.quantity -= it.issueQuantity;

      const bal = currentStock.quantity;
      db.stockTransactions.push({
        id: `stx-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        date: new Date().toISOString().split('T')[0],
        itemId: it.itemId,
        itemName: getItemName(it.itemId),
        projectId: outwardForm.projectId,
        projectName: getProjectName(outwardForm.projectId),
        transactionType: 'Outward',
        referenceNumber: issueNum,
        inwardQty: 0,
        outwardQty: it.issueQuantity,
        balanceQty: bal,
        userId: currentUser.id,
        userName: currentUser.name
      });

      return {
        itemId: it.itemId,
        itemName: getItemName(it.itemId),
        issueQuantity: it.issueQuantity,
        unit: getItemUnit(it.itemId)
      };
    });

    const newOutward: StoreOutward = {
      id: `iss-${Date.now()}`,
      issueNumber: issueNum,
      issueDate: new Date().toISOString().split('T')[0],
      projectId: outwardForm.projectId,
      projectName: getProjectName(outwardForm.projectId),
      items: processedItems,
      issuedTo: outwardForm.issuedTo,
      department: outwardForm.department,
      purpose: outwardForm.purpose,
      remarks: outwardForm.remarks,
      approvedBy: currentUser.id,
      approvedByName: currentUser.name,
      issuedBy: currentUser.id,
      issuedByName: currentUser.name
    };

    const updated = {
      ...db,
      storeOutwards: [newOutward, ...db.storeOutwards]
    };
    updateDB(updated);

    addAuditLog(currentUser.id, 'Material Issue', '', `Issued material under code ${issueNum}`, 'Store Outward', newOutward.id);
    
    setOutwardForm({ projectId: '', issuedTo: '', department: '', purpose: '', remarks: '', items: [] });
    setOpenModal(null);
    toast.success(`Store issue voucher ${issueNum} registered!`);
  };

  const handleOpenPaymentReq = (bill: VendorBill) => {
    setPaymentReqForm({
      billId: bill.id,
      requestedAmount: bill.outstandingAmount,
      remarks: ''
    });
    setSelectedBill(bill);
    setOpenModal('payment-req');
  };

  const handleCreatePaymentReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser || !selectedBill) return;

    if (paymentReqForm.requestedAmount > selectedBill.outstandingAmount) {
      toast.error(`Cannot request amount higher than outstanding (${selectedBill.outstandingAmount})`);
      return;
    }

    const newReq: PaymentRequest = {
      id: `preq-${Date.now()}`,
      vendorId: selectedBill.vendorId,
      vendorName: selectedBill.vendorName,
      billId: selectedBill.id,
      billNumber: selectedBill.billNumber,
      poNumber: selectedBill.poNumber,
      billAmount: selectedBill.billAmount,
      dueDate: selectedBill.dueDate,
      outstandingAmount: selectedBill.outstandingAmount,
      requestedAmount: Number(paymentReqForm.requestedAmount),
      requestDate: new Date().toISOString().split('T')[0],
      requestedBy: currentUser.id,
      requesterName: currentUser.name,
      remarks: paymentReqForm.remarks,
      status: 'Pending'
    };

    const billIndex = db.vendorBills.findIndex(b => b.id === selectedBill.id);
    if (billIndex !== -1) {
      db.vendorBills[billIndex].paymentStatus = 'Payment Request Pending';
    }

    const updated = {
      ...db,
      paymentRequests: [newReq, ...db.paymentRequests],
      vendorBills: [...db.vendorBills]
    };
    updateDB(updated);

    addAuditLog(currentUser.id, 'Payment Request', '', `Raised request of ${paymentReqForm.requestedAmount}`, 'Payments', newReq.id);
    sendNotification('Accounts', 'New Payment Request Raised', `Authorization required for ${selectedBill.billNumber}`, 'Payment Request', newReq.id);

    setOpenModal(null);
    setSelectedBill(null);
    toast.success('Payment request submitted for approval!');
  };

  const handleOpenPaymentEntry = (req: PaymentRequest) => {
    setPaymentEntryForm({
      billId: req.billId,
      paymentAmount: req.requestedAmount,
      paymentMode: 'Bank Transfer/NEFT/RTGS',
      transactionNumber: `UTR${Date.now().toString().slice(-8)}`,
      remarks: ''
    });
    setSelectedReqPay(req);
    setOpenModal('payment-entry');
  };

  const handleCreatePaymentEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser || !selectedReqPay) return;

    const bill = db.vendorBills.find(b => b.id === paymentEntryForm.billId);
    if (!bill) return;

    if (paymentEntryForm.paymentAmount > bill.outstandingAmount) {
      toast.error('Payment amount exceeds outstanding bill dues');
      return;
    }

    const payId = `PAY-${Date.now().toString().slice(-6)}`;
    const newEntry: PaymentEntry = {
      id: `pay-${Date.now()}`,
      paymentId: payId,
      paymentDate: new Date().toISOString().split('T')[0],
      vendorId: bill.vendorId,
      vendorName: bill.vendorName,
      billId: bill.id,
      billNumber: bill.billNumber,
      poNumber: bill.poNumber,
      paymentAmount: Number(paymentEntryForm.paymentAmount),
      paymentMode: paymentEntryForm.paymentMode,
      transactionNumber: paymentEntryForm.transactionNumber,
      remarks: paymentEntryForm.remarks,
      enteredBy: currentUser.id,
      enteredByName: currentUser.name
    };

    bill.paidAmount += newEntry.paymentAmount;
    bill.outstandingAmount = Math.max(0, bill.billAmount - bill.paidAmount);
    
    if (bill.outstandingAmount === 0) {
      bill.paymentStatus = 'Paid';
    } else {
      bill.paymentStatus = 'Partially Paid';
    }

    db.paymentRequests.forEach(r => {
      if (r.id === selectedReqPay.id) {
        r.status = 'Approved';
      }
    });

    const updated = {
      ...db,
      paymentEntries: [newEntry, ...db.paymentEntries],
      vendorBills: [...db.vendorBills],
      paymentRequests: [...db.paymentRequests]
    };
    updateDB(updated);

    addAuditLog(currentUser.id, 'Post Payment', '', `Paid ${newEntry.paymentAmount} for bill ${bill.billNumber}`, 'Payments', newEntry.id);
    
    setOpenModal(null);
    setSelectedReqPay(null);
    toast.success(`Payment voucher ${payId} printed. Outstanding balance adjusted.`);
  };

  const handleAddMaster = (type: string) => {
    if (!db || !currentUser) return;

    if (type === 'user') {
      const newUser: User = {
        id: `usr-${db.users.length + 1}`,
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        department: userForm.department,
        active: true
      };
      db.users.push(newUser);
      addAuditLog(currentUser.id, 'Create User Master', '', `Created User ${userForm.name}`, 'Masters', newUser.id);
      toast.success(`User ${userForm.name} added!`);
    } else if (type === 'project') {
      const newProj: Project = {
        id: `prj-${db.projects.length + 1}`,
        name: projectForm.name,
        location: projectForm.location,
        status: projectForm.status
      };
      db.projects.push(newProj);
      addAuditLog(currentUser.id, 'Create Project Master', '', `Created Project ${projectForm.name}`, 'Masters', newProj.id);
      toast.success(`Project site ${projectForm.name} created!`);
    } else if (type === 'vendor') {
      const newVen: Vendor = {
        id: `ven-${db.vendors.length + 1}`,
        name: vendorForm.name,
        contactPerson: vendorForm.contactPerson,
        email: vendorForm.email,
        phone: vendorForm.phone,
        gstNo: vendorForm.gstNo,
        panNo: vendorForm.panNo,
        bankDetails: {
          bankName: vendorForm.bankName,
          accountNo: vendorForm.accountNo,
          ifscCode: vendorForm.ifscCode
        },
        creditPeriod: Number(vendorForm.creditPeriod),
        address: vendorForm.address
      };
      db.vendors.push(newVen);
      addAuditLog(currentUser.id, 'Create Vendor Master', '', `Created Vendor ${vendorForm.name}`, 'Masters', newVen.id);
      toast.success(`Vendor ${vendorForm.name} registered!`);
    } else if (type === 'category') {
      const newCat: Category = {
        id: `cat-${db.categories.length + 1}`,
        name: categoryForm.name,
        description: categoryForm.description
      };
      db.categories.push(newCat);
      addAuditLog(currentUser.id, 'Create Category Master', '', `Created Category ${categoryForm.name}`, 'Masters', newCat.id);
      toast.success(`Item category ${categoryForm.name} added!`);
    } else if (type === 'item') {
      const newItem: Item = {
        id: `itm-${db.items.length + 1}`,
        itemCode: itemForm.itemCode,
        name: itemForm.name,
        categoryId: itemForm.categoryId,
        categoryName: db.categories.find(c => c.id === itemForm.categoryId)?.name || 'Unknown',
        subCategory: itemForm.subCategory,
        unit: itemForm.unit,
        description: itemForm.description,
        minStock: Number(itemForm.minStock),
        reorderLevel: Number(itemForm.reorderLevel)
      };
      db.items.push(newItem);
      addAuditLog(currentUser.id, 'Create Item Master', '', `Created Item ${itemForm.name}`, 'Masters', newItem.id);
      toast.success(`Item ${itemForm.name} registered!`);
    }

    updateDB(db);
    setOpenModal(null);
  };

  const exportCSV = (reportType: string) => {
    if (!db) return;
    let headers = '';
    let rows: string[][] = [];

    switch (reportType) {
      case 'pr':
        headers = 'PR Number,Date,Project,Priority,Status,Requested By,Items Count\n';
        rows = db.purchaseRequests.map(r => [r.prNumber, r.requestDate, r.projectName || '', r.priority, r.status, r.requesterName || '', String(r.items.length)]);
        break;
      case 'po':
        headers = 'PO Number,Date,PR Ref,Project,Vendor,Credit Period,Expected Delivery,Total Amount,Status\n';
        rows = db.purchaseOrders.map(o => [o.poNumber, o.poDate, o.prNumber, o.projectName || '', o.vendorName || '', String(o.creditPeriod), o.expectedDeliveryDate, String(o.totalPOAmount), o.status]);
        break;
      case 'stock':
        headers = 'Item Code,Item Name,Project,Available Stock,Min Reorder Level\n';
        rows = db.stock.map(s => {
          const item = db.items.find(i => i.id === s.itemId);
          return [item?.itemCode || '', item?.name || '', getProjectName(s.projectId), String(s.quantity), String(item?.reorderLevel || 0)];
        });
        break;
      case 'payments':
        headers = 'Bill Number,PO Number,Vendor,Bill Date,Due Date,Bill Amount,Paid Amount,Outstanding,Status\n';
        rows = db.vendorBills.map(b => [b.billNumber, b.poNumber, b.vendorName || '', b.billDate, b.dueDate, String(b.billAmount), String(b.paidAmount), String(b.outstandingAmount), b.paymentStatus]);
        break;
      default:
        return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers 
      + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully!');
  };

  const unreadNotifs = useMemo(() => {
    if (!db || !currentUser) return [];
    return db.notifications.filter(n => 
      (n.recipientRole === currentUser.role || n.recipientRole === 'All') && 
      !n.readBy.includes(currentUser.id)
    );
  }, [db, currentUser]);

  const markNotifRead = (id: string) => {
    if (!db || !currentUser) return;
    const notIndex = db.notifications.findIndex(n => n.id === id);
    if (notIndex !== -1) {
      if (!db.notifications[notIndex].readBy.includes(currentUser.id)) {
        db.notifications[notIndex].readBy.push(currentUser.id);
        updateDB(db);
      }
    }
  };

  const filteredPRs = useMemo(() => {
    if (!db) return [];
    return db.purchaseRequests.filter(r => {
      const matchSearch = r.prNumber.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          r.projectName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          r.requesterName?.toLowerCase().includes(globalSearch.toLowerCase());
      const matchProj = filterProject ? r.projectId === filterProject : true;
      const matchStatus = filterStatus ? r.status === filterStatus : true;
      return matchSearch && matchProj && matchStatus;
    });
  }, [db, globalSearch, filterProject, filterStatus]);

  const filteredPOs = useMemo(() => {
    if (!db) return [];
    return db.purchaseOrders.filter(o => {
      const matchSearch = o.poNumber.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          o.vendorName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          o.projectName?.toLowerCase().includes(globalSearch.toLowerCase());
      const matchProj = filterProject ? o.projectId === filterProject : true;
      const matchVendor = filterVendor ? o.vendorId === filterVendor : true;
      const matchStatus = filterStatus ? o.status === filterStatus : true;
      return matchSearch && matchProj && matchVendor && matchStatus;
    });
  }, [db, globalSearch, filterProject, filterVendor, filterStatus]);

  const filteredStock = useMemo(() => {
    if (!db) return [];
    return db.stock.filter(s => {
      const item = db.items.find(i => i.id === s.itemId);
      const matchSearch = item?.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          item?.itemCode.toLowerCase().includes(globalSearch.toLowerCase());
      const matchProj = filterProject ? s.projectId === filterProject : true;
      return matchSearch && matchProj;
    });
  }, [db, globalSearch, filterProject]);

  const filteredBills = useMemo(() => {
    if (!db) return [];
    return db.vendorBills.filter(b => {
      const matchSearch = b.billNumber.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          b.vendorName?.toLowerCase().includes(globalSearch.toLowerCase()) ||
                          b.poNumber.toLowerCase().includes(globalSearch.toLowerCase());
      const matchVendor = filterVendor ? b.vendorId === filterVendor : true;
      const matchStatus = filterStatus ? b.paymentStatus === filterStatus : true;
      return matchSearch && matchVendor && matchStatus;
    });
  }, [db, globalSearch, filterVendor, filterStatus]);

  const navigationOptions = [
    { id: 'dashboard', name: 'Overview', icon: LayoutDashboard, roles: ['Admin', 'Requester', 'Purchase', 'Store', 'Accounts', 'Management'] },
    { id: 'masters', name: 'System Masters', icon: Database, roles: ['Admin', 'Purchase', 'Management'] },
    { id: 'pr', name: 'Purchase Requests', icon: FileText, roles: ['Admin', 'Requester', 'Purchase', 'Store', 'Accounts', 'Management'] },
    { id: 'po', name: 'Purchase Orders', icon: FileSpreadsheet, roles: ['Admin', 'Purchase', 'Accounts', 'Management'] },
    { id: 'grn', name: 'Store Inwards (GRN)', icon: ArrowDownLeft, roles: ['Admin', 'Store', 'Management', 'Accounts'] },
    { id: 'stock', name: 'Stock & Ledger', icon: Package, roles: ['Admin', 'Store', 'Requester', 'Management'] },
    { id: 'outward', name: 'Material Issues', icon: ArrowUpRight, roles: ['Admin', 'Store'] },
    { id: 'bills', name: 'Vendor Bills', icon: CreditCard, roles: ['Admin', 'Accounts', 'Management'] },
    { id: 'payment-req', name: 'Payment Requests', icon: FileCheck, roles: ['Admin', 'Accounts', 'Purchase', 'Management'] },
    { id: 'payments', name: 'Payment Entries', icon: CreditCard, roles: ['Admin', 'Accounts'] },
    { id: 'reports', name: 'Reports Catalog', icon: Layers, roles: ['Admin', 'Requester', 'Purchase', 'Store', 'Accounts', 'Management'] },
    { id: 'audit', name: 'Audit Logs', icon: History, roles: ['Admin', 'Management'] },
  ];

  if (!currentUser || !db) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#045598]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden">
      
      {/* Sidebar Navigation - only active in vertical layout switcher state */}
      {navLayout === 'sidebar' && (
        <aside className="w-60 bg-white border-r border-slate-200/80 flex flex-col justify-between flex-shrink-0 transition-all duration-300">
          <div>
            <div className="p-6 border-b border-slate-200/80">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-primary-blue flex items-center justify-center font-black text-white text-md shadow-md shadow-blue-500/10">
                  SS
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-950 tracking-tight leading-none mb-0.5">SteelStream</h2>
                  <p className="text-[9px] text-primary-blue uppercase tracking-widest font-extrabold">ERP</p>
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-1 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 mb-2">Workspace Modules</p>
              {navigationOptions.map((link) => {
                if (!link.roles.includes(currentUser.role)) return null;
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id as SidebarTab)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-250 cursor-pointer ${
                      activeTab === link.id
                        ? 'bg-blue-50 text-[#045598] font-bold border border-blue-100/50'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                    <span className="text-xs">{link.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-200/80 space-y-4 bg-slate-50/50">
            <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-sm">
              <div className="h-9 w-9 rounded-full bg-blue-50 text-[#045598] flex items-center justify-center font-bold text-xs">
                {currentUser.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-955 leading-none mb-1">{currentUser.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{currentUser.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 py-2.5 border border-rose-200 bg-rose-50 hover:bg-rose-100/50 text-rose-600 rounded-xl transition-all text-xs font-bold cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header - Dynamically renders Nav items if Header navigation layout enabled */}
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-slate-200/80 z-10 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-sm font-black text-slate-955 tracking-wider uppercase mr-2">
              SteelStream
            </h1>

            {/* Layout position toggle switch */}
            <div className="h-8 flex items-center bg-slate-50 rounded-full px-2 border border-slate-250">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-2 ml-1">Menu:</span>
              <button
                type="button"
                onClick={() => setNavLayout('sidebar')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  navLayout === 'sidebar' ? 'bg-[#045598] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sidebar
              </button>
              <button
                type="button"
                onClick={() => setNavLayout('header')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                  navLayout === 'header' ? 'bg-[#045598] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Header
              </button>
            </div>

            {/* Test switcher */}
            <div className="w-44">
              <Select
                value={currentUser.role}
                onChange={(e) => simulateRole(e.target.value as User['role'])}
                options={[
                  { value: 'Admin', label: 'Admin' },
                  { value: 'Requester', label: 'Requester' },
                  { value: 'Purchase', label: 'Purchase' },
                  { value: 'Store', label: 'Store Manager' },
                  { value: 'Accounts', label: 'Accounts' },
                  { value: 'Management', label: 'Management' }
                ]}
                className="py-1 px-3 border border-slate-250 text-xs bg-slate-50 font-bold"
              />
            </div>
          </div>

          {/* Horizontal Top Header Menu Navigation links if header mode enabled */}
          {navLayout === 'header' && (
            <div className="flex items-center space-x-1.5 max-w-lg overflow-x-auto px-4 border-l border-r border-slate-200 py-1">
              {navigationOptions.map((link) => {
                if (!link.roles.includes(currentUser.role)) return null;
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id as SidebarTab)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer flex-shrink-0 ${
                      activeTab === link.id
                        ? 'bg-blue-50 text-[#045598]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name.replace('Store Inwards (GRN)', 'GRN')}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#045598] transition-all w-48 text-slate-900 placeholder-slate-400 font-semibold"
              />
            </div>

            <button
              onClick={() => setActiveTab('notifications')}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors relative cursor-pointer"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Logout header button if sidebar layout collapsed */}
            {navLayout === 'header' && (
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100/50 text-rose-600 transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </header>

        {/* Dashboard inner panels */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* ============================================================== */}
          {/* OVERVIEW PANEL */}
          {/* ============================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Approved Requisitions</p>
                  <h3 className="text-2xl font-black text-slate-955 mb-1">
                    {db.purchaseRequests.filter(r=>r.status==='Approved').length}
                  </h3>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total items: {db.purchaseRequests.length}</div>
                </Card>

                <Card className="p-6">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">POs in Dispatch</p>
                  <h3 className="text-2xl font-black text-slate-955 mb-1">
                    {db.purchaseOrders.filter(o=>o.status==='Order Placed').length}
                  </h3>
                  <div className="text-[10px] text-[#045598] font-bold uppercase">Expected material inward</div>
                </Card>

                <Card className="p-6">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Vendor Dues Outstanding</p>
                  <h3 className="text-2xl font-black text-slate-955 mb-1">
                    ₹{db.vendorBills.reduce((acc,b)=>acc+b.outstandingAmount,0).toLocaleString('en-IN')}
                  </h3>
                  <div className="text-[10px] text-rose-550 font-bold uppercase">Outstanding payables</div>
                </Card>

                <Card className="p-6">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Stock Reorder Alerts</p>
                  <h3 className="text-2xl font-black text-slate-955 mb-1">
                    {db.items.filter(it => {
                      const qty = db.stock.filter(s=>s.itemId === it.id).reduce((acc,s)=>acc+s.quantity, 0);
                      return qty <= it.reorderLevel;
                    }).length}
                  </h3>
                  <div className="text-[10px] text-amber-600 font-bold uppercase">Below safety parameters</div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6">
                    <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-4">Pending Tasks</h3>
                    
                    {currentUser.role === 'Purchase' && (
                      <div className="space-y-4">
                        {db.purchaseRequests.filter(r=>r.status==='Submitted').length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No purchase requests pending review.</p>
                        ) : (
                          db.purchaseRequests.filter(r=>r.status==='Submitted').map(pr => (
                            <div key={pr.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                              <div>
                                <p className="text-xs font-bold text-slate-955">{pr.prNumber} - {pr.projectName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Requested By: {pr.requesterName}</p>
                              </div>
                              <button
                                onClick={() => { setSelectedPr(pr); setActiveTab('pr'); }}
                                className="px-3.5 py-1.5 bg-primary-blue hover:bg-primary-blue-hover text-[10px] font-bold text-white rounded-lg cursor-pointer"
                              >
                                Review Request
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {currentUser.role === 'Store' && (
                      <div className="space-y-4">
                        {db.purchaseOrders.filter(o=>o.status==='Order Placed').length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No pending material receipts expected.</p>
                        ) : (
                          db.purchaseOrders.filter(o=>o.status==='Order Placed').map(po => (
                            <div key={po.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                              <div>
                                <p className="text-xs font-bold text-slate-955">{po.poNumber} - {po.vendorName}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">Delivery Due: {po.expectedDeliveryDate}</p>
                              </div>
                              <button
                                onClick={() => handleOpenGRNCreation(po)}
                                className="px-3 py-1.5 bg-primary-blue hover:bg-primary-blue-hover text-[10px] font-bold text-white rounded-lg cursor-pointer"
                              >
                                Log GRN
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {currentUser.role === 'Accounts' && (
                      <div className="space-y-4">
                        {db.paymentRequests.filter(r=>r.status==='Pending').length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No pending payment approvals.</p>
                        ) : (
                          db.paymentRequests.filter(r=>r.status==='Pending').map(req => (
                            <div key={req.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                              <div>
                                <p className="text-xs font-bold text-slate-955">Invoice {req.billNumber} ({req.vendorName})</p>
                                <p className="text-[10px] text-rose-600 font-bold uppercase">Amount requested: ₹{req.requestedAmount.toLocaleString('en-IN')}</p>
                              </div>
                              <button
                                onClick={() => { setActiveTab('payment-req'); }}
                                className="px-3 py-1.5 bg-primary-blue hover:bg-primary-blue-hover text-[10px] font-bold text-white rounded-lg cursor-pointer"
                              >
                                Review Request
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {['Requester', 'Admin', 'Management'].includes(currentUser.role) && (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-2">Procurement Inwards Flow Overview</p>
                        <div className="h-44 bg-slate-50 rounded-xl p-4 flex flex-col justify-end border border-slate-200">
                          <div className="flex items-end justify-around h-32">
                            <div className="w-12 bg-blue-100 h-2/3 rounded-t-lg"></div>
                            <div className="w-12 bg-blue-200 h-1/2 rounded-t-lg"></div>
                            <div className="w-12 bg-[#045598]/80 h-4/5 rounded-t-lg"></div>
                          </div>
                          <div className="flex justify-around text-[9px] text-slate-400 font-bold uppercase mt-2">
                            <span>Inward Receipts</span>
                            <span>Outward Issues</span>
                            <span>Total Stock Dues</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-4">Latest System Updates</h3>
                    <div className="space-y-4">
                      {db.auditLogs.slice(0, 4).map(log => (
                        <div key={log.id} className="border-l-2 border-[#045598] pl-3 py-1 text-xs">
                          <p className="font-bold text-slate-900 leading-none mb-0.5">{log.action}</p>
                          <p className="text-[10px] text-slate-500">{log.newValue}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SYSTEM MASTERS CRUD */}
          {/* ============================================================== */}
          {activeTab === 'masters' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Manage Systems References</h2>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setOpenModal('project')} className="px-3 py-2 bg-primary-blue hover:bg-primary-blue-hover text-[11px] font-bold text-white rounded-lg cursor-pointer flex items-center space-x-1">
                    <Plus className="h-3 w-3" /> <span>Add Project</span>
                  </button>
                  <button onClick={() => setOpenModal('vendor')} className="px-3 py-2 bg-primary-blue hover:bg-primary-blue-hover text-[11px] font-bold text-white rounded-lg cursor-pointer flex items-center space-x-1">
                    <Plus className="h-3 w-3" /> <span>Add Vendor</span>
                  </button>
                  <button onClick={() => setOpenModal('item')} className="px-3 py-2 bg-primary-blue hover:bg-primary-blue-hover text-[11px] font-bold text-white rounded-lg cursor-pointer flex items-center space-x-1">
                    <Plus className="h-3 w-3" /> <span>Register Item</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <Card className="p-6">
                  <h3 className="text-xs uppercase font-black tracking-wider text-slate-400 mb-3">Construction Site Projects</h3>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Location</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.projects.map(proj => (
                        <tr key={proj.id} className="border-b border-slate-100 text-slate-700">
                          <td className="py-2.5 font-bold">{proj.name}</td>
                          <td>{proj.location}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-55 text-emerald-600 bg-emerald-50">
                              {proj.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xs uppercase font-black tracking-wider text-slate-400 mb-3">Vendor Supplier Registers</h3>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-2">Vendor Name</th>
                        <th className="pb-2">GSTIN</th>
                        <th className="pb-2">Credit Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.vendors.map(ven => (
                        <tr key={ven.id} className="border-b border-slate-100 text-slate-700">
                          <td className="py-2.5 font-bold">{ven.name}</td>
                          <td className="font-mono">{ven.gstNo}</td>
                          <td className="font-bold">{ven.creditPeriod} Days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-xs uppercase font-black tracking-wider text-slate-400 mb-3">Inventory Material Specifications</h3>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-2">Item Code</th>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Measurement Unit</th>
                        <th className="pb-2 text-right">Safety Minimum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.items.map(it => (
                        <tr key={it.id} className="border-b border-slate-100 text-slate-700">
                          <td className="py-2.5 font-mono text-primary-blue font-bold">{it.itemCode}</td>
                          <td className="font-bold">{it.name}</td>
                          <td>{it.categoryName || 'General'}</td>
                          <td>{it.unit}</td>
                          <td className="text-right text-rose-550 font-bold">{it.minStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: PURCHASE REQUESTS */}
          {/* ============================================================== */}
          {activeTab === 'pr' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Purchase Requests List</h2>
                </div>
                {['Admin', 'Requester'].includes(currentUser.role) && (
                  <button onClick={() => setOpenModal('pr')} className="px-3.5 py-2 bg-primary-blue hover:bg-primary-blue-hover text-xs font-bold text-white rounded-lg cursor-pointer flex items-center space-x-1">
                    <Plus className="h-4.5 w-4.5" /> <span>Raise New Requisition</span>
                  </button>
                )}
              </div>

              <div className="flex space-x-3 bg-white p-3 rounded-xl border border-slate-200 light-shadow">
                <input
                  type="text"
                  placeholder="Search PR registers..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg text-xs px-3 py-1.5 outline-none font-semibold text-slate-900"
                />
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-xs px-2 text-slate-600 outline-none cursor-pointer"
                >
                  <option value="">All Projects</option>
                  {db.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <Card className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-3">PR Number</th>
                        <th className="pb-3">Site Location</th>
                        <th className="pb-3">Raised By</th>
                        <th className="pb-3">Required Date</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-center">Workflows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPRs.map(pr => (
                        <tr key={pr.id} className="border-b border-slate-100 text-slate-700">
                          <td className="py-4 font-mono font-bold text-primary-blue">{pr.prNumber}</td>
                          <td className="font-bold text-slate-900">{pr.projectName}</td>
                          <td>{pr.requesterName}</td>
                          <td>{pr.requiredDate}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              pr.priority === 'High' || pr.priority === 'Urgent' ? 'bg-rose-5 text-rose-600' : 'bg-slate-100 text-slate-600'
                            }`}>{pr.priority}</span>
                          </td>
                          <td>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              pr.status === 'Approved' ? 'bg-emerald-5 text-emerald-600' :
                              pr.status === 'Rejected' ? 'bg-rose-5 text-rose-600' :
                              'bg-amber-5 text-amber-600'
                            }`}>{pr.status}</span>
                          </td>
                          <td className="py-4 flex justify-center space-x-2">
                            <button
                              onClick={() => { setSelectedPrDetail(pr); setOpenModal('pr-detail'); }}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-650 rounded-lg cursor-pointer"
                            >
                              Timeline Track
                            </button>

                            {currentUser.role === 'Purchase' && pr.status === 'Submitted' && (
                              <>
                                <button
                                  onClick={() => handlePRStatusUpdate(pr.id, 'Approved')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-550 text-[10px] font-bold text-white rounded-lg cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => { setSelectedPr(pr); setOpenModal('pr-reject'); }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-550 text-[10px] font-bold text-white rounded-lg cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {currentUser.role === 'Purchase' && pr.status === 'Approved' && (
                              <button
                                onClick={() => handleOpenPOCreation(pr)}
                                className="px-2.5 py-1 bg-primary-blue hover:bg-primary-blue-hover text-[10px] font-bold text-white rounded-lg cursor-pointer"
                              >
                                Create PO
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* PURCHASE ORDERS */}
          {/* ============================================================== */}
          {activeTab === 'po' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-sm font-bold text-slate-900">Purchase Orders Register</h2>
              </div>

              <Card className="p-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-3">PO Number</th>
                      <th className="pb-3">PO Date</th>
                      <th className="pb-3">PR ID</th>
                      <th className="pb-3">Project Site</th>
                      <th className="pb-3">Vendor</th>
                      <th className="pb-3 text-right">Value (INR)</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPOs.map(po => (
                      <tr key={po.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-4 font-mono font-bold text-primary-blue">{po.poNumber}</td>
                        <td>{po.poDate}</td>
                        <td className="font-mono text-slate-400">{po.prNumber}</td>
                        <td className="font-bold text-slate-905">{po.projectName}</td>
                        <td>{po.vendorName}</td>
                        <td className="text-right font-bold text-slate-955">₹{po.totalPOAmount.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            po.status === 'Fully Supplied' ? 'bg-emerald-5 text-emerald-600' :
                            'bg-blue-5 text-[#045598]'
                          }`}>{po.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* STORE INWARDS (GRN) */}
          {/* ============================================================== */}
          {activeTab === 'grn' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-sm font-bold text-slate-900">Goods Receipt Notes List</h2>
              </div>

              <Card className="p-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-3">GRN Number</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">PO Ref</th>
                      <th className="pb-3">Vendor</th>
                      <th className="pb-3">Project</th>
                      <th className="pb-3">Challan Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.grns.map(grn => (
                      <tr key={grn.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-4 font-mono font-bold text-emerald-600">{grn.grnNumber}</td>
                        <td>{grn.grnDate}</td>
                        <td className="font-mono text-slate-450">{grn.poNumber}</td>
                        <td className="font-bold text-slate-955">{grn.vendorName}</td>
                        <td>{grn.projectName}</td>
                        <td className="font-mono text-slate-400">{grn.challanNumber || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* STOCK LEDGER */}
          {/* ============================================================== */}
          {activeTab === 'stock' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <Card className="p-6">
                  <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-4">Site Balances</h3>
                  <div className="space-y-3">
                    {filteredStock.map((st, i) => {
                      const item = db.items.find(it=>it.id === st.itemId);
                      return (
                        <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <p className="text-xs font-bold text-slate-900 leading-none mb-1">{item?.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{getProjectName(st.projectId)}</p>
                          <div className="flex justify-between items-end mt-2">
                            <span className="text-[10px] text-slate-450">Active balance:</span>
                            <span className="text-sm font-black text-primary-blue">{st.quantity} {item?.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-6 lg:col-span-2">
                  <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-4">Stock Ledger movements</h3>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-3">Date</th>
                        <th className="pb-3">Material Item</th>
                        <th className="pb-3">Project Site</th>
                        <th className="pb-3">Inward</th>
                        <th className="pb-3">Outward</th>
                        <th className="pb-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {db.stockTransactions.map(tx => (
                        <tr key={tx.id} className="border-b border-slate-100 text-slate-700">
                          <td className="py-3 text-slate-455">{tx.date}</td>
                          <td className="font-bold text-slate-900">{tx.itemName}</td>
                          <td>{tx.projectName}</td>
                          <td className="text-emerald-600 font-bold">{tx.inwardQty > 0 ? `+${tx.inwardQty}` : '-'}</td>
                          <td className="text-rose-550 font-bold">{tx.outwardQty > 0 ? `-${tx.outwardQty}` : '-'}</td>
                          <td className="text-right font-black text-slate-955">{tx.balanceQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: MATERIAL ISSUES */}
          {/* ============================================================== */}
          {activeTab === 'outward' && (
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Material Issues Outward</h2>
                </div>
                <button onClick={() => setOpenModal('outward')} className="px-3.5 py-2 bg-primary-blue hover:bg-primary-blue-hover text-xs font-bold text-white rounded-lg cursor-pointer flex items-center space-x-1">
                  <Plus className="h-4.5 w-4.5" /> <span>Issue Materials</span>
                </button>
              </div>

              <Card className="p-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-3">Issue ID</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Project</th>
                      <th className="pb-3">Issued To</th>
                      <th className="pb-3">Department</th>
                      <th className="pb-3">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.storeOutwards.map(out => (
                      <tr key={out.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-4 font-mono font-bold text-primary-blue">{out.issueNumber}</td>
                        <td>{out.issueDate}</td>
                        <td className="font-bold text-slate-900">{out.projectName}</td>
                        <td>{out.issuedTo}</td>
                        <td>{out.department}</td>
                        <td>{out.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 8: VENDOR BILLS */}
          {/* ============================================================== */}
          {activeTab === 'bills' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-sm font-bold text-slate-900">Vendor Bills Ledger</h2>
              </div>

              <Card className="p-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-3">Invoice Ref</th>
                      <th className="pb-3">PO Ref</th>
                      <th className="pb-3">Vendor</th>
                      <th className="pb-3">Due Date</th>
                      <th className="pb-3 text-right">Invoice Amount</th>
                      <th className="pb-3 text-right">Outstanding Amount</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBills.map(bill => (
                      <tr key={bill.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-4 font-mono font-bold text-slate-900">{bill.billNumber}</td>
                        <td className="font-mono text-slate-400">{bill.poNumber}</td>
                        <td className="font-bold text-slate-955">{bill.vendorName}</td>
                        <td>{bill.dueDate}</td>
                        <td className="text-right">₹{bill.billAmount.toLocaleString('en-IN')}</td>
                        <td className="text-right text-rose-500 font-bold">₹{bill.outstandingAmount.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            bill.paymentStatus === 'Paid' ? 'bg-emerald-5 text-emerald-600' : 'bg-amber-5 text-amber-600'
                          }`}>{bill.paymentStatus}</span>
                        </td>
                        <td className="py-4 text-center">
                          {bill.outstandingAmount > 0 && bill.paymentStatus !== 'Payment Request Pending' && (
                            <button
                              onClick={() => handleOpenPaymentReq(bill)}
                              className="px-2.5 py-1 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Request Dues Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 9: PAYMENT REQUESTS */}
          {/* ============================================================== */}
          {activeTab === 'payment-req' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-sm font-bold text-slate-900">Payment Approvals List</h2>
              </div>

              <Card className="p-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-3">Bill Number</th>
                      <th className="pb-3">Vendor Supplier</th>
                      <th className="pb-3">Requested Amount</th>
                      <th className="pb-3">Requested By</th>
                      <th className="pb-3">Remarks</th>
                      <th className="pb-3">Status</th>
                      {currentUser.role === 'Accounts' && <th className="pb-3 text-center">Authorization Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {db.paymentRequests.map(req => (
                      <tr key={req.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-4 font-mono font-bold text-slate-955">{req.billNumber}</td>
                        <td className="font-bold">{req.vendorName}</td>
                        <td className="font-bold text-slate-955">₹{req.requestedAmount.toLocaleString('en-IN')}</td>
                        <td>{req.requesterName}</td>
                        <td className="italic">"{req.remarks || 'None'}"</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            req.status === 'Approved' ? 'bg-emerald-5 text-emerald-600' : 'bg-amber-5 text-amber-600'
                          }`}>{req.status}</span>
                        </td>
                        {currentUser.role === 'Accounts' && req.status === 'Pending' && (
                          <td className="py-4 text-center">
                            <button
                              onClick={() => handleOpenPaymentEntry(req)}
                              className="px-3 py-1 bg-[#045598] hover:bg-[#03447a] text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Post UTR Dues
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 10: PAYMENTS LOGGED */}
          {/* ============================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-8">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-sm font-bold text-slate-900">Payments Disbursed Records</h2>
              </div>

              <Card className="p-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-3">Payment ID</th>
                      <th className="pb-3">UTR Reference</th>
                      <th className="pb-3">Vendor</th>
                      <th className="pb-3">Bill Number</th>
                      <th className="pb-3 text-right">Disbursed (INR)</th>
                      <th className="pb-3">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.paymentEntries.map(pay => (
                      <tr key={pay.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-4 font-mono font-bold text-primary-blue">{pay.paymentId}</td>
                        <td className="font-mono font-bold text-slate-900">{pay.transactionNumber}</td>
                        <td className="font-bold">{pay.vendorName}</td>
                        <td className="font-mono text-slate-455">{pay.billNumber}</td>
                        <td className="text-right text-emerald-650 font-black">₹{pay.paymentAmount.toLocaleString('en-IN')}</td>
                        <td>{pay.paymentMode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 11: REPORTS CATALOGUE */}
          {/* ============================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2">Purchase Orders Report</h4>
                    <p className="text-xs text-slate-500 mb-4">Export generated PO values, expected delivery calendars, and statuses.</p>
                  </div>
                  <button onClick={() => exportCSV('po')} className="py-3 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-primary-blue rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer">
                    <Download className="h-4 w-4" /> <span>Download POs Excel Sheet</span>
                  </button>
                </Card>

                <Card className="p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2">Active Stock Ledger</h4>
                    <p className="text-xs text-slate-500 mb-4">Export site inventory balances, reorder level alerts, and safety parameters.</p>
                  </div>
                  <button onClick={() => exportCSV('stock')} className="py-3 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-primary-blue rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer">
                    <Download className="h-4 w-4" /> <span>Download Stock Balances</span>
                  </button>
                </Card>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 12: AUDIT LOGS */}
          {/* ============================================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-8">
              <Card className="p-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">User</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Module</th>
                      <th className="pb-3">Event Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {db.auditLogs.map(log => (
                      <tr key={log.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-4 text-slate-455">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="font-bold">{log.userName}</td>
                        <td className="text-primary-blue font-bold">{log.action}</td>
                        <td>{log.module}</td>
                        <td>{log.newValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 13: NOTIFICATIONS CENTER */}
          {/* ============================================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <Card className="p-6 space-y-4">
                {db.notifications.filter(n => n.recipientRole === currentUser.role || n.recipientRole === 'All').map(not => {
                  const isRead = not.readBy.includes(currentUser.id);
                  return (
                    <div
                      key={not.id}
                      onClick={() => markNotifRead(not.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isRead 
                          ? 'bg-slate-50/50 border-slate-200 text-slate-450' 
                          : 'bg-blue-50/50 border-blue-100 text-slate-900 font-bold shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-primary-blue mb-1">{not.title}</h4>
                        <span className="text-[9px] text-slate-400">{new Date(not.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs">{not.message}</p>
                    </div>
                  );
                })}
              </Card>
            </div>
          )}

        </div>
      </main>

      {/* ============================================================== */}
      {/* GLOBAL DIALOG OVERLAYS */}
      {/* ============================================================== */}
      {openModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="text-md font-bold text-slate-955 capitalize">
                {openModal.replace('-', ' ')}
              </h3>
              <button 
                onClick={() => setOpenModal(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Project Form */}
            {openModal === 'project' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddMaster('project'); }} className="space-y-4">
                <Input
                  label="Project Site Name"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g. Smart City Housing C"
                />
                <Input
                  label="Location"
                  required
                  value={projectForm.location}
                  onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })}
                  placeholder="e.g. New Town, Kolkata"
                />
                <button type="submit" className="w-full py-3.5 bg-primary-blue hover:bg-primary-blue-hover font-bold text-white rounded-xl text-xs cursor-pointer shadow-md shadow-blue-600/10">
                  Save Project Reference
                </button>
              </form>
            )}

            {/* Vendor Form */}
            {openModal === 'vendor' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddMaster('vendor'); }} className="space-y-4">
                <Input
                  label="Vendor Name"
                  required
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="GSTIN"
                    required
                    value={vendorForm.gstNo}
                    onChange={(e) => setVendorForm({ ...vendorForm, gstNo: e.target.value })}
                  />
                  <Input
                    label="PAN Number"
                    required
                    value={vendorForm.panNo}
                    onChange={(e) => setVendorForm({ ...vendorForm, panNo: e.target.value })}
                  />
                </div>
                <Input
                  label="Credit Period (Days)"
                  type="number"
                  required
                  value={vendorForm.creditPeriod}
                  onChange={(e) => setVendorForm({ ...vendorForm, creditPeriod: Number(e.target.value) })}
                />
                <button type="submit" className="w-full py-3.5 bg-primary-blue hover:bg-primary-blue-hover font-bold text-white rounded-xl text-xs cursor-pointer">
                  Register Supplier
                </button>
              </form>
            )}

            {/* Item Form */}
            {openModal === 'item' && (
              <form onSubmit={(e) => { e.preventDefault(); handleAddMaster('item'); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Item Code"
                    required
                    value={itemForm.itemCode}
                    onChange={(e) => setItemForm({ ...itemForm, itemCode: e.target.value })}
                    placeholder="STM-REBAR-16"
                  />
                  <Input
                    label="Material Name"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Inventory Category"
                    options={db.categories.map(c=>({ value: c.id, label: c.name }))}
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  />
                  <Select
                    label="UoM"
                    options={[
                      { value: 'Metric Ton', label: 'Metric Ton' },
                      { value: 'Bags', label: 'Bags' },
                      { value: 'Pieces', label: 'Pieces' }
                    ]}
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  />
                </div>
                <Input
                  label="Safety Reorder Level"
                  type="number"
                  value={itemForm.reorderLevel}
                  onChange={(e) => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })}
                />
                <button type="submit" className="w-full py-3.5 bg-primary-blue hover:bg-primary-blue-hover font-bold text-white rounded-xl text-xs cursor-pointer">
                  Save Item Catalogue
                </button>
              </form>
            )}

            {/* PR Requisition Form */}
            {openModal === 'pr' && (
              <form onSubmit={handleCreatePR} className="space-y-4">
                <Select
                  label="Project Site"
                  options={db.projects.map(p=>({ value: p.id, label: p.name }))}
                  value={prForm.projectId}
                  onChange={(e) => setPrForm({ ...prForm, projectId: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Priority Parameters"
                    options={[
                      { value: 'Low', label: 'Low' },
                      { value: 'Medium', label: 'Medium' },
                      { value: 'High', label: 'High' },
                      { value: 'Urgent', label: 'Urgent' }
                    ]}
                    value={prForm.priority}
                    onChange={(e) => setPrForm({ ...prForm, priority: e.target.value as any })}
                  />
                  <Input
                    label="Required Date"
                    type="date"
                    required
                    value={prForm.requiredDate}
                    onChange={(e) => setPrForm({ ...prForm, requiredDate: e.target.value })}
                  />
                </div>

                <div className="border border-slate-200 p-4 rounded-xl space-y-4">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Add Item Dues</p>
                  <div className="flex space-x-2">
                    <Select
                      value={prItemInput.itemId}
                      onChange={(e) => setPrItemInput({ ...prItemInput, itemId: e.target.value })}
                      placeholder="Select Catalog Item"
                      options={db.items.map(it => ({ value: it.id, label: `${it.name} (${it.unit})` }))}
                      className="py-1.5 text-xs bg-slate-50"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={prItemInput.quantity}
                      onChange={(e) => setPrItemInput({ ...prItemInput, quantity: Number(e.target.value) })}
                      className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!prItemInput.itemId) return;
                        setPrForm({
                          ...prForm,
                          items: [...prForm.items, { itemId: prItemInput.itemId, quantity: prItemInput.quantity, remarks: prItemInput.remarks }]
                        });
                        setPrItemInput({ itemId: '', quantity: 1, remarks: '' });
                      }}
                      className="px-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {prForm.items.map((it, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs font-semibold">
                      <span>{getItemName(it.itemId)} x {it.quantity} {getItemUnit(it.itemId)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = prForm.items.filter((_, idx) => idx !== i);
                          setPrForm({ ...prForm, items: updated });
                        }}
                        className="text-rose-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button type="submit" className="w-full py-3.5 bg-primary-blue hover:bg-primary-blue-hover font-bold text-white rounded-xl text-xs cursor-pointer">
                  Submit Purchase Request
                </button>
              </form>
            )}

            {/* PO Issue Form */}
            {openModal === 'po' && selectedPr && (
              <form onSubmit={handleCreatePO} className="space-y-4">
                <Select
                  label="Vendor Supplier"
                  options={db.vendors.map(v=>({ value: v.id, label: v.name }))}
                  value={poForm.vendorId}
                  onChange={(e) => {
                    const ven = db.vendors.find(v=>v.id===e.target.value);
                    setPoForm({ ...poForm, vendorId: e.target.value, creditPeriod: ven?.creditPeriod || 30 });
                  }}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Credit Period"
                    type="number"
                    required
                    value={poForm.creditPeriod}
                    onChange={(e) => setPoForm({ ...poForm, creditPeriod: Number(e.target.value) })}
                  />
                  <Input
                    label="Expected Delivery"
                    type="date"
                    required
                    value={poForm.expectedDeliveryDate}
                    onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                  />
                </div>

                <div className="border border-slate-200 p-4 rounded-xl space-y-4">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Enter Rates</p>
                  {poForm.items.map((it, i) => (
                    <div key={i} className="space-y-2 bg-slate-50 p-3 rounded-lg text-xs">
                      <p className="font-bold text-slate-900">{getItemName(it.itemId)} ({it.quantity} {getItemUnit(it.itemId)})</p>
                      <input
                        type="number"
                        required
                        placeholder="Rate per unit (₹)"
                        value={it.rate || ''}
                        onChange={(e) => {
                          const updated = [...poForm.items];
                          updated[i].rate = Number(e.target.value);
                          setPoForm({ ...poForm, items: updated });
                        }}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" className="w-full py-3.5 bg-primary-blue hover:bg-primary-blue-hover font-bold text-white rounded-xl text-xs cursor-pointer">
                  Approve & Print PO
                </button>
              </form>
            )}

            {/* GRN Inward Form */}
            {openModal === 'grn' && selectedPo && (
              <form onSubmit={handleCreateGRN} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Vehicle Number"
                    required
                    value={grnForm.vehicleNumber}
                    onChange={(e) => setGrnForm({ ...grnForm, vehicleNumber: e.target.value })}
                  />
                  <Input
                    label="Challan Number"
                    required
                    value={grnForm.challanNumber}
                    onChange={(e) => setGrnForm({ ...grnForm, challanNumber: e.target.value })}
                  />
                </div>
                <Input
                  label="Vendor Invoice Reference"
                  required
                  value={grnForm.vendorInvoiceNumber}
                  onChange={(e) => setGrnForm({ ...grnForm, vendorInvoiceNumber: e.target.value })}
                />

                <div className="border border-slate-200 p-4 rounded-xl space-y-4">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Receive Qty</p>
                  {grnForm.items.map((it, i) => {
                    const poItem = selectedPo.items.find(poi=>poi.itemId===it.itemId)!;
                    return (
                      <div key={i} className="space-y-2 bg-slate-50 p-3 rounded-lg text-xs">
                        <p className="font-bold text-slate-900">{getItemName(it.itemId)} (Ordered: {poItem.quantity})</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            required
                            value={it.receivedQty}
                            onChange={(e) => {
                              const updated = [...grnForm.items];
                              updated[i].receivedQty = Number(e.target.value);
                              setGrnForm({ ...grnForm, items: updated });
                            }}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            placeholder="Recd Qty"
                          />
                          <input
                            type="number"
                            required
                            value={it.damagedQty}
                            onChange={(e) => {
                              const updated = [...grnForm.items];
                              updated[i].damagedQty = Number(e.target.value);
                              setGrnForm({ ...grnForm, items: updated });
                            }}
                            className="p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            placeholder="Damaged Qty"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="submit" className="w-full py-3.5 bg-primary-blue hover:bg-primary-blue-hover font-bold text-white rounded-xl text-xs cursor-pointer">
                  Approve Inward GRN
                </button>
              </form>
            )}

            {/* Outward Form */}
            {openModal === 'outward' && (
              <form onSubmit={handleCreateOutward} className="space-y-4">
                <Select
                  label="Project Site"
                  options={db.projects.map(p=>({ value: p.id, label: p.name }))}
                  value={outwardForm.projectId}
                  onChange={(e) => setOutwardForm({ ...outwardForm, projectId: e.target.value })}
                />
                <Input
                  label="Issued To Name"
                  required
                  value={outwardForm.issuedTo}
                  onChange={(e) => setOutwardForm({ ...outwardForm, issuedTo: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Department"
                    required
                    value={outwardForm.department}
                    onChange={(e) => setOutwardForm({ ...outwardForm, department: e.target.value })}
                  />
                  <Input
                    label="Purpose"
                    required
                    value={outwardForm.purpose}
                    onChange={(e) => setOutwardForm({ ...outwardForm, purpose: e.target.value })}
                  />
                </div>

                <div className="border border-slate-200 p-4 rounded-xl space-y-4">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Add Material Qty</p>
                  <div className="flex space-x-2">
                    <Select
                      value={outwardItemInput.itemId}
                      onChange={(e) => setOutwardItemInput({ ...outwardItemInput, itemId: e.target.value })}
                      placeholder="Select Store Item"
                      options={db.items.map(it => ({ value: it.id, label: `${it.name} (Avail: ${calculateAvailableStock(outwardForm.projectId, it.id)})` }))}
                      className="py-1.5 text-xs bg-slate-50"
                    />
                    <input
                      type="number"
                      min="1"
                      value={outwardItemInput.quantity}
                      onChange={(e) => setOutwardItemInput({ ...outwardItemInput, quantity: Number(e.target.value) })}
                      className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!outwardItemInput.itemId) return;
                        setOutwardForm({
                          ...outwardForm,
                          items: [...outwardForm.items, { itemId: outwardItemInput.itemId, issueQuantity: outwardItemInput.quantity }]
                        });
                        setOutwardItemInput({ itemId: '', quantity: 1 });
                      }}
                      className="px-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {outwardForm.items.map((it, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs font-semibold">
                      <span>{getItemName(it.itemId)} x {it.issueQuantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = outwardForm.items.filter((_, idx) => idx !== i);
                          setOutwardForm({ ...outwardForm, items: updated });
                        }}
                        className="text-rose-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button type="submit" className="w-full py-3.5 bg-primary-blue hover:bg-primary-blue-hover font-bold text-white rounded-xl text-xs cursor-pointer">
                  Save Outward Issues
                </button>
              </form>
            )}

            {/* Payment Request Form */}
            {openModal === 'payment-req' && selectedBill && (
              <form onSubmit={handleCreatePaymentReq} className="space-y-4">
                <Input
                  label="Requested Amount (₹)"
                  type="number"
                  required
                  max={selectedBill.outstandingAmount}
                  value={paymentReqForm.requestedAmount}
                  onChange={(e) => setPaymentReqForm({ ...paymentReqForm, requestedAmount: Number(e.target.value) })}
                />
                <Input
                  label="Payment Justification Remarks"
                  value={paymentReqForm.remarks}
                  onChange={(e) => setPaymentReqForm({ ...paymentReqForm, remarks: e.target.value })}
                />
                <button type="submit" className="w-full py-3.5 bg-primary-blue hover:bg-primary-blue-hover font-bold text-white rounded-xl text-xs cursor-pointer">
                  Post Payment Request
                </button>
              </form>
            )}

            {/* Payment Entry Form */}
            {openModal === 'payment-entry' && selectedReqPay && (
              <form onSubmit={handleCreatePaymentEntry} className="space-y-4">
                <Input
                  label="Payment Amount (₹)"
                  type="number"
                  required
                  value={paymentEntryForm.paymentAmount}
                  onChange={(e) => setPaymentEntryForm({ ...paymentEntryForm, paymentAmount: Number(e.target.value) })}
                />
                <Select
                  label="Payment Mode"
                  options={[
                    { value: 'Bank Transfer/NEFT/RTGS', label: 'NEFT / RTGS Transfer' },
                    { value: 'Cheque', label: 'Bank Cheque' },
                    { value: 'UPI', label: 'UPI Wallet' },
                    { value: 'Cash', label: 'Cash Disbursement' }
                  ]}
                  value={paymentEntryForm.paymentMode}
                  onChange={(e) => setPaymentEntryForm({ ...paymentEntryForm, paymentMode: e.target.value as any })}
                />
                <Input
                  label="UTR Reference / UTR Number"
                  required
                  value={paymentEntryForm.transactionNumber}
                  onChange={(e) => setPaymentEntryForm({ ...paymentEntryForm, transactionNumber: e.target.value })}
                />
                <button type="submit" className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-550 font-bold text-white rounded-xl text-xs cursor-pointer">
                  Disburse Payment Output
                </button>
              </form>
            )}

            {/* PR Details Timeline Modal */}
            {openModal === 'pr-detail' && selectedPrDetail && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-semibold space-y-1">
                  <p>PR Ref: {selectedPrDetail.prNumber}</p>
                  <p>Site Location: {selectedPrDetail.projectName}</p>
                  <p>Priority Parameters: {selectedPrDetail.priority}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-2">Workflow Lifespans Logs</h4>
                  <div className="space-y-4 relative border-l-2 border-slate-200 pl-4 ml-2">
                    {selectedPrDetail.history.map((h, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#045598]"></div>
                        <p className="font-bold text-slate-900 leading-none">{h.status}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(h.timestamp).toLocaleString()} • By {getUserName(h.user)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reject Reason Form */}
            {openModal === 'pr-reject' && selectedPr && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-bold uppercase">Provide Reason for rejecting {selectedPr.prNumber}</p>
                <textarea
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 h-24 text-slate-900"
                  placeholder="Rejection remarks..."
                />
                <button
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      toast.error('Rejection reason is mandatory');
                      return;
                    }
                    handlePRStatusUpdate(selectedPr.id, 'Rejected', rejectionReason);
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
