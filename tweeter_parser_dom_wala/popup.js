document.getElementById("parseButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: parseXcomContent,
        });
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updatePopup") {
        const contentElement = document.getElementById("content");
        contentElement.innerText = request.content;
        contentElement.setAttribute("data-content", request.content); // Save the content in a data attribute
    }
});

document.getElementById("saveButton").addEventListener("click", () => {
    const content = document.getElementById("content").getAttribute("data-content");
    if (content) {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "parsed_content.txt";
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert("No content to save!");
    }
});

function parseXcomContent() {
    const xcomPosts = [];

    const wait = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

    const handlePosts = () => {
        const possibleXposts = document.querySelectorAll('[data-testid="cellInnerDiv"]');
        possibleXposts.forEach((post) => {
            const postText = post.innerText;
            const lines = postText.split("\n");
            if (lines.length < 5 || lines[1].charAt(0) !== "@") return;
            xcomPosts.push(postText);  // Push text instead of DOM element
        });
    };

    const scrollAndWaitForPosts = async () => {
        let iterations = 0;
        let previousPostCount = 0;
        let currentPostCount = xcomPosts.length;

        do {
            previousPostCount = currentPostCount;
            window.scrollTo(0, document.body.scrollHeight);
            await wait(1000);  // Wait for 1 second for the page to load more posts
            handlePosts();  // Update the posts
            currentPostCount = xcomPosts.length;
        } while (currentPostCount > previousPostCount && iterations++ < 50);
    };

    const startTime = new Date().getTime();
    scrollAndWaitForPosts().then(() => {
        console.log("Posts found: ", xcomPosts.length);
        const uniqueXcomPosts = [...new Set(xcomPosts)];
        console.log("Unique Posts found: ", uniqueXcomPosts.length);
        const endTime = new Date().getTime();
        const timeTaken = endTime - startTime;
        console.log("Time taken to parse the posts in milliseconds: ", timeTaken);

        // Send the content back to the extension's popup
        
        // chrome.runtime.sendMessage({ action: 'updatePopup', content: uniqueXcomPosts.join('\n\n') });
    });
}
