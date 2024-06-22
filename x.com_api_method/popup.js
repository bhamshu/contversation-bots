document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['fetchedData'], (result) => {
        const contentElement = document.getElementById('content');
        if (result.fetchedData) {
            contentElement.innerText = JSON.stringify(result.fetchedData, null, 2);
        } else {
            contentElement.innerText = 'No data found.';
        }
    });

    document.getElementById('fetchDataButton').addEventListener('click', () => {
        console.log('Fetching data...');  
        chrome.storage.local.get(['fetchedData'], (result) => {
            const contentElement = document.getElementById('content');
            // print the result to the console
            console.log(result);
            // contentElement.innerText = result;
            // if (result.fetchedData) {
            //     contentElement.innerText = JSON.stringify(result.fetchedData, null, 2);
            // } else {
            //     contentElement.innerText = 'No data found hjk.';
            // }
        });
    });
});
