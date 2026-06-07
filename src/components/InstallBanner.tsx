import { useState, useEffect } from "react";
import Icon from "./Icon";
import "../styles/installbanner.css";

const STORAGE_KEY = "wc26:install-dismissed";

type PromptEvent = { prompt: () => void; userChoice: Promise<{ outcome: string }> };

declare global {
  interface Window { __pwaPrompt: PromptEvent | null; }
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream as boolean;
}

function isInStandaloneMode(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
}

interface InstallBannerProps {
  storageShown: boolean;
  onDismiss: () => void;
}

export default function InstallBanner({ storageShown, onDismiss }: InstallBannerProps): React.ReactElement | null {
  const [prompt, setPrompt] = useState<PromptEvent | null>(() => window.__pwaPrompt ?? null);
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const ios = isIOS();

  useEffect(() => {
    const handler = () => setPrompt(window.__pwaPrompt);
    window.addEventListener("pwa-prompt-ready", handler);
    return () => window.removeEventListener("pwa-prompt-ready", handler);
  }, []);

  if (isInStandaloneMode()) return null;
  if (dismissed) return null;
  if (!storageShown) return null;
  if (!ios && !prompt) return null;

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "1");
    onDismiss();
  };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") dismiss();
    window.__pwaPrompt = null;
    setPrompt(null);
  };

  return (
    <div className="ib-wrap">
      <div className="ib-banner">
        <img src="/logo.svg" alt="WC26" className="ib-logo rounded-[6px]" />
        <div className="ib-body">
          <p className="ib-title">Install World Cup 26</p>
          {ios ? (
            <p className="ib-sub">Tap <strong>Share</strong> then <strong>Add to Home Screen</strong></p>
          ) : (
            <p className="ib-sub">Follow every match. Install for the best experience.</p>
          )}
        </div>
        <div className="ib-actions">
          {!ios && prompt && (
            <button className="ib-btn-install" onClick={install}>Install</button>
          )}
          <button className="ib-btn-dismiss" onClick={dismiss} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
