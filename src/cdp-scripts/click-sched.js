// CDP script: click a scheduled tasks page element by index
// Extracted from server.js POST /click (sched: branch)

export function buildSchedClickScript(schedIdx, safeLabel = '""') {
  return `
      (() => {
        // Try list view first (has "Add scheduled task" button)
        let anchor = document.querySelector('[aria-label="Add scheduled task"]');
        // Fallback: task detail/edit view
        if (!anchor) {
          anchor = document.querySelector('[aria-label="Edit task title"]');
        }
        // Fallback: task detail with name editing active
        if (!anchor) {
          anchor = document.querySelector('textarea[placeholder*="Prompt to execute"]');
        }
        if (!anchor) return { ok: false, reason: 'no_scheduled_tasks_page' };
        // Walk up to find the content panel
        let container = anchor;
        for (let i = 0; i < 15; i++) {
          if (!container.parentElement) break;
          const p = container.parentElement;
          if (p.getBoundingClientRect().x < 10) break;
          container = p;
        }
        const inner = container.querySelector('.flex-1.flex.flex-col.min-w-0.h-full') || container;
        const elements = [];
        inner.querySelectorAll('button, a, [role="button"], [role="combobox"], [role="switch"], input, select, textarea').forEach(el => elements.push(el));
        // Also include cursor-pointer divs (task cards are DIVs, not buttons)
        inner.querySelectorAll('[class*="cursor-pointer"], [aria-haspopup], [aria-expanded]').forEach(el => {
          if (elements.includes(el)) return;
          const text = (el.textContent || '').trim();
          if (text.length > 200) return;
          elements.push(el);
        });
        const idx = ${schedIdx};
        if (idx < 0 || idx >= elements.length) return { ok: false, reason: 'sched_index_out_of_range', total: elements.length };
        
        let target = elements[idx];
        let actualLabel = (target.textContent || target.getAttribute('placeholder') || '').trim().substring(0, 80);
        
        const expectedLabel = ${safeLabel};
        if (expectedLabel) {
          const cleanExpected = expectedLabel.trim().toLowerCase();
          if (actualLabel.trim().toLowerCase() !== cleanExpected) {
            const matchedEl = elements.find(el => {
              const lbl = (el.textContent || el.getAttribute('placeholder') || '').trim().toLowerCase();
              return lbl === cleanExpected || lbl.includes(cleanExpected) || cleanExpected.includes(lbl);
            });
            if (matchedEl) {
              target = matchedEl;
              actualLabel = (target.textContent || target.getAttribute('placeholder') || '').trim().substring(0, 80);
            }
          }
        }
        // For inputs/textareas, focus instead of click
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          target.focus();
        } else {
          target.click();
        }
        return { ok: true, label: actualLabel, source: 'sched' };
      })()
`;
}
