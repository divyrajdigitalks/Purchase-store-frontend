import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white/[0.02] border-r border-white/10 hidden md:flex flex-col backdrop-blur-xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 tracking-tight">
            StoreDash
          </h2>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { name: 'Overview', active: true, icon: '🏠' },
            { name: 'Products', active: false, icon: '📦' },
            { name: 'Orders', active: false, icon: '🛒' },
            { name: 'Customers', active: false, icon: '👥' },
            { name: 'Analytics', active: false, icon: '📊' },
            { name: 'Settings', active: false, icon: '⚙️' },
          ].map((item) => (
            <a
              key={item.name}
              href="#"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                item.active 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </a>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <Link 
            href="/login"
            className="flex items-center space-x-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <span>🚪</span>
            <span className="font-medium">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-white/[0.01] border-b border-white/10 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                🔍
              </span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all w-64 text-gray-200 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 p-0.5 cursor-pointer">
              <div className="h-full w-full bg-[#0B0F19] rounded-full border-2 border-transparent flex items-center justify-center text-sm font-bold">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
              <p className="text-gray-400">Welcome back, John! Here's what's happening today.</p>
            </div>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20">
              + New Report
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Revenue', value: '$45,231.89', change: '+20.1%', positive: true },
              { label: 'Active Users', value: '2,350', change: '+180.1%', positive: true },
              { label: 'New Orders', value: '12,234', change: '-12.5%', positive: false },
              { label: 'Bounce Rate', value: '24.5%', change: '+2.4%', positive: false },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/[0.07] transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
                <div className={`text-sm font-medium ${stat.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stat.change} <span className="text-gray-500 font-normal">from last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts/Tables Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px]">
              <h3 className="text-lg font-semibold text-white mb-4">Revenue Analytics</h3>
              <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                <p className="text-gray-500">Chart Visualization Placeholder</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                      👤
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-200">User placed an order</p>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
