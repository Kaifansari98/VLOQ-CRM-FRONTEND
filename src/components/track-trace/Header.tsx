'use client';

import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Track & Trace Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Real-time Operations & Analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></span>
              <span>Live</span>
            </div>
            <span className="text-sm text-gray-500">{currentTime}</span>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded hover:bg-gray-800 transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
