// CDP scripts: capture dropdown/portal content during snapshot
// Extracted from server.js captureSnapshot()

// Captures body-level listbox portals (schedule selector dropdowns)
// Tags interactive elements with scheddlg:100+ indices
export function buildCaptureListboxScript() {
  return `
            (() => {
              for (const child of document.body.children) {
                if (child.getBoundingClientRect().width <= 0) continue;
                // Check direct child first, then look for a nested [role="listbox"]
                // (Radix portals wrap the listbox in an extra div without a role)
                const listboxRoot = child.getAttribute('role') === 'listbox'
                  ? child
                  : child.querySelector('[role="listbox"]');
                if (!listboxRoot) continue;
                let idx = 0;
                const tagged = [];
                listboxRoot.querySelectorAll('[role="option"], button, a').forEach(el => {
                  el.setAttribute('data-ag-click-id', 'scheddlg:' + (100 + idx));
                  el.setAttribute('data-ag-click-label', el.textContent.trim().substring(0, 50));
                  idx++;
                  tagged.push(el);
                });
                if (idx === 0) continue;
                const clone = child.cloneNode(true);
                tagged.forEach(el => {
                  el.removeAttribute('data-ag-click-id');
                  el.removeAttribute('data-ag-click-label');
                });
                return clone.outerHTML;
              }
              return null;
            })()
`;
}

// Captures kebab context menus (popover/dialog portals from isolated context)
// Tags interactive elements with scheddlg:100+ indices
export function buildCaptureKebabMenuScript() {
  return `
            (() => {
              for (const child of document.body.children) {
                // Skip non-element nodes, scripts, and styles
                if (child.tagName === 'SCRIPT' || child.tagName === 'STYLE') continue;
                // Skip main app containers by well-known IDs (not Radix portal auto-IDs like "radix-:r0:")
                const cid = child.id || '';
                if (cid === 'app' || cid === 'root' || cid === '__next') continue;
                const text = child.textContent.trim();
                // 2000-char limit instead of 500 — schedule pickers with many options
                // can have substantial text; the old limit caused them to be skipped.
                if (!text || text.length > 2000) continue;
                // Match popover/context menu patterns:
                // - role="dialog" (Radix popover)
                // - data-side attribute (Radix positioning)
                // - role="menu" or role="listbox"
                const role = child.getAttribute('role');
                const hasSide = child.hasAttribute('data-side') || child.querySelector('[data-side]');
                const isPopover = role === 'dialog' || role === 'menu' || role === 'listbox' || hasSide;
                // Also match plain divs that look like menus (few children, short text, buttons inside)
                const hasButtons = child.querySelectorAll('button, [role="menuitem"], [role="option"]').length > 0;
                if (!isPopover && !hasButtons) continue;
                if (child.getBoundingClientRect().width <= 0) continue;

                let idx = 0;
                const tagged = [];
                child.querySelectorAll('button, [role="menuitem"], [role="option"], a').forEach(el => {
                  el.setAttribute('data-ag-click-id', 'scheddlg:' + (100 + idx));
                  el.setAttribute('data-ag-click-label', el.textContent.trim().substring(0, 50));
                  idx++;
                  tagged.push(el);
                });
                if (idx === 0) continue;
                const clone = child.cloneNode(true);
                tagged.forEach(el => {
                  el.removeAttribute('data-ag-click-id');
                  el.removeAttribute('data-ag-click-label');
                });
                return clone.outerHTML;
              }
              return null;
            })()
`;
}
