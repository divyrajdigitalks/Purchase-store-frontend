"use client";

import React from 'react';
import { PaymentEntry } from '@/lib/storeData';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { CreditCard, Plus } from 'lucide-react';

interface PaymentEntriesTabProps {
  payments: PaymentEntry[];
  onOpenCreatePaymentModal: () => void;
}

export function PaymentEntriesTab({ payments, onOpenCreatePaymentModal }: PaymentEntriesTabProps) {
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
            <h3 className="text-lg font-bold text-[#0F172C]">Vendor Payment Vouchers & Log</h3>
            <p className="text-xs text-slate-500 font-medium">Disbursed payment vouchers, NEFT/RTGS & UTR details</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={onOpenCreatePaymentModal}
        >
          Record Payment Voucher
        </Button>
      </div>

      <Table
        headers={['Voucher Number', 'Bill Number', 'Vendor Name', 'Paid Amount', 'Payment Mode', 'Transaction / UTR #', 'Payment Date']}
        data={payments}
        itemsPerPage={10}
        renderRow={(p) => (
          <tr key={p.id} className="custom-table-row">
            <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{p.paymentNumber || p.paymentId || p.id}</td>
            <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{p.billNumber}</td>
            <td className="px-5 py-4 font-medium text-slate-700 text-sm">{p.vendorName}</td>
            <td className="px-5 py-4 font-bold text-emerald-700 text-sm">{formatCurrency(p.paymentAmount)}</td>
            <td className="px-5 py-4 text-sm font-medium text-slate-800">{p.paymentMode}</td>
            <td className="px-5 py-4 font-mono text-[#0F172C] text-sm font-semibold">{p.transactionNumber || '-'}</td>
            <td className="px-5 py-4 font-normal text-slate-600 text-sm">{p.paymentDate}</td>
          </tr>
        )}
      />
    </div>
  );
}
