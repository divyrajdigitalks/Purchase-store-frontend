"use client";

import React from 'react';
import { GRN } from '@/lib/storeData';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ArrowDownLeft, Plus } from 'lucide-react';

interface GrnTabProps {
  grns: GRN[];
  onOpenCreateGRNModal: () => void;
}

export function GrnTab({ grns, onOpenCreateGRNModal }: GrnTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172C]">Goods Receipt Note (GRN / Inward)</h3>
            <p className="text-xs text-slate-500 font-medium">Material inward entry & physical quality check logs</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={onOpenCreateGRNModal}
        >
          New GRN Entry
        </Button>
      </div>

      <Table
        headers={['GRN Number', 'PO Number', 'Project', 'Vendor', 'Received Date', 'Challan / Vehicle', 'Items Received']}
        data={grns}
        itemsPerPage={10}
        renderRow={(g) => (
          <tr key={g.id} className="custom-table-row">
            <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{g.grnNumber}</td>
            <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{g.poNumber}</td>
            <td className="px-5 py-4 font-medium text-slate-700 text-sm">{g.projectName}</td>
            <td className="px-5 py-4 font-medium text-slate-700 text-sm">{g.vendorName}</td>
            <td className="px-5 py-4 font-normal text-slate-600 text-sm">{g.receivedDate || g.grnDate}</td>
            <td className="px-5 py-4 text-slate-800 text-sm font-medium">
              <div>Challan: {g.challanNumber || '-'}</div>
              <div className="text-xs text-slate-500">Veh: {g.vehicleNumber || '-'}</div>
            </td>
            <td className="px-5 py-4 font-medium">
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                {g.items?.length || 0} Items Received
              </span>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
