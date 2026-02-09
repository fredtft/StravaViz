
import React from 'react';

export const RunnerIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.49 5.59c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM12.3 8.3c-.3 0-.6.1-.9.3l-2.6 1.7C8.4 10.6 8 11.2 8 12v3.5c0 .6.4 1 1 1s1-.4 1-1V13l1-1v10c0 .6.4 1 1 1s1-.4 1-1v-7h2v7c0 .6.4 1 1 1s1-.4 1-1V10.2l-1.6-1.6c-.3-.2-.7-.3-1.1-.3z"/>
  </svg>
);

export const BikeIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
  </svg>
);

/**
 * Minimalist Sprinter Silhouette
 * Refined path inspired by the provided "power pose" reference.
 */
export const RunIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="18.5" cy="4.5" r="2.2" />
    <path d="M21 9.5c-.3 0-.6-.1-.8-.3l-3.2-3.2-3.5 3.5c-.3.3-.7.5-1.1.5h-2.1L5.5 5.5c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0L10 7.2h2.2l3.8-3.8c.4-.4 1-.4 1.4 0l3.5 3.5c.4.4.4 1 0 1.4-.2.1-.5.2-.9.2z" />
    <path d="M14.5 10.5l-3.5 3.5c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l3.5-3.5 1.5 1.5z" opacity="0.4" />
    <path d="M18.5 10.2l-3.8 3.8c-.4.4-1 .4-1.4 0l-3.5-3.5-1.5 6.5c-.1.5.2 1 .7 1.1s1-.2 1.1-.7l1.2-5.5 2.5 2.5c.4.4 1 .4 1.4 0l3.8-3.8c.4-.4.4-1 0-1.4-.4-.4-1-.4-1.4 0z" />
    <path d="M11.5 17.5l-3.5 3.5c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l3.5-3.5c.4-.4 1-.4 1.4 0s.4 1 0 1.4z" />
    <path d="M16.5 15.5l-3.5 3.5c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l3.5-3.5c.4-.4 1-.4 1.4 0s.4 1 0 1.4z" />
  </svg>
);

export const MapIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>
);

export const ListIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

export const StatsIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);

export const DownloadIcon = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
