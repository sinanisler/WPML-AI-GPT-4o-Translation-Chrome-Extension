document.querySelector("#save-button").addEventListener("click", () => {
  const apiKey = document.querySelector("#api-key").value;
  chrome.storage.sync.set({ apiKey }).then(() => {
    document.querySelector("#result-text").innerText = "API key saved!";
  });
});
