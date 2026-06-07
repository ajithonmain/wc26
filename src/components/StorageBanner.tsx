import { useState } from "react";

const KEY = "wc26:storage-notice";

export function useStorageNoticeShown(): boolean {
  return !!localStorage.getItem(KEY);
}

export default function StorageBanner({ onDismiss }: { onDismiss?: () => void }): React.ReactElement | null {
  const [visible, setVisible] = useState(() => !localStorage.getItem(KEY));

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div className="sb-overlay" onClick={dismiss}>
      <div className="sb-card" onClick={(e) => e.stopPropagation()}>
        <p className="sb-title">Data saved on this device</p>
        <p className="sb-text">
          Your favorites and alerts are stored locally. Clearing browser data or reinstalling will reset them.
        </p>
        <button onClick={dismiss} className="sb-btn">
          Got it
        </button>
      </div>
    </div>
  );
}
