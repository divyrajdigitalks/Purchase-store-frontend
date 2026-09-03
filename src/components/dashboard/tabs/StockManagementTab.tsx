"use client";

import React, { useState } from 'react';
import { Stock, Item, Category } from '@/lib/storeData';
import { Table } from '@/components/ui/Table';
import { Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface StockManagementTabProps {
  stocks: Stock[];
  items: Item[];
  categories: Category[];
}

export function StockManagementTab({ stocks, items, categories }: StockManagementTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  const filteredStocks = stocks.filter(s => {
    if (onlyLowStock && s.quantity > (s.reorderLevel || 10)) return false;
    if (selectedCategory) {
      const item = items.find(i => i.id === s.itemId);
      if (item?.categoryId !== selectedCategory) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-[#0F172C]" />
          <div>
            <h3 className="text-lg font-black text-[#0F172C]">Inventory Stock Balances</h3>
            <p className="text-xs text-slate-500 font-bold">Real-time stock balance & min-stock alerts</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm font-extrabold text-[#0F172C] cursor-pointer">
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={e => setOnlyLowStock(e.target.checked)}
              className="h-4.5 w-4.5 rounded accent-rose-600 cursor-pointer"
            />
            <span>Low Stock Alerts Only</span>
          </label>

          <div className="min-w-[170px]">
            <Select
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Table
        headers={['Item Name', 'Item Code', 'Project', 'Available Stock', 'Unit', 'Reorder Level', 'Stock Health']}
        data={filteredStocks}
        itemsPerPage={10}
        renderRow={(s, idx) => {
          const isLow = s.quantity <= (s.reorderLevel || 10);
          return (
            <tr key={s.id || `${s.projectId}-${s.itemId}-${idx}`} className="custom-table-row">
              <td className="px-5 py-4 font-black text-[#0F172C] text-sm">{s.itemName}</td>
              <td className="px-5 py-4 font-mono text-[#0F172C] font-extrabold text-sm">{s.itemCode || '-'}</td>
              <td className="px-5 py-4 font-bold text-slate-700 text-sm">{s.projectName}</td>
              <td className="px-5 py-4 font-black text-[#0F172C] text-base">{s.quantity}</td>
              <td className="px-5 py-4 font-extrabold text-slate-800 text-sm">{s.unit}</td>
              <td className="px-5 py-4 font-extrabold text-slate-600 text-sm">{s.reorderLevel || 10}</td>
              <td className="px-5 py-4">
                {isLow ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Low Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Optimal
                  </span>
                )}
              </td>
            </tr>
          );
        }}
      />
    </div>
  );
}
