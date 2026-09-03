"use client";

import React, { useState, useEffect } from 'react';
import {
  getDatabase,
  fetchDatabaseFromBackend,
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
  StoreOutward,
  VendorBill,
  PaymentRequest,
  PaymentEntry,
  StockTransaction
} from '@/lib/storeData';
import { toast } from 'sonner';

// Modular Components
import { SidebarNav, SidebarTab } from '@/components/dashboard/SidebarNav';
import { HeaderNav } from '@/components/dashboard/HeaderNav';
import { DashboardOverview } from '@/components/dashboard/tabs/DashboardOverview';
import { MastersTab } from '@/components/dashboard/tabs/MastersTab';
import { PurchaseRequestsTab } from '@/components/dashboard/tabs/PurchaseRequestsTab';
import { PurchaseOrdersTab } from '@/components/dashboard/tabs/PurchaseOrdersTab';
import { GrnTab } from '@/components/dashboard/tabs/GrnTab';
import { StockManagementTab } from '@/components/dashboard/tabs/StockManagementTab';
import { StoreOutwardTab } from '@/components/dashboard/tabs/StoreOutwardTab';
import { VendorBillsTab } from '@/components/dashboard/tabs/VendorBillsTab';
import { PaymentRequestsTab } from '@/components/dashboard/tabs/PaymentRequestsTab';
import { PaymentEntriesTab } from '@/components/dashboard/tabs/PaymentEntriesTab';
import { ReportsTab } from '@/components/dashboard/tabs/ReportsTab';
import { AuditLogsTab, NotificationsTab, RolePermissionsTab } from '@/components/dashboard/tabs/AuditLogsTab';
import { Modals } from '@/components/dashboard/Modals';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const active = localStorage.getItem('active_user');
      if (active) {
        try {
          return JSON.parse(active);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return null;
  });

  const [db, setDb] = useState(() => getDatabase());
  const [activeTab, setActiveTab] = useState<SidebarTab>('dashboard');
  const [navLayout, setNavLayout] = useState<'sidebar' | 'header'>('sidebar');

  // Modal & Selected Drawer States
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [selectedPrDetail, setSelectedPrDetail] = useState<PurchaseRequest | null>(null);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);

  // Filters
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');

  // Form States
  const [prForm, setPrForm] = useState({ projectId: '', requiredDate: '', priority: 'Medium' as const, items: [] as any[], attachmentUrl: '' });
  const [prItemInput, setPrItemInput] = useState({ itemId: '', quantity: 1, remarks: '' });

  const [poForm, setPoForm] = useState({ prId: '', vendorId: '', creditPeriod: 30, expectedDeliveryDate: '', deliveryLocation: '', termsConditions: '', remarks: '', items: [] as any[] });
  
  const [grnForm, setGrnForm] = useState({ poId: '', vehicleNumber: '', challanNumber: '', vendorInvoiceNumber: '', remarks: '', items: [] as any[] });
  
  const [outwardForm, setOutwardForm] = useState({ projectId: '', issuedTo: '', department: '', purpose: '', remarks: '', items: [] as any[] });
  const [outwardItemInput, setOutwardItemInput] = useState({ itemId: '', quantity: 1 });

  const [billForm, setBillForm] = useState({ poId: '', vendorInvoiceNumber: '', billDate: new Date().toISOString().split('T')[0], billAmount: 0, creditPeriod: 30, dueDate: '' });

  const [paymentReqForm, setPaymentReqForm] = useState({ billId: '', requestedAmount: 0, remarks: '' });
  const [paymentEntryForm, setPaymentEntryForm] = useState({ billId: '', paymentAmount: 0, paymentMode: 'Bank Transfer/NEFT/RTGS' as const, transactionNumber: '', remarks: '' });

  useEffect(() => {
    const active = localStorage.getItem('active_user');
    if (active) {
      try {
        setCurrentUser(JSON.parse(active));
      } catch (e) {
        console.error(e);
      }
    } else {
      window.location.href = '/login';
    }
    
    // Background sync from backend MongoDB API with local fallback
    fetchDatabaseFromBackend().then((backendDb) => {
      if (backendDb) {
        setDb(backendDb);
      }
    }).catch(() => {
      // Local state already ready
    });
  }, []);

  const updateDB = (newDb: typeof db) => {
    if (!newDb) return;
    saveDatabase(newDb);
    setDb({ ...newDb });
  };

  const simulateRole = (role: string) => {
    if (!db) return;
    let match = db.users.find(u => u.role === role);
    if (!match) {
      match = {
        id: `usr-mock-${Date.now()}`,
        name: `${role} User`,
        email: `${role.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        role,
        department: 'Operations',
        active: true
      };
      db.users.push(match);
    }
    localStorage.setItem('active_user', JSON.stringify(match));
    setCurrentUser(match);
    toast.success(`Active role switched to ${role}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('active_user');
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  };

  // 1. Purchase Request (PR) Handlers
  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    if (prForm.items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    const prNum = `PR-${new Date().getFullYear()}-${String(db.purchaseRequests.length + 101).padStart(5, '0')}`;
    const targetProject = db.projects.find(p => p.id === prForm.projectId);
    const itemsWithNames = prForm.items.map((it: any) => {
      const dbIt = db.items.find(i => i.id === it.itemId);
      return {
        itemId: it.itemId,
        itemName: dbIt?.name || 'Item',
        quantity: it.quantity,
        unit: dbIt?.unit || 'Pcs',
        remarks: it.remarks || ''
      };
    });

    const newPr: PurchaseRequest = {
      id: `pr-${Date.now()}`,
      prNumber: prNum,
      requestDate: new Date().toISOString().split('T')[0],
      projectId: prForm.projectId,
      projectName: targetProject?.name || 'General Project',
      requestedBy: currentUser.id,
      requesterName: currentUser.name,
      requiredDate: prForm.requiredDate,
      priority: prForm.priority as any,
      items: itemsWithNames,
      status: 'Submitted',
      history: [
        { status: 'Submitted', user: currentUser.id, timestamp: new Date().toISOString(), remarks: 'PR Created' }
      ]
    };

    const updated = { ...db, purchaseRequests: [newPr, ...db.purchaseRequests] };
    updateDB(updated);
    addAuditLog(currentUser.id, 'Create PR', '', `Created PR ${prNum}`, 'PR', newPr.id);
    sendNotification('Approver', 'New PR Submitted', `PR ${prNum} submitted by ${currentUser.name} for review`);

    setPrForm({ projectId: '', requiredDate: '', priority: 'Medium', items: [], attachmentUrl: '' });
    setOpenModal(null);
    toast.success(`Purchase Request ${prNum} created!`);
  };

  const handleUpdatePRStatus = (prId: string, status: PurchaseRequest['status'], reason?: string) => {
    if (!db || !currentUser) return;
    const pr = db.purchaseRequests.find(p => p.id === prId);
    if (!pr) return;

    pr.status = status;
    if (reason) pr.rejectionReason = reason;
    pr.history.push({ status, user: currentUser.id, timestamp: new Date().toISOString(), remarks: reason || `Status set to ${status}` });

    updateDB({ ...db });
    addAuditLog(currentUser.id, `PR Status Update`, '', `Updated PR ${pr.prNumber} status to ${status}`, 'PR', pr.id);
    toast.success(`PR ${pr.prNumber} status updated to ${status}`);
  };

  // 2. Purchase Order (PO) Handlers
  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    const selectedPr = db.purchaseRequests.find(p => p.id === poForm.prId);
    const selectedVendor = db.vendors.find(v => v.id === poForm.vendorId);
    if (!selectedPr || !selectedVendor) {
      toast.error('Select valid PR & Vendor');
      return;
    }

    const poNum = `PO-${new Date().getFullYear()}-${String(db.purchaseOrders.length + 101).padStart(5, '0')}`;
    let total = 0;
    const poItems = poForm.items.map((it: any) => {
      const itemObj = db.items.find(i => i.id === it.itemId);
      const lineTotal = (it.quantity * it.rate) * (1 + (it.tax / 100));
      total += lineTotal;
      return {
        itemId: it.itemId,
        itemName: itemObj?.name || 'Item',
        quantity: it.quantity,
        unit: itemObj?.unit || 'Pcs',
        rate: it.rate,
        tax: it.tax,
        discount: 0,
        amount: lineTotal,
        totalAmount: lineTotal
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
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      creditPeriod: poForm.creditPeriod,
      expectedDeliveryDate: poForm.expectedDeliveryDate,
      deliveryLocation: poForm.deliveryLocation,
      termsConditions: poForm.termsConditions || 'Standard Payment Terms Apply',
      remarks: poForm.remarks || '',
      items: poItems,
      totalPOAmount: total,
      totalAmount: total,
      status: 'Approved',
    };

    selectedPr.status = 'PO Created';
    updateDB({ ...db, purchaseOrders: [newPo, ...db.purchaseOrders] });
    addAuditLog(currentUser.id, 'Create PO', '', `Generated PO ${poNum}`, 'PO', newPo.id);
    sendNotification('Store', 'New Purchase Order', `PO ${poNum} issued for ${selectedVendor.name}`);

    setPoForm({ prId: '', vendorId: '', creditPeriod: 30, expectedDeliveryDate: '', deliveryLocation: '', termsConditions: '', remarks: '', items: [] });
    setOpenModal(null);
    toast.success(`Purchase Order ${poNum} issued!`);
  };

  const handleUpdatePOStatus = (poId: string, status: PurchaseOrder['status']) => {
    if (!db || !currentUser) return;
    const po = db.purchaseOrders.find(p => p.id === poId);
    if (po) {
      po.status = status;
      updateDB({ ...db });
      toast.success(`PO ${po.poNumber} status updated to ${status}`);
    }
  };

  // 3. GRN / Inward Handlers
  const handleCreateGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    const selectedPo = db.purchaseOrders.find(p => p.id === grnForm.poId);
    if (!selectedPo) {
      toast.error('Please select a valid Purchase Order');
      return;
    }

    const grnNum = `GRN-${new Date().getFullYear()}-${String(db.grns.length + 101).padStart(5, '0')}`;
    const grnItems = selectedPo.items.map(it => ({
      itemId: it.itemId,
      itemName: it.itemName,
      orderedQty: it.quantity,
      receivedQty: it.quantity,
      shortQty: 0,
      excessQty: 0,
      damagedQty: 0,
      unit: it.unit || 'Pcs',
      batchNumber: `BATCH-${Date.now().toString().slice(-4)}`
    }));

    const newGrn: GRN = {
      id: `grn-${Date.now()}`,
      grnNumber: grnNum,
      grnDate: new Date().toISOString().split('T')[0],
      receivedDate: new Date().toISOString().split('T')[0],
      poId: selectedPo.id,
      poNumber: selectedPo.poNumber,
      vendorId: selectedPo.vendorId,
      vendorName: selectedPo.vendorName || 'Vendor',
      projectId: selectedPo.projectId,
      projectName: selectedPo.projectName,
      items: grnItems,
      vehicleNumber: grnForm.vehicleNumber,
      challanNumber: grnForm.challanNumber,
      vendorInvoiceNumber: grnForm.vendorInvoiceNumber || '',
      remarks: grnForm.remarks || 'Material verified at store',
      receivedBy: currentUser.id,
      receiverName: currentUser.name
    };

    // Update or create stock balances & stock transactions
    const updatedStock = [...db.stock];
    const newTransactions: StockTransaction[] = [];

    for (const it of grnItems) {
      const existingStock = updatedStock.find(s => s.projectId === selectedPo.projectId && s.itemId === it.itemId);
      if (existingStock) {
        existingStock.quantity += it.receivedQty;
      } else {
        const itemObj = db.items.find(i => i.id === it.itemId);
        updatedStock.push({
          id: `stk-${Date.now()}-${it.itemId}`,
          projectId: selectedPo.projectId,
          projectName: selectedPo.projectName,
          itemId: it.itemId,
          itemName: it.itemName,
          itemCode: itemObj?.itemCode || '',
          unit: it.unit,
          quantity: it.receivedQty,
          reorderLevel: itemObj?.reorderLevel || 10
        });
      }

      newTransactions.push({
        id: `txn-${Date.now()}-${it.itemId}`,
        projectId: selectedPo.projectId,
        itemId: it.itemId,
        transactionType: 'INWARD_GRN',
        quantity: it.receivedQty,
        referenceId: newGrn.id,
        referenceNumber: grnNum,
        transactionDate: new Date().toISOString().split('T')[0],
        createdBy: currentUser.id
      });
    }

    selectedPo.status = 'Partially Received';
    updateDB({
      ...db,
      grns: [newGrn, ...db.grns],
      stock: updatedStock,
      stockTransactions: [...newTransactions, ...db.stockTransactions]
    });

    addAuditLog(currentUser.id, 'Create GRN', '', `Received GRN ${grnNum} for PO ${selectedPo.poNumber}`, 'GRN', newGrn.id);
    sendNotification('Accounts', 'GRN Inward Verified', `GRN ${grnNum} received for ${selectedPo.vendorName}`);

    setGrnForm({ poId: '', vehicleNumber: '', challanNumber: '', vendorInvoiceNumber: '', remarks: '', items: [] });
    setOpenModal(null);
    toast.success(`GRN ${grnNum} registered and stock updated!`);
  };

  // 4. Store Outward Handlers
  const handleCreateOutward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    if (!outwardItemInput.itemId) {
      toast.error('Please select an item to issue');
      return;
    }

    const itemObj = db.items.find(i => i.id === outwardItemInput.itemId);
    const targetProject = db.projects.find(p => p.id === outwardForm.projectId);
    const stockItem = db.stock.find(s => s.projectId === outwardForm.projectId && s.itemId === outwardItemInput.itemId);

    if (!stockItem || stockItem.quantity < outwardItemInput.quantity) {
      toast.error(`Insufficient stock available! Current stock: ${stockItem?.quantity || 0} ${itemObj?.unit || 'Pcs'}`);
      return;
    }

    const outNum = `OUT-${new Date().getFullYear()}-${String(db.storeOutwards.length + 101).padStart(5, '0')}`;
    const issuedItem = {
      itemId: outwardItemInput.itemId,
      itemName: itemObj?.name || 'Item',
      itemCode: itemObj?.itemCode || '',
      quantity: outwardItemInput.quantity,
      unit: itemObj?.unit || 'Pcs',
      remarks: outwardForm.purpose
    };

    const newOutward: StoreOutward = {
      id: `out-${Date.now()}`,
      outwardNumber: outNum,
      issueNumber: outNum,
      issueDate: new Date().toISOString().split('T')[0],
      projectId: outwardForm.projectId,
      projectName: targetProject?.name || 'Site Project',
      issuedTo: outwardForm.issuedTo,
      department: outwardForm.department,
      purpose: outwardForm.purpose,
      items: [issuedItem],
      remarks: outwardForm.remarks || '',
      issuedBy: currentUser.id,
      issuedByName: currentUser.name
    };

    // Deduct stock
    stockItem.quantity -= outwardItemInput.quantity;

    const newTxn: StockTransaction = {
      id: `txn-${Date.now()}`,
      projectId: outwardForm.projectId,
      itemId: outwardItemInput.itemId,
      transactionType: 'OUTWARD_ISSUE',
      quantity: outwardItemInput.quantity,
      referenceId: newOutward.id,
      referenceNumber: outNum,
      transactionDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser.id
    };

    updateDB({
      ...db,
      storeOutwards: [newOutward, ...db.storeOutwards],
      stockTransactions: [newTxn, ...db.stockTransactions]
    });

    addAuditLog(currentUser.id, 'Store Outward', '', `Issued ${outwardItemInput.quantity} ${itemObj?.unit} under ${outNum}`, 'Outward', newOutward.id);
    
    setOutwardForm({ projectId: '', issuedTo: '', department: '', purpose: '', remarks: '', items: [] });
    setOutwardItemInput({ itemId: '', quantity: 1 });
    setOpenModal(null);
    toast.success(`Store Outward Voucher ${outNum} generated!`);
  };

  // 5. Vendor Bills Handlers
  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    const selectedPo = db.purchaseOrders.find(p => p.id === billForm.poId);
    if (!selectedPo) {
      toast.error('Select a valid Purchase Order');
      return;
    }

    const billNum = `BILL-${new Date().getFullYear()}-${String(db.vendorBills.length + 101).padStart(5, '0')}`;
    const billDateObj = new Date(billForm.billDate || Date.now());
    const dueDateObj = new Date(billDateObj.getTime() + (billForm.creditPeriod || 30) * 24 * 60 * 60 * 1000);

    const newBill: VendorBill = {
      id: `bill-${Date.now()}`,
      vendorId: selectedPo.vendorId,
      vendorName: selectedPo.vendorName || 'Vendor',
      poId: selectedPo.id,
      poNumber: selectedPo.poNumber,
      billNumber: billNum,
      vendorInvoiceNumber: billForm.vendorInvoiceNumber || billNum,
      billDate: billForm.billDate || new Date().toISOString().split('T')[0],
      billAmount: billForm.billAmount,
      creditPeriod: billForm.creditPeriod || 30,
      dueDate: dueDateObj.toISOString().split('T')[0],
      paidAmount: 0,
      outstandingAmount: billForm.billAmount,
      paymentStatus: 'Upcoming',
      status: 'Submitted'
    };

    updateDB({
      ...db,
      vendorBills: [newBill, ...db.vendorBills]
    });

    addAuditLog(currentUser.id, 'Create Bill', '', `Registered Bill ${billNum} for PO ${selectedPo.poNumber}`, 'Bill', newBill.id);
    sendNotification('Accounts', 'New Vendor Invoice Registered', `Invoice ${newBill.vendorInvoiceNumber} registered for ${newBill.vendorName}`);

    setBillForm({ poId: '', vendorInvoiceNumber: '', billDate: new Date().toISOString().split('T')[0], billAmount: 0, creditPeriod: 30, dueDate: '' });
    setOpenModal(null);
    toast.success(`Vendor Bill ${billNum} registered successfully!`);
  };

  // 6. Payment Requests Handlers
  const handleCreatePaymentReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    const selectedBill = db.vendorBills.find(b => b.id === paymentReqForm.billId);
    if (!selectedBill) {
      toast.error('Please select a valid Bill');
      return;
    }

    const reqNum = `REQ-${new Date().getFullYear()}-${String(db.paymentRequests.length + 101).padStart(5, '0')}`;
    const newReq: PaymentRequest = {
      id: `payreq-${Date.now()}`,
      vendorId: selectedBill.vendorId,
      vendorName: selectedBill.vendorName,
      billId: selectedBill.id,
      billNumber: selectedBill.billNumber,
      requestNumber: reqNum,
      poNumber: selectedBill.poNumber,
      billAmount: selectedBill.billAmount,
      dueDate: selectedBill.dueDate,
      outstandingAmount: selectedBill.outstandingAmount,
      requestedAmount: paymentReqForm.requestedAmount,
      requestDate: new Date().toISOString().split('T')[0],
      requestedBy: currentUser.id,
      requesterName: currentUser.name,
      remarks: paymentReqForm.remarks || 'Payment request initiated',
      status: 'Submitted'
    };

    selectedBill.paymentStatus = 'Payment Request Pending';
    updateDB({
      ...db,
      paymentRequests: [newReq, ...db.paymentRequests]
    });

    addAuditLog(currentUser.id, 'Payment Request', '', `Raised Payment Request ${reqNum} for ₹${paymentReqForm.requestedAmount}`, 'PaymentRequest', newReq.id);
    sendNotification('Admin', 'Payment Request Submitted', `Payment Requisition ${reqNum} created for ${selectedBill.vendorName}`);

    setPaymentReqForm({ billId: '', requestedAmount: 0, remarks: '' });
    setOpenModal(null);
    toast.success(`Payment Request ${reqNum} submitted!`);
  };

  // 7. Payment Entries Handlers
  const handleCreatePaymentEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !currentUser) return;
    const selectedBill = db.vendorBills.find(b => b.id === paymentEntryForm.billId);
    if (!selectedBill) {
      toast.error('Select a valid Bill');
      return;
    }

    const payNum = `PAY-${new Date().getFullYear()}-${String(db.paymentEntries.length + 101).padStart(5, '0')}`;
    const newEntry: PaymentEntry = {
      id: `pay-${Date.now()}`,
      paymentId: payNum,
      paymentNumber: payNum,
      paymentDate: new Date().toISOString().split('T')[0],
      vendorId: selectedBill.vendorId,
      vendorName: selectedBill.vendorName,
      billId: selectedBill.id,
      billNumber: selectedBill.billNumber,
      poNumber: selectedBill.poNumber,
      paymentAmount: paymentEntryForm.paymentAmount,
      paymentMode: paymentEntryForm.paymentMode,
      transactionNumber: paymentEntryForm.transactionNumber,
      remarks: paymentEntryForm.remarks || '',
      enteredBy: currentUser.id,
      enteredByName: currentUser.name
    };

    // Update bill payment status & balances
    selectedBill.paidAmount = (selectedBill.paidAmount || 0) + paymentEntryForm.paymentAmount;
    selectedBill.outstandingAmount = Math.max(0, selectedBill.billAmount - selectedBill.paidAmount);
    if (selectedBill.outstandingAmount === 0) {
      selectedBill.status = 'Paid';
      selectedBill.paymentStatus = 'Paid';
    } else {
      selectedBill.paymentStatus = 'Partially Paid';
    }

    updateDB({
      ...db,
      paymentEntries: [newEntry, ...db.paymentEntries]
    });

    addAuditLog(currentUser.id, 'Payment Entry', '', `Disbursed ₹${paymentEntryForm.paymentAmount} via ${paymentEntryForm.paymentMode} (${payNum})`, 'PaymentEntry', newEntry.id);
    sendNotification('Accounts', 'Payment Disbursed', `Payment entry ${payNum} recorded for ${selectedBill.vendorName}`);

    setPaymentEntryForm({ billId: '', paymentAmount: 0, paymentMode: 'Bank Transfer/NEFT/RTGS', transactionNumber: '', remarks: '' });
    setOpenModal(null);
    toast.success(`Payment Voucher ${payNum} saved successfully!`);
  };

  const handleToggleModule = (role: string, module: string) => {
    if (!db) return;
    const rp = db.rolePermissions.find(r => r.role === role);
    if (rp) {
      if (rp.modules.includes(module)) {
        rp.modules = rp.modules.filter(m => m !== module);
      } else {
        rp.modules.push(module);
      }
      updateDB({ ...db });
      toast.success(`Permission updated for ${role}`);
    }
  };

  if (!currentUser) {
    return null;
  }

  // Filtered dataset calculation for global search
  const filteredPrs = db.purchaseRequests.filter(pr =>
    (!filterProject || pr.projectId === filterProject) &&
    (!globalSearch || pr.prNumber.toLowerCase().includes(globalSearch.toLowerCase()) || (pr.projectName || '').toLowerCase().includes(globalSearch.toLowerCase()))
  );

  const filteredPos = db.purchaseOrders.filter(po =>
    (!filterProject || po.projectId === filterProject) &&
    (!globalSearch || po.poNumber.toLowerCase().includes(globalSearch.toLowerCase()) || (po.vendorName || '').toLowerCase().includes(globalSearch.toLowerCase()))
  );

  const filteredStocks = db.stock.filter(s =>
    (!filterProject || s.projectId === filterProject) &&
    (!globalSearch || (s.itemName || '').toLowerCase().includes(globalSearch.toLowerCase()))
  );

  const unreadNotificationsCount = db.notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex bg-slate-100/70 text-slate-900">
      {/* Sidebar Navigation */}
      {navLayout === 'sidebar' && (
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          rolePermissions={db.rolePermissions}
          onLogout={handleLogout}
          unreadNotificationsCount={unreadNotificationsCount}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderNav
          currentUser={currentUser}
          projects={db.projects}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
          filterProject={filterProject}
          setFilterProject={setFilterProject}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadNotificationsCount={unreadNotificationsCount}
          navLayout={navLayout}
          setNavLayout={setNavLayout}
          rolePermissions={db.rolePermissions}
          simulateRole={simulateRole}
          onOpenCreatePRModal={() => setOpenModal('create-pr')}
        />

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              purchaseRequests={db.purchaseRequests}
              purchaseOrders={db.purchaseOrders}
              stocks={db.stock}
              vendorBills={db.vendorBills}
              setActiveTab={setActiveTab}
              onOpenCreatePRModal={() => setOpenModal('create-pr')}
              onOpenCreatePOModal={() => setOpenModal('create-po')}
              onOpenCreateGRNModal={() => setOpenModal('create-grn')}
              onOpenCreateBillModal={() => setOpenModal('create-bill')}
            />
          )}

          {activeTab === 'masters' && (
            <MastersTab
              users={db.users}
              projects={db.projects}
              vendors={db.vendors}
              categories={db.categories}
              items={db.items}
              onAddUser={(u: any) => {
                const newUser = {
                  id: `usr-${Date.now()}`,
                  ...u,
                  password: u.password || '123456',
                  email: u.email.toLowerCase().trim()
                };
                const existingIndex = db.users.findIndex(item => item.email.toLowerCase().trim() === newUser.email);
                let newUsersList;
                if (existingIndex !== -1) {
                  db.users[existingIndex] = { ...db.users[existingIndex], ...newUser };
                  newUsersList = [...db.users];
                } else {
                  newUsersList = [newUser, ...db.users];
                }
                updateDB({ ...db, users: newUsersList });
                addAuditLog(currentUser.id, 'Create User', '', `Created user ${u.name}`, 'User', newUser.id);
                toast.success(`User ${u.name} saved!`);
              }}
              onEditUser={(id, updated) => {
                const userIndex = db.users.findIndex(u => u.id === id);
                if (userIndex !== -1) {
                  const cleanedUpdates = { ...updated };
                  if (!cleanedUpdates.password) {
                    delete cleanedUpdates.password;
                  }
                  if (cleanedUpdates.email) {
                    cleanedUpdates.email = cleanedUpdates.email.toLowerCase().trim();
                  }
                  db.users[userIndex] = { ...db.users[userIndex], ...cleanedUpdates };
                  updateDB({ ...db });
                  addAuditLog(currentUser.id, 'Update User', '', `Updated user ${updated.name || id}${updated.password ? ' (Password Reset)' : ''}`, 'User', id);
                  toast.success(`User updated successfully!`);
                }
              }}
              onDeleteUser={(id) => {
                const u = db.users.find(item => item.id === id);
                const updated = db.users.filter(item => item.id !== id);
                updateDB({ ...db, users: updated });
                addAuditLog(currentUser.id, 'Delete User', '', `Deleted user ${u?.name || id}`, 'User', id);
                toast.success(`User deleted successfully!`);
              }}
              onAddProject={(p) => {
                const newPrj = { id: `prj-${Date.now()}`, ...p };
                updateDB({ ...db, projects: [newPrj, ...db.projects] });
                addAuditLog(currentUser.id, 'Create Project', '', `Added project ${p.name}`, 'Project', newPrj.id);
                toast.success(`Project ${p.name} created!`);
              }}
              onEditProject={(id, updated) => {
                const prjIndex = db.projects.findIndex(p => p.id === id);
                if (prjIndex !== -1) {
                  db.projects[prjIndex] = { ...db.projects[prjIndex], ...updated };
                  updateDB({ ...db });
                  addAuditLog(currentUser.id, 'Update Project', '', `Updated project ${updated.name || id}`, 'Project', id);
                  toast.success(`Project updated successfully!`);
                }
              }}
              onDeleteProject={(id) => {
                const p = db.projects.find(item => item.id === id);
                const updated = db.projects.filter(item => item.id !== id);
                updateDB({ ...db, projects: updated });
                addAuditLog(currentUser.id, 'Delete Project', '', `Deleted project ${p?.name || id}`, 'Project', id);
                toast.success(`Project deleted successfully!`);
              }}
              onAddVendor={(v) => {
                const newVen = { id: `ven-${Date.now()}`, ...v };
                updateDB({ ...db, vendors: [newVen, ...db.vendors] });
                addAuditLog(currentUser.id, 'Create Vendor', '', `Added vendor ${v.name}`, 'Vendor', newVen.id);
                toast.success(`Vendor ${v.name} saved!`);
              }}
              onEditVendor={(id, updated) => {
                const venIndex = db.vendors.findIndex(v => v.id === id);
                if (venIndex !== -1) {
                  db.vendors[venIndex] = { ...db.vendors[venIndex], ...updated };
                  updateDB({ ...db });
                  addAuditLog(currentUser.id, 'Update Vendor', '', `Updated vendor ${updated.name || id}`, 'Vendor', id);
                  toast.success(`Vendor updated successfully!`);
                }
              }}
              onDeleteVendor={(id) => {
                const v = db.vendors.find(item => item.id === id);
                const updated = db.vendors.filter(item => item.id !== id);
                updateDB({ ...db, vendors: updated });
                addAuditLog(currentUser.id, 'Delete Vendor', '', `Deleted vendor ${v?.name || id}`, 'Vendor', id);
                toast.success(`Vendor deleted successfully!`);
              }}
              onAddCategory={(c) => {
                const newCat = { id: `cat-${Date.now()}`, ...c };
                updateDB({ ...db, categories: [newCat, ...db.categories] });
                addAuditLog(currentUser.id, 'Create Category', '', `Added category ${c.name}`, 'Category', newCat.id);
                toast.success(`Category ${c.name} added!`);
              }}
              onEditCategory={(id, updated) => {
                const catIndex = db.categories.findIndex(c => c.id === id);
                if (catIndex !== -1) {
                  db.categories[catIndex] = { ...db.categories[catIndex], ...updated };
                  updateDB({ ...db });
                  addAuditLog(currentUser.id, 'Update Category', '', `Updated category ${updated.name || id}`, 'Category', id);
                  toast.success(`Category updated successfully!`);
                }
              }}
              onDeleteCategory={(id) => {
                const c = db.categories.find(item => item.id === id);
                const updated = db.categories.filter(item => item.id !== id);
                updateDB({ ...db, categories: updated });
                addAuditLog(currentUser.id, 'Delete Category', '', `Deleted category ${c?.name || id}`, 'Category', id);
                toast.success(`Category deleted successfully!`);
              }}
              onAddItem={(i) => {
                const newItm = { id: `itm-${Date.now()}`, ...i };
                updateDB({ ...db, items: [newItm, ...db.items] });
                addAuditLog(currentUser.id, 'Create Item', '', `Added master item ${i.name}`, 'Item', newItm.id);
                toast.success(`Item ${i.name} registered!`);
              }}
              onEditItem={(id, updated) => {
                const itmIndex = db.items.findIndex(i => i.id === id);
                if (itmIndex !== -1) {
                  db.items[itmIndex] = { ...db.items[itmIndex], ...updated };
                  updateDB({ ...db });
                  addAuditLog(currentUser.id, 'Update Item', '', `Updated master item ${updated.name || id}`, 'Item', id);
                  toast.success(`Item updated successfully!`);
                }
              }}
              onDeleteItem={(id) => {
                const i = db.items.find(item => item.id === id);
                const updated = db.items.filter(item => item.id !== id);
                updateDB({ ...db, items: updated });
                addAuditLog(currentUser.id, 'Delete Item', '', `Deleted master item ${i?.name || id}`, 'Item', id);
                toast.success(`Item deleted successfully!`);
              }}
            />
          )}

          {activeTab === 'pr' && (
            <PurchaseRequestsTab
              purchaseRequests={filteredPrs}
              projects={db.projects}
              items={db.items}
              currentUser={currentUser}
              onOpenCreatePRModal={() => setOpenModal('create-pr')}
              onUpdatePRStatus={handleUpdatePRStatus}
              onSelectPRDetail={setSelectedPrDetail}
            />
          )}

          {activeTab === 'po' && (
            <PurchaseOrdersTab
              purchaseOrders={filteredPos}
              vendors={db.vendors}
              projects={db.projects}
              currentUser={currentUser}
              onOpenCreatePOModal={() => setOpenModal('create-po')}
              onSelectPoDetail={setSelectedPo}
              onUpdatePOStatus={handleUpdatePOStatus}
            />
          )}

          {activeTab === 'grn' && (
            <GrnTab
              grns={db.grns}
              onOpenCreateGRNModal={() => setOpenModal('create-grn')}
            />
          )}

          {activeTab === 'stock' && (
            <StockManagementTab
              stocks={filteredStocks}
              items={db.items}
              categories={db.categories}
            />
          )}

          {activeTab === 'outward' && (
            <StoreOutwardTab
              outwards={db.storeOutwards}
              onOpenCreateOutwardModal={() => setOpenModal('create-outward')}
            />
          )}

          {activeTab === 'bills' && (
            <VendorBillsTab
              bills={db.vendorBills}
              currentUser={currentUser}
              onOpenCreateBillModal={() => setOpenModal('create-bill')}
              onUpdateBillStatus={(id, status) => {
                const bill = db.vendorBills.find(b => b.id === id);
                if (bill) { 
                  bill.status = status; 
                  updateDB({ ...db });
                  toast.success(`Bill ${bill.billNumber} status updated to ${status}`);
                }
              }}
            />
          )}

          {activeTab === 'payment-req' && (
            <PaymentRequestsTab
              paymentRequests={db.paymentRequests}
              currentUser={currentUser}
              onOpenCreatePaymentReqModal={() => setOpenModal('create-pay-req')}
              onUpdatePaymentReqStatus={(id, status) => {
                const req = db.paymentRequests.find(r => r.id === id);
                if (req) { 
                  req.status = status; 
                  updateDB({ ...db }); 
                  toast.success(`Payment request status set to ${status}`);
                }
              }}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentEntriesTab
              payments={db.paymentEntries}
              onOpenCreatePaymentModal={() => setOpenModal('create-payment')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              purchaseRequests={db.purchaseRequests}
              purchaseOrders={db.purchaseOrders}
              grns={db.grns}
              stocks={db.stock}
              outwards={db.storeOutwards}
              bills={db.vendorBills}
              payments={db.paymentEntries}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogsTab auditLogs={db.auditLogs} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              notifications={db.notifications}
              onMarkRead={(id) => {
                const n = db.notifications.find(item => item.id === id);
                if (n) { n.read = true; updateDB({ ...db }); }
              }}
            />
          )}

          {activeTab === 'permissions' && (
            <RolePermissionsTab
              rolePermissions={db.rolePermissions}
              onToggleModule={handleToggleModule}
            />
          )}
        </main>
      </div>

      {/* Global Modals Container */}
      <Modals
        openModal={openModal}
        setOpenModal={setOpenModal}
        projects={db.projects}
        vendors={db.vendors}
        items={db.items}
        purchaseRequests={db.purchaseRequests}
        purchaseOrders={db.purchaseOrders}
        vendorBills={db.vendorBills}
        paymentRequests={db.paymentRequests}
        stocks={db.stock}
        prForm={prForm}
        setPrForm={setPrForm}
        prItemInput={prItemInput}
        setPrItemInput={setPrItemInput}
        handleCreatePR={handleCreatePR}
        poForm={poForm}
        setPoForm={setPoForm}
        handleCreatePO={handleCreatePO}
        grnForm={grnForm}
        setGrnForm={setGrnForm}
        handleCreateGRN={handleCreateGRN}
        outwardForm={outwardForm}
        setOutwardForm={setOutwardForm}
        outwardItemInput={outwardItemInput}
        setOutwardItemInput={setOutwardItemInput}
        handleCreateOutward={handleCreateOutward}
        billForm={billForm}
        setBillForm={setBillForm}
        handleCreateBill={handleCreateBill}
        paymentReqForm={paymentReqForm}
        setPaymentReqForm={setPaymentReqForm}
        handleCreatePaymentReq={handleCreatePaymentReq}
        paymentEntryForm={paymentEntryForm}
        setPaymentEntryForm={setPaymentEntryForm}
        handleCreatePaymentEntry={handleCreatePaymentEntry}
        selectedPrDetail={selectedPrDetail}
        setSelectedPrDetail={setSelectedPrDetail}
        selectedPo={selectedPo}
        setSelectedPo={setSelectedPo}
      />
    </div>
  );
}
