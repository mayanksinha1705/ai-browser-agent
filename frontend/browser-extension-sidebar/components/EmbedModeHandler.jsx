'use client';

import { useEffect } from 'react';

export function EmbedModeHandler() {
  useEffect(() => {
    const isEmbedded = document.documentElement.dataset.embed === 'extension';
    if (isEmbedded) {
      document.body.style.background = 'transparent';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    }
  }, []);

  return null;
}
