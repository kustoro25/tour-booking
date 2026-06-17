'use client';

import { useState } from 'react';

export default function CopyButton({ bankNumber }: { bankNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bankNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = bankNumber;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-blue-600 text-sm hover:text-blue-700 font-medium transition-colors"
    >
      {copied ? '✓ Tersalin' : 'Salin'}
    </button>
  );
}
