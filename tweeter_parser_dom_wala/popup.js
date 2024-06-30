// import { PrismaClient } from "@prisma/client";

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
            // xcomPosts.push(postText);  // Push text instead of DOM element
            xcomPosts.push(post);
        });
    };

    const scrollAndWaitForPosts = async () => {
        let iterations = 0;
        let previousPostCount = 0;
        let currentPostCount = xcomPosts.length;

        do {
            previousPostCount = currentPostCount;
            window.scrollBy(0, window.innerHeight);
            await wait(2000);  // Wait for 1 second for the page to load more posts
            handlePosts();  // Update the posts
            currentPostCount = xcomPosts.length;
        } while (currentPostCount > previousPostCount && iterations++ < 5);
    };
    // load the data in my sql database
    const extract_data  = (post) => 
    {
        const $ = (selector, context = post) => context.querySelector(selector);
        console.log('post : ',post);

        try {
            let user_name = $('div[data-testid="User-Name"] div[dir="ltr"] span span').textContent.trim();
            let isVerified = $('svg[aria-label="Verified account"]')? true : false;
            let user_handle = $('div[data-testid="User-Name"] a[tabindex="-1"]').innerText;
            let tweet_timestamp = $('time').getAttribute('datetime');
            let tweet_text = $('div[data-testid="tweetText"]').textContent.trim();
            let tweet_url = $('a[role="link"][href*="/status/"]').getAttribute('href');
            let number_of_likes = $('button[data-testid="like"] span').innerText;
            let number_of_retweets = $('button[data-testid="retweet"] span').innerText;
            let number_of_comments = $('button[data-testid="reply"] span').innerText;
            return {
                userName: user_name,
                isVerified: isVerified,
                userHandle: user_handle,
                tweetTimestamp: tweet_timestamp,
                tweetText: tweet_text,
                tweetUrl: tweet_url,
                numberOfLikes: number_of_likes,
                numberOfRetweets: number_of_retweets,
                numberOfComments: number_of_comments
            };
        }
        catch (error) {
            return null;
        }
    }
    // const insertTweetData = async (data) => 
    // {
    //     // localhost:3000/tweet
    //     // make api request to 
         
    // };
    const insertTweetData = async (data) => {
    console.log("Data to be inserted: ", data);
    try {
        const response = await fetch('http://localhost:3000/tweet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        } else {
            console.log("Data successfully inserted", await response.json());
        }
    } catch (error) {
        console.error("Error inserting data: ", error);
    }
    };      
    const insert_to_db = (uniqueXcomPosts) => 
    {
        uniqueXcomPosts.forEach((post) => 
        {
            const data = extract_data(post);
            if (data) zinsertTweetData(data);
        })     
    }
    const startTime = new Date().getTime();
    scrollAndWaitForPosts().then(() => 
    {
        console.log("Posts found: ", xcomPosts.length);
        const uniqueXcomPosts = [...new Set(xcomPosts)];
        console.log("Unique Posts found: ", uniqueXcomPosts.length);
        insert_to_db(uniqueXcomPosts);
        const endTime = new Date().getTime();
        const timeTaken = endTime - startTime;
        console.log("Time taken to parse the posts in milliseconds: ", timeTaken);

    });
}




        // console.log("Posts found: ", xcomPosts.length);
        // const uniqueXcomPosts = [...new Set(xcomPosts)];
        // console.log("Unique Posts found: ", uniqueXcomPosts.length);
        // handle(uniqueXcomPosts[0]);
        // // const post1=uniqueXcomPosts[0];
        // // save the first post to a file
        // const blob = new Blob([str], { type: "text/plain" });
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement("a");
        
        // const endTime = new Date().getTime();
        // const timeTaken = endTime - startTime;
        // // console.log("Time taken to parse the posts in milliseconds: ", timeTaken);