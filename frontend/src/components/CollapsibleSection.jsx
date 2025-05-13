// CollapsibleSection.jsx

import React, { useRef, useEffect } from 'react';
import './CollapsibleSection.css';

const CollapsibleSection = ({ title, description, isOpen, onToggle, children }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    const contentEl = contentRef.current;

    if (contentEl) {
      if (isOpen) {
        // Expand
        contentEl.style.maxHeight = contentEl.scrollHeight + 'px';

        // After transition, remove maxHeight to allow dynamic content expansion
        const handleTransitionEnd = () => {
          if (isOpen) {
            contentEl.style.maxHeight = 'none';
          }
          contentEl.removeEventListener('transitionend', handleTransitionEnd);
        };
        contentEl.addEventListener('transitionend', handleTransitionEnd);
      } else {
        // Collapse
        contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
        window.getComputedStyle(contentEl).maxHeight;
        contentEl.style.maxHeight = '0px';
      }
    }
  }, [isOpen, children]);

  return (
    <div className={`collapsible-section ${isOpen ? 'expanded' : ''}`}>
      <div className="collapsible-header" onClick={onToggle}>
        <h2>{title}</h2>
        <p className="description">{description}</p>
        <span className={`toggle-icon ${isOpen ? 'open' : 'closed'}`}>
          {isOpen ? '-' : '+'}
        </span>
      </div>
      <div ref={contentRef} className="collapsible-content">
        {children}
      </div>
    </div>
  );
};

export default CollapsibleSection;