const DEFAULTS = {
  enabled: true,
  replacement: "quesadillas"
};

const enabled = document.getElementById("enabled");
const replacement = document.getElementById("replacement");
const save = document.getElementById("save");
const status = document.getElementById("status");

chrome.storage.sync.get(DEFAULTS, (stored) => {
  enabled.checked = stored.enabled;
  replacement.value = stored.replacement;
});

save.addEventListener("click", () => {
  const value = replacement.value.trim() || DEFAULTS.replacement;

  chrome.storage.sync.set(
    {
      enabled: enabled.checked,
      replacement: value
    },
    () => {
      replacement.value = value;
      status.textContent = "Saved 🌮";
      setTimeout(() => {
        status.textContent = "";
      }, 1200);
    }
  );
});
