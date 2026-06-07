import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Alerts from "../views/Alerts";
import Icon from "./Icon";

interface AlertsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function AlertsDrawer({ open, onClose }: AlertsDrawerProps): React.ReactElement {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Close button — centered above drawer */}
          <motion.button
            onClick={onClose}
            className="fixed z-50 flex items-center justify-center w-9 h-9 rounded-full"
            style={{
              bottom: "91dvh",
              left: 0,
              right: 0,
              margin: "0 auto",
              width: 36,
              background: "var(--modal-bg)",
              border: "1px solid var(--card-bd)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              color: "var(--txt)",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            aria-label="Close alerts"
          >
            <Icon name="x" size={16} />
          </motion.button>

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] flex flex-col"
            style={{
              height: "90dvh",
              background: "var(--modal-bg)",
              borderTop: "1px solid var(--card-bd)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: "var(--card-bd)" }}
              />
            </div>

            {/* Alerts content */}
            <div className="flex-1 overflow-hidden">
              <Alerts />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
