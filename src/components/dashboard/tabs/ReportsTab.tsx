"use client";

import React, { useState } from 'react';
import { PurchaseRequest, PurchaseOrder, GRN, Stock, StoreOutward, VendorBill, PaymentEntry } from '@/lib/storeData';
import { Table } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';

interface ReportsTabProps {
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  grns: GRN[];
  stocks: Stock[];
  outwards: StoreOutward[];
  bills: VendorBill[];
  payments: PaymentEntry[];
}

export function ReportsTab({ purchaseRequests, purchaseOrders, stocks, bills, payments }: ReportsTabProps) {
  const [reportType, setReportType] = useState<string>('pr');

  const exportCSV = () => {
    toast.success(`Exporting ${reportType.toUpperCase()} Report to CSV file...`);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172C]">Store & Purchase MIS Reports</h3>
            <p className="text-xs text-slate-500 font-medium">Generate data logs, audit compliance & CSV exports</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="min-w-[220px]">
            <Select
              options={[
                { value: 'pr', label: 'PR Summary Report' },
                { value: 'po', label: 'PO Fulfillment Report' },
                { value: 'stock', label: 'Inventory Stock Report' },
                { value: 'bills', label: 'Vendor Bill Aging Report' },
                { value: 'payments', label: 'Disbursement Vouchers' }
              ]}
              value={reportType}
              onChange={e => setReportType(e.target.value)}
            />
          </div>

          <Button
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            onClick={exportCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {reportType === 'pr' && (
        <Table
          headers={['PR #', 'Project', 'Requester', 'Required Date', 'Items', 'Priority', 'Status']}
          data={purchaseRequests}
          itemsPerPage={10}
          renderRow={(pr) => (
            <tr key={pr.id} className="custom-table-row">
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{pr.prNumber}</td>
              <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{pr.projectName}</td>
              <td className="px-5 py-4 text-slate-700 font-medium text-sm">{pr.requesterName}</td>
              <td className="px-5 py-4 text-slate-600 font-normal text-sm">{pr.requiredDate}</td>
              <td className="px-5 py-4 font-medium text-slate-800 text-sm">{pr.items?.length || 0} Lines</td>
              <td className="px-5 py-4 font-medium text-slate-800 text-sm">{pr.priority}</td>
              <td className="px-5 py-4 font-semibold text-[#0F172C] text-sm">{pr.status}</td>
            </tr>
          )}
        />
      )}

      {reportType === 'po' && (
        <Table
          headers={['PO #', 'Vendor', 'Project', 'PO Date', 'Total Value', 'Status']}
          data={purchaseOrders}
          itemsPerPage={10}
          renderRow={(po) => (
            <tr key={po.id} className="custom-table-row">
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{po.poNumber}</td>
              <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{po.vendorName}</td>
              <td className="px-5 py-4 text-slate-700 font-medium text-sm">{po.projectName}</td>
              <td className="px-5 py-4 text-slate-600 font-normal text-sm">{po.poDate}</td>
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{formatCurrency(po.totalPOAmount || po.totalAmount || 0)}</td>
              <td className="px-5 py-4 font-semibold text-[#0F172C] text-sm">{po.status}</td>
            </tr>
          )}
        />
      )}

      {reportType === 'stock' && (
        <Table
          headers={['Item Name', 'Code', 'Project', 'Stock Qty', 'Unit', 'Reorder Threshold']}
          data={stocks}
          itemsPerPage={10}
          renderRow={(s, idx) => (
            <tr key={s.id || `${s.projectId}-${s.itemId}-${idx}`} className="custom-table-row">
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{s.itemName}</td>
              <td className="px-5 py-4 font-mono text-slate-800 font-semibold text-sm">{s.itemCode || '-'}</td>
              <td className="px-5 py-4 text-slate-700 font-medium text-sm">{s.projectName}</td>
              <td className="px-5 py-4 font-bold text-[#0F172C] text-base">{s.quantity}</td>
              <td className="px-5 py-4 font-medium text-slate-700 text-sm">{s.unit}</td>
              <td className="px-5 py-4 font-normal text-slate-600 text-sm">{s.reorderLevel || 10}</td>
            </tr>
          )}
        />
      )}

      {reportType === 'bills' && (
        <Table
          headers={['Bill #', 'Vendor Invoice #', 'Vendor Name', 'Bill Amount', 'Paid Amount', 'Status']}
          data={bills}
          itemsPerPage={10}
          renderRow={(b) => (
            <tr key={b.id} className="custom-table-row">
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{b.billNumber}</td>
              <td className="px-5 py-4 text-slate-800 font-medium text-sm">{b.vendorInvoiceNumber || b.billNumber}</td>
              <td className="px-5 py-4 font-medium text-slate-700 text-sm">{b.vendorName}</td>
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{formatCurrency(b.billAmount)}</td>
              <td className="px-5 py-4 font-semibold text-emerald-700 text-sm">{formatCurrency(b.paidAmount || 0)}</td>
              <td className="px-5 py-4 font-semibold text-[#0F172C] text-sm">{b.status || b.paymentStatus}</td>
            </tr>
          )}
        />
      )}

      {reportType === 'payments' && (
        <Table
          headers={['Voucher #', 'Bill #', 'Vendor', 'Amount Paid', 'Mode', 'Transaction / UTR #']}
          data={payments}
          itemsPerPage={10}
          renderRow={(p) => (
            <tr key={p.id} className="custom-table-row">
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{p.paymentNumber || p.paymentId || p.id}</td>
              <td className="px-5 py-4 text-slate-800 font-semibold text-sm">{p.billNumber}</td>
              <td className="px-5 py-4 font-medium text-slate-700 text-sm">{p.vendorName}</td>
              <td className="px-5 py-4 font-bold text-emerald-700 text-sm">{formatCurrency(p.paymentAmount)}</td>
              <td className="px-5 py-4 font-medium text-slate-800 text-sm">{p.paymentMode}</td>
              <td className="px-5 py-4 font-mono text-[#0F172C] text-sm font-semibold">{p.transactionNumber || '-'}</td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
