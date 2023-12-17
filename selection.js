let innerText = null;
let clickedEl = null;
document.addEventListener("contextmenu", (event) => {
    clickedEl = event.target;
    innerText = clickedEl.innerHTML;
    console.log("Element has been clicked, collecting innerText: ", innerText);
}, true);

let buildRewrite = null;
let middleRewrite = "";
let curTextContent = "";
let done = true;


const replaceText = (selection) => {
    const twoParts = curTextContent.split(selection);
    const fillerPiece = ""
    // const fillerWhitespace = fillerPiece.repeat(selection.length);
    const fillerWhitespace = selection.replace(/\S/g, fillerPiece)
    return twoParts[0] + middleRewrite + fillerWhitespace.slice(0, Math.max(0, (fillerWhitespace.length / fillerPiece.length - middleRewrite.length) * fillerPiece.length)) + twoParts[1];
}

const wrapText = (text, tag) => {
    return `<${tag} class="loadingFadeRewriteSelection">${text}</${tag}>`
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "beginRewrite" && done) {
        done = false;
        middleRewrite = ""
        curTextContent = clickedEl.innerHTML

        sendResponse({innerText});
        clickedEl.innerHTML = clickedEl.innerHTML.replace(request.selection, wrapText(request.selection, "span"))
        // Take element apply special styling to portion to indicate processing

        // clickedEl.textContent = replaceText(request.selection)
    }

    if (request.action === "progressRewrite") {
        
        const additional = request.rewrite;
        middleRewrite += additional;
        
        clickedEl.innerHTML = replaceText(request.selection)
    }
    
    if (request.action === "endRewrite") {
        done = true;
        clickedEl.innerHTML = clickedEl.innerHTML.replace(middleRewrite, `<mark>${middleRewrite}</mark>`)
        clickedEl.classList.remove("loadingFadeRewriteSelection")
        document.querySelector(".loadingFadeRewriteSelection").classList.remove("loadingFadeRewriteSelection")
    }
});