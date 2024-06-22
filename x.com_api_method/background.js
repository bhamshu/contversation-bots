chrome.webRequest.onCompleted.addListener(
    async (details) => {
        if (details.url.includes("graphql/1u0Wlkw6Ru1NwBUD-pDiww/HomeTimeline")) {
            try {
                const response = await fetch(details.url, {
                    method: details.method,
                    headers: new Headers(details.requestHeaders)
                });
                const data = await response.json();
                chrome.storage.local.set({ fetchedData: data });
            } catch (error) {
                console.log(error);
            }
        }
    },
    { urls: ["https://x.com/*"] },
    ["responseHeaders"]
);
