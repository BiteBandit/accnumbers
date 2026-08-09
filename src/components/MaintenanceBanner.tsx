'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export default function MaintenanceBanner() {
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    async function checkMaintenance() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        if (data && data.value === 'true') {
          setIsMaintenance(true);
        }
      } catch (err) {
        console.error('Maintenance check error:', err);
      }
    }

    checkMaintenance();
  }, []);

  if (!isMaintenance) return null;

  return (
    <>
      {/* Global Banner */}
      <div className="bg-amber-500 text-white px-4 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md sticky top-0 z-50">
        <ExclamationTriangleIcon className="w-4 h-4 shrink-0 animate-pulse" />
        <span>System Maintenance Active: Number purchasing & wallet funding are temporarily paused.</span>
      </div>

      {/* Invisible Interactive Blockguard with custom alert modal */}
      <MaintenanceBlocker />
    </>
  );
}

// Helper sub-component to disable purchase/fund actions client-side with a custom modal
function MaintenanceBlocker() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    async function checkAdminAndBlock() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.is_admin) return; // Admins bypass
      }

      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest('button, a');
        if (!button) return;

        const text = button.textContent?.toLowerCase() || '';
        if (
          text.includes('buy') || 
          text.includes('purchase') || 
          text.includes('fund') || 
          text.includes('deposit') || 
          text.includes('pay') ||
          text.includes('number')
        ) {
          e.preventDefault();
          e.stopPropagation();
          setShowAlert(true);
        }
      };

      document.addEventListener('click', handleClick, true);
      return () => document.removeEventListener('click', handleClick, true);
    }

    checkAdminAndBlock();
  }, []);

  if (!showAlert) return null;

  // Render the custom modal securely using a portal or standard overlay
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#111111]/50 backdrop-blur-xs" onClick={() => setShowAlert(false)}></div>
      <div className="relative w-full max-w-sm bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-2xl z-10 space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border bg-amber-50 text-amber-600 border-amber-200">
          <ExclamationTriangleIcon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-[#0b1e5b]">Maintenance Active</h3>
          <p className="text-xs text-[#6b7280] leading-relaxed">Platform is currently under maintenance. Actions are temporarily paused.</p>
        </div>
        <button
          onClick={() => setShowAlert(false)}
          className="w-full py-2.5 rounded-xl bg-[#0b1e5b] text-white font-bold text-xs hover:bg-[#0b1e5b]/90 transition cursor-pointer shadow-xs"
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
}

