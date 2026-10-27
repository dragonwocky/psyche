// the default <Search>'s styles, injected once. themed by css variables on
// .psyche, dark by a .dark ancestor (darkMode "class") or the device ("media").
// ::highlight() is only styled by color and background-color, which every
// browser supports
const LIGHT = `--psyche-text:#0f0f0f;--psyche-secondary:#3f3f46;--psyche-background:#dee2e6;--psyche-backdrop:rgba(255,255,255,.6);--psyche-border:#d4d4d8;--psyche-accent:#ea596e;--psyche-interactive:#f1f3f5;--psyche-selected:#d4d4d8;--psyche-highlight-text:#f1f3f5;--psyche-highlight-background:#ea596e;`,
  DARK = `--psyche-text:#dde1e3;--psyche-secondary:#a1a1aa;--psyche-background:#181818;--psyche-backdrop:rgba(0,0,0,.6);--psyche-border:#2d2d2d;--psyche-accent:#f4abba;--psyche-interactive:#1f1f1f;--psyche-selected:#2d2d2d;--psyche-highlight-text:#181818;--psyche-highlight-background:#f4abba;`,
  CSS_TEXT = `
.psyche{${LIGHT}--psyche-font:system-ui,sans-serif;--psyche-mono:ui-monospace,monospace;position:fixed;inset:0;z-index:99999;display:flex;justify-content:center;font-family:var(--psyche-font);font-size:1rem;line-height:1.5;color:var(--psyche-text)}
.dark .psyche[data-dark-mode=class]{${DARK}}
@media (prefers-color-scheme:dark){.psyche[data-dark-mode=media]{${DARK}}}
.psyche *{box-sizing:border-box}
.psyche[data-open=false]{pointer-events:none}
.psyche-backdrop{position:absolute;inset:0;background:var(--psyche-backdrop);transition:opacity .15s}
.psyche[data-open=false] .psyche-backdrop,.psyche[data-open=false] .psyche-panel{opacity:0}
.psyche-panel{position:relative;width:100%;max-width:48rem;margin:1.5rem 1.5rem auto;display:flex;flex-direction:column;max-height:calc(100vh - 3rem);overflow:clip;border-radius:1rem;background:var(--psyche-background);border:1px solid var(--psyche-border);box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);transition:opacity .15s}
@media (min-width:768px){.psyche-panel{margin-top:20vh;max-height:60vh}}
.psyche-bar{display:flex;align-items:center;gap:.5rem;margin:.5rem;padding:0 .875rem 0 1.25rem;border-radius:.75rem;background:var(--psyche-interactive);box-shadow:0 0 0 1px var(--psyche-border)}
.psyche-bar:focus-within{box-shadow:0 0 0 2px var(--psyche-accent)}
.psyche-bar svg{width:1rem;height:1rem;flex-shrink:0;opacity:.6}
.psyche-input{flex:1;min-width:0;padding:1rem .5rem 1rem 1rem;font:inherit;color:inherit;background:none;border:none;outline:none;-webkit-appearance:none;appearance:none}
.psyche-input::placeholder{color:var(--psyche-secondary)}
.psyche-input::-webkit-search-cancel-button,.psyche-input::-webkit-search-decoration{-webkit-appearance:none;appearance:none}
.psyche-clear{display:inline-flex;padding:.25rem;border:none;background:none;color:inherit;cursor:pointer;border-radius:.375rem}
.psyche-pills{display:none;gap:.25rem}
@media (min-width:640px){.psyche-pills{display:inline-flex}}
.psyche-pill{min-width:2rem;padding:.125rem .5rem;font:inherit;font-size:.75rem;color:var(--psyche-text);background:var(--psyche-background);border:1px solid var(--psyche-border);border-radius:999px;cursor:pointer}
.psyche-pill:hover,.psyche-pill:focus-visible{border-color:var(--psyche-accent);outline:none}
.psyche-results{display:flex;flex-direction:column;gap:.5rem;padding:.5rem .5rem .625rem;overflow-y:auto}
.psyche-section{margin:.5rem 1.5rem 0;font-size:.75rem;font-weight:600;color:var(--psyche-accent)}
.psyche-result{display:block;padding:1rem 1.5rem;border-radius:.75rem;color:inherit;text-decoration:none;outline:none}
.psyche-result[data-selected=true]{background:var(--psyche-selected)}
.psyche-date{margin-bottom:.5rem;font-size:.75rem;color:var(--psyche-secondary)}
.psyche-row{display:flex;gap:1.25rem}
.psyche-row>svg{width:1.25rem;height:1.25rem;flex-shrink:0;margin-top:.125rem;color:var(--psyche-secondary)}
.psyche-title{margin:0;font-size:1rem;font-weight:700}
.psyche-heading{margin:0;font-size:.875rem;font-weight:600}
.psyche-excerpt{margin:0;font-size:.875rem;color:var(--psyche-secondary);white-space:pre-line;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
.psyche-excerpt:empty,.psyche-title:empty{display:none}
.psyche-tags{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem}
.psyche-tag{padding:.125rem .625rem;font-size:.75rem;border-radius:999px;background:var(--psyche-interactive);border:1px solid var(--psyche-border)}
.psyche-tag[data-field=authors]{color:var(--psyche-accent)}
.psyche-empty{margin:0;padding:1rem 1.5rem;font-size:.875rem;color:var(--psyche-secondary)}
.psyche-footer{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.625rem 1rem;font-size:.75rem;color:var(--psyche-secondary);border-top:1px solid var(--psyche-border)}
.psyche-footer p{margin:0}
.psyche-footer kbd{margin-right:.25rem;padding:.125rem .5rem;font-family:var(--psyche-mono);font-size:.7rem;color:var(--psyche-text);background:var(--psyche-interactive);border:1px solid var(--psyche-border);border-radius:999px}
.psyche-brand{display:inline-flex;align-items:center;gap:.25rem;color:var(--psyche-accent);text-decoration:none}
.psyche-brand svg{width:1.125rem;height:1.125rem}
::highlight(psyche){color:var(--psyche-highlight-text,#f1f3f5);background-color:var(--psyche-highlight-background,#ea596e)}
`;

const injectStyles = () => {
  if (document.querySelector("style[data-psyche]")) return;
  const $style = document.createElement("style");
  $style.dataset.psyche = "";
  $style.textContent = CSS_TEXT;
  document.head.append($style);
};

export { injectStyles };
