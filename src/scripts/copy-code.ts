// Progressive enhancement for DESIGN.md § 5.7: without this script a code block simply has no Copy button.
const COPIED_LABEL_MS = 2000;

const isApplePlatform = /Mac|iPhone|iPad/.test(navigator.userAgent);
const manualCopyLabel = `Press ${isApplePlatform ? '⌘C' : 'Ctrl+C'} to copy`;

function createStatusRegion(): HTMLElement {
  const region = document.createElement('div');
  region.className = 'sr-only';
  region.setAttribute('aria-live', 'polite');
  document.body.append(region);
  return region;
}

function selectText(code: HTMLElement): void {
  const range = document.createRange();
  range.selectNodeContents(code);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

async function copyCode(code: HTMLElement, button: HTMLButtonElement, status: HTMLElement): Promise<void> {
  const idleLabel = button.textContent ?? 'Copy';
  const finish = (label: string) => {
    button.textContent = label;
    status.textContent = label;
    setTimeout(() => {
      button.textContent = idleLabel;
    }, COPIED_LABEL_MS);
  };
  try {
    await navigator.clipboard.writeText(code.textContent ?? '');
    finish('Copied');
  } catch {
    selectText(code);
    finish(manualCopyLabel);
  }
}

function addCopyButton(block: HTMLElement, status: HTMLElement): void {
  const code = block.querySelector('pre code') as HTMLElement | null;
  if (!code) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-btn';
  button.textContent = 'Copy';
  button.addEventListener('click', () => copyCode(code, button, status));
  const tools = document.createElement('div');
  tools.className = 'code-tools';
  tools.append(button);
  block.prepend(tools);
}

const blocks = document.querySelectorAll<HTMLElement>('.code-block');
if (blocks.length > 0) {
  const status = createStatusRegion();
  blocks.forEach((block) => addCopyButton(block, status));
}
