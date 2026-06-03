import React from 'react';
import type { ReportSection } from '../types';

export const ReportDrawer: React.FC<{ open: boolean; sections: ReportSection[]; onClose: () => void }>
= ({ open, sections, onClose }) => (
  <div className={`cosmos-drawer cosmos-report${open ? ' is-open' : ''}`}>
    <div className="cosmos-drawer__close" onClick={onClose}>×</div>
    <div className="cosmos-drawer__head">DEEP RESEARCH</div>
    <div className="cosmos-drawer__title">研究主题 · 深度报告</div>
    <div className="cosmos-drawer__sub">收束自全部星流</div>
    {sections.map((s, i) => (
      <div className="cosmos-report__sec" key={i} style={{ animationDelay: `${0.12 + i * 0.1}s` }}>
        <h2>{s.heading}</h2>
        <p>{s.body}{s.citeIds.length > 0 && <span className="cosmos-report__cit">{s.citeIds.join(' · ')}</span>}</p>
      </div>
    ))}
  </div>
);
