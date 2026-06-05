import React from 'react';
import type { Citation, Authority } from '../types';

const AUTH_LABEL: Record<Authority, string> = { primary: '一手', authoritative: '权威', media: '媒体', community: '社区' };

export const CitationDrawer: React.FC<{ open: boolean; title: string; citations: Citation[]; accent: string; onClose: () => void }>
= ({ open, title, citations, accent, onClose }) => (
  <div className={`cosmos-drawer${open ? ' is-open' : ''}`} style={{ ['--cc' as string]: accent } as React.CSSProperties}>
    <div className="cosmos-drawer__close" onClick={onClose}>×</div>
    <div className="cosmos-drawer__head">CITATIONS · {title}</div>
    <div className="cosmos-drawer__title">{title}</div>
    <div className="cosmos-drawer__sub">引用 {citations.length} 篇文献</div>
    {citations.length === 0 && <div className="cosmos-drawer__sub">该节点仍在检索中,暂无引用。</div>}
    {citations.map((c, i) => (
      <div className="cosmos-cite" key={c.id} style={{ animationDelay: `${0.05 + i * 0.07}s` }}>
        <div className="cosmos-cite__title">{c.title}</div>
        <div className="cosmos-cite__row">
          <span className="cosmos-cite__tag">{AUTH_LABEL[c.authority]}</span>
          <span className="cosmos-cite__src">{c.source}{c.author ? ` · ${c.author}` : ''}{c.date ? ` · ${c.date}` : ''}</span>
        </div>
        {c.quote && <div className="cosmos-cite__quote">{c.quote}</div>}
        {c.url && <a className="cosmos-cite__link" href={c.url} target="_blank" rel="noreferrer">{c.url}</a>}
      </div>
    ))}
  </div>
);
