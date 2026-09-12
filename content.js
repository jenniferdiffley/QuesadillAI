const DEFAULTS = {
  enabled: true,
  replacement: "quesadillas"
};

let settings = { ...DEFAULTS };
let originalText = new WeakMap();

function matchCase(source, replacement) {
  if (source === source.toUpperCase()) {
    return replacement.toUpperCase();
  }
  if (
    source.length > 1 &&
    source[0] === source[0].toUpperCase() &&
    source.slice(1) === source.slice(1).toLowerCase()
  ) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement.toLowerCase();
}

function shouldSkip(node) {
  const el = node.parentElement;
  if (!el) return true;

  const tag = el.tagName;
  return [
    "SCRIPT",
    "STYLE",
    "TEXTAREA",
    "INPUT",
    "SELECT",
    "OPTION",
    "CODE",
    "PRE",
    "NOSCRIPT"
  ].includes(tag) || el.isContentEditable;
}

function replaceNode(node) {
  if (shouldSkip(node)) return;

  const text = node.nodeValue;
  if (!text) return;

  // Save original text once, so disabling the extension restores the page.
  if (!originalText.has(node)) {
    originalText.set(node, text);
  }

  const original = originalText.get(node);

  if (!settings.enabled) {
    if (node.nodeValue !== original) {
      node.nodeValue = original;
    }
    return;
  }

  const replaced = original.replace(/\bAI\b/gi, (match) =>
    matchCase(match, settings.replacement)
  );

  if (node.nodeValue !== replaced) {
    node.nodeValue = replaced;
  }
}

function processTree(root = document.body) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    replaceNode(root);
    return;
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );

  let node;
  while ((node = walker.nextNode())) {
    replaceNode(node);
  }
}

function refreshPageText() {
  processTree(document.body);
}

chrome.storage.sync.get(DEFAULTS, (stored) => {
  settings = { ...DEFAULTS, ...stored };
  refreshPageText();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        processTree(addedNode);
      }

      if (
        mutation.type === "characterData" &&
        mutation.target.nodeType === Node.TEXT_NODE
      ) {
        // The site itself changed this node, so treat the new text as original.
        originalText.set(mutation.target, mutation.target.nodeValue);
        replaceNode(mutation.target);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;

  if (changes.enabled) {
    settings.enabled = changes.enabled.newValue;
  }

  if (changes.replacement) {
    settings.replacement =
      changes.replacement.newValue?.trim() || DEFAULTS.replacement;
  }

  refreshPageText();
});
