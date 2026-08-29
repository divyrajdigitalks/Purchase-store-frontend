"use client";

import React, { useState } from 'react';
import { getDatabase } from '@/lib/storeData';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { KeyRound, Mail, ShieldAlert, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@system.com');
  const [password, setPassword] = useState('password123');
  const [roleSelect, setRoleSelect] = useState('Admin');
  const [error, setError] = useState('');

  const handleRoleSelectChange = (role: string) => {
    setRoleSelect(role);
    const db = getDatabase();
    const match = db.users.find(u => u.role === role);
    if (match) {
      setEmail(match.email);
      setPassword('password123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const db = getDatabase();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      setError('User profile not discovered. Switch roles above to retry.');
      return;
    }

    if (!user.active) {
      setError('Account is inactive.');
      return;
    }

    localStorage.setItem('active_user', JSON.stringify(user));
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 p-4 relative overflow-hidden">
      {/* Background graphic fills */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-100/40 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <Card className="p-8 border-slate-200/85 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] bg-white relative">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-[#045598] border border-blue-100 mb-4 animate-pulse">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">
              SteelStream ERP
            </h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Purchase, Store & Vendor Payment Management System
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-start space-x-2 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="Select Test Profile"
              value={roleSelect}
              onChange={(e) => handleRoleSelectChange(e.target.value)}
              options={[
                { value: 'Admin', label: 'Admin (Full Control)' },
                { value: 'Requester', label: 'Requester (Site Operations)' },
                { value: 'Purchase', label: 'Purchase (Reviews & PO)' },
                { value: 'Store', label: 'Store Manager (GRN & Stock)' },
                { value: 'Accounts', label: 'Accounts (Dues & Entries)' },
                { value: 'Management', label: 'Management (Reports & Dashboards)' }
              ]}
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@system.com"
              required
              icon={<Mail className="h-4 w-4" />}
            />

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#045598] focus:bg-white focus:ring-4 focus:ring-[#045598]/10 outline-none transition-all placeholder:text-slate-400 text-slate-900 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-primary-blue hover:bg-primary-blue-hover text-white font-bold text-sm shadow-md shadow-blue-900/10 hover:shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-2"
            >
              <Sparkles className="h-4.5 w-4.5" />
              <span>Launch Workspace</span>
            </button>
          </form>
        </Card>
        
        <div className="mt-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          SteelStream ERP • Version 1.2
        </div>
      </div>
    </div>
  );
}
