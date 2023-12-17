const rewrite = async (onClickData) => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const selection = onClickData.selectionText;
  const innerText = (
    await chrome.tabs.sendMessage(tab.id, {
      action: "beginRewrite",
      selection,
    })
  ).innerText;

  console.log("Received innerText:", innerText);
  console.log("Received selection:", selection);

  // The sentence "selection" is available in
  fetch("https://jzsang--start-py-rewrite.modal.run/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      innerText,
      selection,
    }),
  })
    .then((response) => response.body)
    .then((body) => {
      const reader = body.pipeThrough(new TextDecoderStream()).getReader();
      reader.read().then(function pump({ done, value }) {
        if (done) {
          // Do something with last chunk of data then exit reader
          chrome.tabs.sendMessage(tab.id, {
            action: "endRewrite",
          });
          return;
        }
        // Otherwise do something here to process current chunk
        chrome.tabs.sendMessage(tab.id, {
          action: "progressRewrite",
          rewrite: value,
          selection,
        });

        // Read some more, and call this function again
        return reader.read().then(pump);
      });
    })
    .catch((error) => console.error("[API] Error:", error));
};

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create(
    {
      title: "Rewrite",
      contexts: ["selection"], // ContextType
      id: "context-selection",
    },
    (o) => {
      console.log(o);
    }
  );
});

chrome.contextMenus.onClicked.addListener(rewrite);
