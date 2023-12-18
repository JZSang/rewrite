let clickedEl = null;
document.addEventListener(
  "contextmenu",
  (event) => {
    clickedEl = event.target;
  },
  true
);

let buildRewrite = null;
let middleRewrite = "";
let initialInnerHTML = "";
let done = true;
let selection = null;

const replaceText = (selection) => {
  const twoParts = initialInnerHTML.split(selection);
  const fillerPiece = "";
  // const fillerWhitespace = fillerPiece.repeat(selection.length);
  const fillerWhitespace = selection.replace(/\S/g, fillerPiece);
  return (
    twoParts[0] +
    middleRewrite +
    fillerWhitespace.slice(
      0,
      Math.max(
        0,
        (fillerWhitespace.length / fillerPiece.length - middleRewrite.length) *
          fillerPiece.length
      )
    ) +
    twoParts[1]
  );
};

const wrapText = (text, tag) => {
  return `<${tag} class="loadingFadeRewriteSelection">${text}</${tag}>`;
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "beginRewrite" && done) {
    done = false;
    middleRewrite = "";
    initialInnerHTML = clickedEl.innerHTML;

    const div = document.createElement('div')
    div.appendChild(document.getSelection().getRangeAt(0).cloneContents())
    selection = div.innerHTML

    sendResponse({ innerText: initialInnerHTML, selection });
    clickedEl.innerHTML = clickedEl.innerHTML.replace(
      selection,
      wrapText(selection, "span")
    );
  }

  if (request.action === "progressRewrite") {
    const additional = request.rewrite;
    middleRewrite += additional;

    clickedEl.innerHTML = replaceText(selection);
  }

  if (request.action === "endRewrite") {
    done = true;
    clickedEl.innerHTML = clickedEl.innerHTML.replace(
      middleRewrite,
      `<mark>${middleRewrite}</mark>`
    );
    selection = "";
  }
});
