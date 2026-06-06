import { useState, useEffect } from "react";
import Icon from "./Icon";
import "../styles/installbanner.css";

const STORAGE_KEY = "wc26:install-dismissed";

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream as boolean;
}

function isInStandaloneMode(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export default function InstallBanner(): React.ReactElement | null {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const isIos = isIOS();
    setIos(isIos);

    if (isIos) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as unknown as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      dismiss();
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="ib-wrap">
      <div className="ib-banner">
        <img src="/logo.svg" alt="WC26" className="ib-logo rounded-[6px]" />

        <div className="ib-body">
          <p className="ib-title">Install World Cup 26</p>
          {ios ? (
            <p className="ib-sub">
              Tap <strong>Share</strong> then <strong>Add to Home Screen</strong>
            </p>
          ) : (
            <p className="ib-sub">Follow every match. Install for the best experience.</p>
          )}
        </div>

        <div className="ib-actions">
          {!ios && (
            <button className="ib-btn-install" onClick={install}>
              Install
            </button>
          )}
          <button className="ib-btn-dismiss" onClick={dismiss} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
