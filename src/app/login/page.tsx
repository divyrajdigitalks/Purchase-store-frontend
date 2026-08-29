"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/30 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/30 blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] z-10 transition-all duration-300 hover:shadow-[0_8px_40px_0_rgba(0,0,0,0.5)] hover:bg-white-[0.12]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-300 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <Input
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            actionRight={
              <a href="#" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                Forgot Password?
              </a>
            }
          />

          <Checkbox label="Remember me" id="remember" />

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Sign In
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <a href="#" className="text-purple-400 font-medium hover:text-purple-300 transition-colors">
            Sign up now
          </a>
        </p>
      </div>
    </div>
  );
}
