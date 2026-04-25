import { useEffect, useState } from 'react';

const STORAGE_KEY = 'opensynk_console_mode';

function readConsoleMode(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function useConsoleMode() {
  const [consoleMode, setConsoleModeState] = useState(readConsoleMode);

  useEffect(() => {
    document.body.classList.toggle('opensynk-console-mode', consoleMode);

    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setConsoleModeState(readConsoleMode());
      }
    }

    function onConsoleModeChanged() {
      setConsoleModeState(readConsoleMode());
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('opensynk-console-mode-changed', onConsoleModeChanged);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('opensynk-console-mode-changed', onConsoleModeChanged);
    };
  }, [consoleMode]);

  function setConsoleMode(enabled: boolean) {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    setConsoleModeState(enabled);
    document.body.classList.toggle('opensynk-console-mode', enabled);
    window.dispatchEvent(new Event('opensynk-console-mode-changed'));
  }

  return { consoleMode, setConsoleMode };
}

export function useConsoleTransitionClass() {
  // Kept intentionally lightweight. Route-level transitions can be added in App.tsx later
  // without changing page layouts.
  return '';
}
