/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { YouTubeManager } from '../audio/YouTubeManager';

const STORAGE_KEY = 'jdm_stereo_ad_pass_expiry';
const PASS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const TRIGGER_DELAY_MS = 40 * 1000; // 40 seconds
const AD_PLAY_DURATION_MS = 8000; // Time for ad presentation to play and complete

export function AdSenseGateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const adPushedRef = useRef(false);

  // Initialize and check if user already has an active 24-hour pass
  useEffect(() => {
    const hasValidPass = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const exp = parseInt(stored, 10);
          if (exp > Date.now()) {
            return true;
          }
        }
      } catch (e) {
        console.warn("Storage check error", e);
      }
      return false;
    };

    if (hasValidPass()) {
      return;
    }

    // Wait exactly 40 seconds after opening the site without displaying any countdown
    const triggerTimer = setTimeout(() => {
      if (!hasValidPass()) {
        setIsOpen(true);
      }
    }, TRIGGER_DELAY_MS);

    return () => clearTimeout(triggerTimer);
  }, []);

  // When modal opens, mute background audio, push AdSense request, and run ad playback duration
  useEffect(() => {
    if (isOpen) {
      setAdCompleted(false);

      // Temporarily mute audio while sponsor ad is shown
      try {
        AudioEngine.getInstance().setHardwareMute(true);
        YouTubeManager.getInstance().setHardwareMute(true);
      } catch (e) {}

      // Request AdSense ad slot fill
      if (!adPushedRef.current) {
        try {
          const w = window as any;
          w.adsbygoogle = w.adsbygoogle || [];
          w.adsbygoogle.push({});
          adPushedRef.current = true;
        } catch (e) {
          console.warn("AdSense notification:", e);
        }
      }

      // Allow ad to play and complete
      const adTimer = setTimeout(() => {
        setAdCompleted(true);
      }, AD_PLAY_DURATION_MS);

      return () => clearTimeout(adTimer);
    }
  }, [isOpen]);

  const handleClaimPassAndEnter = () => {
    if (!adCompleted) return;

    const newExpiry = Date.now() + PASS_DURATION_MS;
    try {
      localStorage.setItem(STORAGE_KEY, newExpiry.toString());
    } catch (e) {
      console.warn("Failed to write to localStorage", e);
    }

    // Restore audio hardware state
    try {
      AudioEngine.getInstance().setHardwareMute(false);
      YouTubeManager.getInstance().setHardwareMute(false);
    } catch (e) {}

    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md select-none">
      <div 
        className="relative w-full max-w-lg rounded-xl bg-zinc-950 border p-5 sm:p-6 shadow-2xl transition-all duration-300 flex flex-col"
        style={{
          borderColor: adCompleted ? 'rgba(52, 211, 153, 0.7)' : 'rgba(var(--color-lcd-primary-rgb), 0.6)',
          boxShadow: adCompleted 
            ? '0 0 40px rgba(52, 211, 153, 0.3)' 
            : '0 0 35px rgba(var(--color-lcd-primary-rgb), 0.25)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="p-1.5 rounded-md border"
              style={{
                borderColor: adCompleted ? 'rgba(52, 211, 153, 0.4)' : 'rgba(var(--color-lcd-primary-rgb), 0.4)',
                backgroundColor: adCompleted ? 'rgba(52, 211, 153, 0.1)' : 'rgba(var(--color-lcd-primary-rgb), 0.1)'
              }}
            >
              {adCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4" style={{ color: 'var(--color-lcd-primary)' }} />
              )}
            </div>
            <div>
              <h3 
                className="text-xs sm:text-sm font-mono uppercase font-black tracking-widest leading-none"
                style={{ color: adCompleted ? '#34d399' : 'var(--color-lcd-primary)' }}
              >
                {adCompleted ? 'SPONSOR AD COMPLETED' : 'SPONSOR PRESENTATION'}
              </h3>
              <p className="text-[9px] font-mono text-zinc-400 tracking-wider mt-1 uppercase">
                {adCompleted ? '24-HOUR ACCESS READY' : 'COMPLETE AD TO UNLOCK SITE ACCESS'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded bg-white/5 border border-white/10">
            {adCompleted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> AD VERIFIED
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> SITE LOCKED
              </span>
            )}
          </div>
        </div>

        {/* Explanatory banner */}
        <p className="text-[11px] sm:text-xs font-mono text-zinc-300 leading-relaxed mb-3">
          {adCompleted 
            ? 'Thank you for watching! Click the button below to claim your 24-hour all-access pass and enter the application.'
            : 'Please watch the sponsor message to completion. Once the ad completes, your 24-hour unrestricted pass will be unlocked.'
          }
        </p>

        {/* Ad Container */}
        <div className="relative w-full min-h-[260px] sm:min-h-[280px] bg-black/70 rounded-lg border border-white/10 p-2 flex flex-col items-center justify-center overflow-hidden mb-4">
          {/* Google AdSense Slot */}
          <ins 
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100%', minHeight: '250px' }}
            data-ad-client="ca-pub-7008805764361695"
            data-ad-slot="auto"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />

          {/* Background fallback banner */}
          <div className="text-center p-4 pointer-events-none select-none max-w-sm">
            <div 
              className="w-8 h-8 mx-auto mb-2 rounded-full border flex items-center justify-center"
              style={{
                borderColor: 'rgba(var(--color-lcd-primary-rgb), 0.3)',
                backgroundColor: 'rgba(var(--color-lcd-primary-rgb), 0.05)'
              }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--color-lcd-primary)' }} />
            </div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300">
              Google AdSense Network
            </div>
            <div className="text-[8.5px] font-mono text-zinc-500 mt-1">
              Publisher: ca-pub-7008805764361695
            </div>
            {!adCompleted && (
              <div className="mt-3 flex items-center justify-center gap-2 text-[9px] font-mono text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Ad in progress • Please wait</span>
              </div>
            )}
          </div>

          {/* Progress Bar along bottom of ad container */}
          {!adCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all ease-linear"
                style={{
                  width: '100%',
                  transitionDuration: `${AD_PLAY_DURATION_MS}ms`
                }}
              />
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="text-[9.5px] font-mono text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Pass duration: <strong className="text-zinc-200">24 Hours (Full Site Access)</strong></span>
          </div>

          <button
            onClick={handleClaimPassAndEnter}
            disabled={!adCompleted}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
              adCompleted
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.6)] cursor-pointer active:scale-95 animate-pulse'
                : 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed border border-zinc-700/60'
            }`}
          >
            {adCompleted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Enter Site (24-Hour Access Unlocked)</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                <span>Ad Playing • Please Wait</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
