'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLastUpdate(
        now.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200 mt-12 no-print">
      <div className="max-w-[1600px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <p>© 2026 Track & Trace System. All rights reserved.</p>
          <p>
            Last updated: <span>{lastUpdate}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
