'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabaseClient';
import { UserGroupIcon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export default function CommunityModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function checkAndShow() {
      try {
        // 1. Check if group links modal is enabled in settings table
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'show_group_modal')
          .maybeSingle();

        if (data && data.value === 'true') {
          // 2. Ensure it only pops up once per browser session
          const hasShown = sessionStorage.getItem('community_modal_shown');
          if (!hasShown) {
            setShowModal(true);
            sessionStorage.setItem('community_modal_shown', 'true');
          }
        }
      } catch (err) {
        console.error('Community modal check error:', err);
      }
    }

    checkAndShow();
  }, []);

  if (!showModal) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#111111]/60 backdrop-blur-xs" onClick={() => setShowModal(false)}></div>
      
      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 text-center animate-in fade-in zoom-in duration-200">
        
        <button 
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 p-2 rounded-full text-[#6b7280] hover:text-[#111111] hover:bg-[#f8fafc] transition cursor-pointer"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto bg-emerald-50 text-emerald-600 border border-emerald-200">
          <UserGroupIcon className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-[#0b1e5b]">Join Our Community</h3>
          <p className="text-xs sm:text-sm text-[#6b7280] leading-relaxed">
            Stay updated with instant restocks, live giveaways, and 24/7 support by joining our official channels!
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="https://t.me/+n5XyLKDfkftjYzg0" // Replace with your Telegram link
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" /> Join Telegram Channel
          </a>
          
          <a
            href="https://chat.whatsapp.com/Eaw1eUZt7cS9m6vkPPyunv" // Replace with your WhatsApp link
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-[#25d366] hover:bg-[#20ba5a] text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" /> Join WhatsApp Group
          </a>
        </div>

        <button
          onClick={() => setShowModal(false)}
          className="text-xs font-mono font-bold text-[#6b7280] hover:text-[#111111] transition cursor-pointer pt-1"
        >
          Continue to Site
        </button>
      </div>
    </div>,
    document.body
  );
}

