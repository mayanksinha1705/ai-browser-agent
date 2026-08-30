// popup.js
// The popup NEVER calls Ollama directly and NEVER touches the DOM of the
// target page. It only collects the user's instruction and asks the
// background service worker to run the full pipeline.

const instructionEl = document.getElementById("instruction");
const executeBtn = document.getElementById("execute-btn");
const statusText = document.getElementById("status-text");

function setStatus(text, kind) {
  statusText.textContent = text;
  statusText.classList.remove("is-error", "is-success");
  if (kind === "error") statusText.classList.add("is-error");
  if (kind === "success") statusText.classList.add("is-success");
}

function setBusy(isBusy) {
  executeBtn.disabled = isBusy;
  instructionEl.disabled = isBusy;
}

executeBtn.addEventListener("click", () => {
  const instruction = instructionEl.value.trim();

  if (!instruction) {
    setStatus("Please enter an instruction first.", "error");
    return;
  }

  setBusy(true);
  setStatus("Capturing screenshot and asking Gemma…");

  chrome.runtime.sendMessage(
    { type: "EXECUTE_INSTRUCTION", instruction },
    (response) => {
      setBusy(false);

      if (chrome.runtime.lastError) {
        setStatus(
          "✗ Extension error: " + chrome.runtime.lastError.message,
          "error"
        );
        return;
      }

      if (!response) {
        setStatus("✗ No response from background worker.", "error");
        return;
      }

      if (response.success) {
        setStatus("✓ " + response.message, "success");
      } else {
        setStatus("✗ " + response.message, "error");
      }
    }
  );
});

// Allow Ctrl+Enter / Cmd+Enter to trigger execution from the textarea.
instructionEl.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    executeBtn.click();
  }
});
