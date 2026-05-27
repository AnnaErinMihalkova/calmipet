import React from 'react';
import { createPortal } from 'react-dom';
import './FullscreenOverlay.css';

type FullscreenOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** When set, shows a header bar with title and back control */
  title?: string;
  ariaLabel?: string;
};

const FullscreenOverlay: React.FC<FullscreenOverlayProps> = ({
  open,
  onClose,
  children,
  title,
  ariaLabel = 'Full screen panel',
}) => {
  React.useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { style: bodyStyle } = document.body;
    const prev = {
      position: bodyStyle.position,
      top: bodyStyle.top,
      left: bodyStyle.left,
      right: bodyStyle.right,
      width: bodyStyle.width,
      overflow: bodyStyle.overflow,
    };

    document.documentElement.classList.add('fullscreen-overlay-open');
    document.body.classList.add('fullscreen-overlay-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.classList.remove('fullscreen-overlay-open');
      document.body.classList.remove('fullscreen-overlay-open');
      bodyStyle.position = prev.position;
      bodyStyle.top = prev.top;
      bodyStyle.left = prev.left;
      bodyStyle.right = prev.right;
      bodyStyle.width = prev.width;
      bodyStyle.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fullscreen-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {title != null && (
        <header className="fullscreen-overlay__header">
          <button
            type="button"
            className="fullscreen-overlay__back"
            onClick={onClose}
            aria-label="Back to home"
          >
            ← Home
          </button>
          <h2 className="fullscreen-overlay__title">{title}</h2>
          <button
            type="button"
            className="fullscreen-overlay__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>
      )}
      <div className="fullscreen-overlay__main">{children}</div>
    </div>,
    document.body,
  );
};

export default FullscreenOverlay;
