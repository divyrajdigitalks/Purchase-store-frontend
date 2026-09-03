"use client";

import React from 'react';
import { StoreOutward } from '@/lib/storeData';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ArrowUpRight, Plus } from 'lucide-react';

interface StoreOutwardTabProps {
  outwards: StoreOutward[];
  onOpenCreateOutwardModal: () => void;
}

export function StoreOutwardTab({ outwards, onOpenCreateOutwardModal }: StoreOutwardTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0F172C]">Store Outward / Material Issue</h3>
            <p className="text-xs text-slate-500 font-medium">Store issuance vouchers & consumption tracking</p>
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={onOpenCreateOutwardModal}
        >
          New Material Outward
        </Button>
      </div>

      <Table
        headers={['Outward Number', 'Project', 'Issued To', 'Department', 'Issue Date', 'Purpose', 'Total Items']}
        data={outwards}
        itemsPerPage={10}
        renderRow={(out) => (
          <tr key={out.id} className="custom-table-row">
            <td className="px-5 py-4 font-bold text-[#0F172C] text-sm">{out.outwardNumber || out.issueNumber}</td>
            <td className="px-5 py-4 font-semibold text-slate-800 text-sm">{out.projectName}</td>
            <td className="px-5 py-4 font-medium text-slate-700 text-sm">{out.issuedTo}</td>
            <td className="px-5 py-4 font-normal text-slate-600 text-sm">{out.department}</td>
            <td className="px-5 py-4 font-normal text-slate-600 text-sm">{out.issueDate}</td>
            <td className="px-5 py-4 text-slate-600 text-sm font-normal">{out.purpose || '-'}</td>
            <td className="px-5 py-4 font-medium">
              <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-xs">
                {out.items?.length || 0} Items Issued
              </span>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
