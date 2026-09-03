"use client";

import React from 'react';
import { VendorBill, User } from '@/lib/storeData';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Layers, Plus, CheckCircle2 } from 'lucide-react';

interface VendorBillsTabProps {
  bills: VendorBill[];
  currentUser: User | null;
  onOpenCreateBillModal: () => void;
  onUpdateBillStatus: (billId: string, status: NonNullable<VendorBill['status']>) => void;
}

export function VendorBillsTab({ bills, currentUser, onOpenCreateBillModal, onUpdateBillStatus }: VendorBillsTabProps) {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172C]">Vendor Invoices & Bills</h3>
            <p className="text-xs text-slate-500 font-medium">Vendor invoice registration & 3-way matching</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={onOpenCreateBillModal}
        >
          New Bill Entry
        </Button>
      </div>

      <Table
        headers={['Bill Number', 'Vendor Invoice #', 'Vendor Name', 'Bill Amount', 'Paid Amount', 'Due Date', 'Status', 'Actions']}
        data={bills}
        itemsPerPage={10}
        renderRow={(b) => {
          const currentStatus = b.status || b.paymentStatus;
          return (
            <tr key={b.id} className="custom-table-row">
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{b.billNumber}</td>
              <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{b.vendorInvoiceNumber || b.billNumber}</td>
              <td className="px-5 py-4 font-medium text-slate-700 text-sm">{b.vendorName}</td>
              <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{formatCurrency(b.billAmount)}</td>
              <td className="px-5 py-4 font-semibold text-emerald-700 text-sm">{formatCurrency(b.paidAmount || 0)}</td>
              <td className="px-5 py-4 font-normal text-slate-600 text-sm">{b.dueDate}</td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  currentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  currentStatus === 'Verified' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {currentStatus}
                </span>
              </td>
              <td className="px-5 py-4">
                {currentUser?.role === 'Accounts' && (currentStatus === 'Submitted' || currentStatus === 'Upcoming' || currentStatus === 'Pending') && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    onClick={() => onUpdateBillStatus(b.id, 'Verified')}
                  >
                    Verify Bill
                  </Button>
                )}
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}
