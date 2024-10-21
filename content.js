(function () {
  let openAIKey = ""; // Replace with your actual API key
  chrome.storage.sync.get(["apiKey"]).then((result) => {
    openAIKey = result.apiKey;
  });

  let stopTranslation = false; // Global variable for stopping the translation

  const tryToAddButtons = () => {
    const targetElement = document.querySelector(".otgs-editor-container .nav");
    if (targetElement) {
      // Add "Translate with AI" button
      const translateButton = document.createElement("button");
      translateButton.textContent = "Translate with AI";
      translateButton.className = "translate-wpm-button";
      translateButton.addEventListener("click", () => translateWithAI(false));
      targetElement.appendChild(translateButton);

      // Add "Auto Translate" button
      const autoTranslateButton = document.createElement("button");
      autoTranslateButton.textContent = "Auto Translate";
      autoTranslateButton.className = "auto-translate-button";
      autoTranslateButton.addEventListener("click", () => translateWithAI(true));
      targetElement.appendChild(autoTranslateButton);

      // Add "Stop" button
      const stopButton = document.createElement("button");
      stopButton.textContent = "Stop";
      stopButton.className = "stop-translation-button";
      stopButton.addEventListener("click", () => {
        stopTranslation = true; // Set the global variable to stop
      });
      targetElement.appendChild(stopButton);

      console.log("Buttons added successfully!");
      return true;
    } else {
      console.log("Target element not found.");
      return false;
    }
  };

  const translateWithAI = (autoTranslate) => {
    // Ensure translation is not already stopped
    if (stopTranslation) {
      console.log("Translation stopped.");
      return;
    }

    // Capture the original text and target language
    const iframe = document.querySelector(".mce-panel iframe");
    let originalText = "";
    if (iframe && iframe.contentDocument) {
      const targetElement = iframe.contentDocument.querySelector("#tinymce");
      if (targetElement) {
        originalText = targetElement.innerHTML; // Capture the inner HTML
      }
    }

    const translationSpans = document.querySelectorAll(".translation div span");
    const button = autoTranslate ? document.querySelector(".auto-translate-button") : document.querySelector(".translate-wpm-button");

    if (originalText && translationSpans && translationSpans.length > 1) {
      const targetLanguage = translationSpans[1].textContent;
      button.disabled = true; // Disable the button
      sendToOpenAI(originalText, targetLanguage, button, autoTranslate);
    } else {
      console.log("Required elements not found for translation.");
    }
  };

  const sendToOpenAI = (originalText, targetLanguage, button, autoTranslate) => {
    const prompt = `${originalText} translate to ${targetLanguage}`;

    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Translate the following text. Keep the syntax or html tags as same if there is any with the translation. if the sentence already translated or too short dont say too short just translate only. dont add anything else and dont give any suggestions ever never. if the original text already in desired language keep it same." },
          { role: "user", content: prompt },
        ],
        temperature: 0,
        max_tokens: 1024,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API responded with status code ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (stopTranslation) {
          console.log("Translation stopped.");
          return;
        }

        if (data.choices && data.choices.length > 0 && "message" in data.choices[0]) {
          const translation = data.choices[0].message.content.trim();
          console.log("Translation:", translation);

          const iframe = document.querySelector(".mce-panel iframe");
          if (iframe && iframe.contentDocument) {
            const targetElement = iframe.contentDocument.querySelector("#tinymce");
            if (targetElement) {
              targetElement.innerHTML = translation;
            } else {
              console.error("Target element for translation replacement not found inside the iframe.");
            }
          } else {
            console.error("Iframe not found.");
          }

          // If autoTranslate is true, proceed with the automation
          if (autoTranslate) {
            automationProcess();
          }
        } else {
          throw new Error("Invalid or unexpected response structure from API");
        }
      })
      .catch((error) => {
        console.error("Error with OpenAI API:", error);
      })
      .finally(() => {
        button.disabled = false; // Re-enable the button
        stopTranslation = false; // Reset the stop flag
      });
  };

  const automationProcess = () => {
    if (stopTranslation) {
      console.log("Automation stopped.");
      return;
    }

    const saveButton = document.querySelector(".save-sentence-btn");
    if (saveButton) {
      saveButton.click(); // Click the save button
      setTimeout(() => {
        const addTranslationElement = document.querySelector(".add-translation");
        if (addTranslationElement) {
          document.querySelector(".auto-translate-button").click(); // Click Auto Translate again
        }
      }, 1000); // Wait for 1 second
    }
  };

  // Observer to add buttons when the target element is available
  const observer = new MutationObserver((mutations, obs) => {
    if (tryToAddButtons()) {
      obs.disconnect();
    }
  });

  if (!tryToAddButtons()) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
