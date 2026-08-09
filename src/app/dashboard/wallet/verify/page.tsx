'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

function VerifyPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('reference');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment with Paystack...');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setMessage('No payment reference found.');
      return;
    }

    const verifyTransaction = async () => {
      try {
        const res = await fetch(`/api/verify-payment?reference=${reference}`);
        const data = await res.json();

        if (data.success) {
          setStatus('success');
          setMessage('Payment successful! Your wallet has been funded.');
          setTimeout(() => router.push('/dashboard/wallet'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Payment verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred while verifying payment.');
      }
    };

    verifyTransaction();
  }, [reference, router]);

  return (
    <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
      {status === 'verifying' && (
        <div className="w-12 h-12 mx-auto rounded-2xl border-4 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
      )}
      {status === 'success' && (
        <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto" />
      )}
      {status === 'error' && (
        <ExclamationCircleIcon className="w-12 h-12 text-red-500 mx-auto" />
      )}
      
      <h2 className="text-lg font-black text-[#0b1e5b]">
        {status === 'verifying' ? 'Processing...' : status === 'success' ? 'Top-up Successful' : 'Verification Failed'}
      </h2>
      <p className="text-xs text-gray-500 font-medium">{message}</p>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <div className="min-h-screen bg-[#fdfdfc] flex items-center justify-center p-6 font-sans">
      <Suspense fallback={
        <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl border-4 border-[#0b1e5b]/20 border-t-[#0b1e5b] animate-spin"></div>
          <h2 className="text-lg font-black text-[#0b1e5b]">Loading...</h2>
        </div>
      }>
        <VerifyPaymentContent />
      </Suspense>
    </div>
  );
}
