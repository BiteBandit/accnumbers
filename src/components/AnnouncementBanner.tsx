'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<{ active: boolean; text: string }>({ 
    active: false, 
    text: '' 
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const { data } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', ['announcement_active', 'announcement_text']);

        if (data) {
          const settingsMap: Record<string, string> = {};
          data.forEach(item => {
            settingsMap[item.key] = item.value;
          });

          if (settingsMap['announcement_active'] === 'true' && settingsMap['announcement_text']) {
            // Check if the user already dismissed it during this session
            const isDismissed = sessionStorage.getItem('announcement_dismissed') === 'true';
            if (!isDismissed) {
              setAnnouncement({
                active: true,
                text: settingsMap['announcement_text']
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to load announcement:', err);
      }
    }

    fetchAnnouncement();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('announcement_dismissed', 'true');
  };

  if (!announcement.active || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white px-4 py-2.5 text-xs font-medium tracking-wide flex items-center justify-between shadow-md sticky top-0 z-40">
      <div className="flex items-center justify-center gap-2 mx-auto">
        <MegaphoneIcon className="w-4 h-4 shrink-0 animate-bounce text-amber-300" />
        <span>{announcement.text}</span>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer shrink-0"
        title="Dismiss announcement"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

