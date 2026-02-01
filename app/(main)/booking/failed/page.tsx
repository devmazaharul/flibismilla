'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { 
  X,
  RotateCcw, 
  ArrowLeft,
  LifeBuoy,
  AlertOctagon,
  Copy
} from 'lucide-react';
import { Suspense, useState } from 'react';

function FailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorMsg = searchParams.get('message') || "Session expired or fare no longer available.";
  
  // Simulate a support reference ID for reassurance
  const errorRef = `ERR-${Math.floor(100000 + Math.random() * 900000)}`;
  const [copied, setCopied] = useState(false);

  const copyErrorRef = () => {
    navigator.clipboard.writeText(errorRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
        
     

        {/* Headlines */}
        <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Booking could not be completed
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
              The transaction was declined or the connection was lost.
            </p>
        </div>

        {/* 📟 Technical Log Card */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            
            {/* Header of Card */}
            <div className="bg-gray-100/50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <AlertOctagon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">System Log</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">Ref: {errorRef}</span>
                    <button onClick={copyErrorRef} className="text-gray-400 hover:text-gray-600">
                        {copied ? <span className="text-[10px] font-bold text-green-600">COPIED</span> : <Copy className="w-3 h-3" />}
                    </button>
                </div>
            </div>

            {/* Error Message Body */}
            <div className="p-5">
                <p className="font-mono text-sm text-red-600 leading-relaxed break-words">
                   <span className="text-gray-400 select-none">{'>'} </span> 
                   {errorMsg}
                </p>
            </div>

            {/* Refund Reassurance Footer */}
            <div className="bg-red-50/50 px-4 py-3 border-t border-red-100/50">
                <p className="text-xs text-red-800/80 font-medium flex gap-2">
                   <span className="font-bold">Note:</span> 
                   No charges were applied. Any held funds will be released automatically within 3-5 days.
                </p>
            </div>
        </div>



        {/* Help Link */}
        <div className="mt-8 text-center">
           <a href="/contact" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors">
              <LifeBuoy className="w-3.5 h-3.5" />
              Report this issue to support
           </a>
        </div>

      </div>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={null}>
      <FailedContent />
    </Suspense>
  );
}