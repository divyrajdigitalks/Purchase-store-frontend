"use client";

import React from 'react';
import { PaymentRequest, User } from '@/lib/storeData';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { CreditCard, Plus, CheckCircle2 } from 'lucide-react';

interface PaymentRequestsTabProps {
  paymentRequests: PaymentRequest[];
  currentUser: User | null;
  onOpenCreatePaymentReqModal: () => void;
  onUpdatePaymentReqStatus: (reqId: string, status: PaymentRequest['status']) => void;
}

export function PaymentRequestsTab({
  paymentRequests,
  currentUser,
  onOpenCreatePaymentReqModal,
  onUpdatePaymentReqStatus
}: PaymentRequestsTabProps) {
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172C]">Vendor Payment Requests</h3>
            <p className="text-xs text-slate-500 font-medium">Payment requisitions & approval matrix</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={onOpenCreatePaymentReqModal}
        >
          New Payment Request
        </Button>
      </div>

      <Table
        headers={['Request Number', 'Bill Number', 'Vendor Name', 'Requested Amount', 'Request Date', 'Status', 'Actions']}
        data={paymentRequests}
        itemsPerPage={10}
        renderRow={(req) => (
          <tr key={req.id} className="custom-table-row">
            <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{req.requestNumber || req.id}</td>
            <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{req.billNumber}</td>
            <td className="px-5 py-4 font-medium text-slate-700 text-sm">{req.vendorName}</td>
            <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{formatCurrency(req.requestedAmount)}</td>
            <td className="px-5 py-4 font-normal text-slate-600 text-sm">{req.requestDate}</td>
            <td className="px-5 py-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {req.status}
              </span>
            </td>
            <td className="px-5 py-4">
              {(currentUser?.role === 'Approver' || currentUser?.role === 'Admin') && (req.status === 'Submitted' || req.status === 'Pending') && (
                <Button
                  variant="success"
                  size="sm"
                  icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  onClick={() => onUpdatePaymentReqStatus(req.id, 'Approved')}
                >
                  Approve Payment
                </Button>
              )}
            </td>
          </tr>
        )}
      />
    </div>
  );
}
