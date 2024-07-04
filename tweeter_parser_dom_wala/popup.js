// import { PrismaClient } from "@prisma/client";

// document.getElementById("parseButton").addEventListener("click", () => {
//     // redirect the user to localhost:5000 in new tab

//     chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
//         chrome.scripting.executeScript({
//             target: { tabId: tabs[0].id },
//             function: parseXcomContent,
//         });
//     });
//     chrome.tabs.create({ url: "http://localhost:5000" });
// });
// function parseXcomContent() {
//     const wait = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

//     const extract_data = (post) => {
//         const $ = (selector, context = post) => context.querySelector(selector);
//         console.log('post : ', post);

//         try {
//             let user_name = $('div[data-testid="User-Name"] div[dir="ltr"] span span').textContent.trim();
//             let isVerified = $('svg[aria-label="Verified account"]') ? true : false;
//             let user_handle = $('div[data-testid="User-Name"] a[tabindex="-1"]').innerText;
//             let tweet_timestamp = $('time').getAttribute('datetime');
//             let tweet_text = $('div[data-testid="tweetText"]').textContent.trim();
//             let tweet_url = $('a[role="link"][href*="/status/"]').getAttribute('href');
//             let number_of_likes = $('button[data-testid="like"] span').innerText;
//             let number_of_retweets = $('button[data-testid="retweet"] span').innerText;
//             let number_of_comments = $('button[data-testid="reply"] span').innerText;
//             return {
//                 userName: user_name,
//                 isVerified: isVerified,
//                 userHandle: user_handle,
//                 tweetTimestamp: tweet_timestamp,
//                 tweetText: tweet_text,
//                 tweetUrl: tweet_url,
//                 numberOfLikes: number_of_likes,
//                 numberOfRetweets: number_of_retweets,
//                 numberOfComments: number_of_comments
//             };
//         }
//         catch (error) {
//             return null;
//         }
//     }
//     const insertTweetData = async (data) => {
//         console.log("Data to be inserted: ", data);
//         try {
//             const response = await fetch('http://localhost:3000/tweet', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(data)
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             } else {
//                 console.log("Data successfully inserted", await response.json());
//             }
//         } catch (error) {
//             console.error("Error inserting data: ", error);
//         }
//     };

//     const handlePosts = () => {
//         const possibleXposts = document.querySelectorAll('[data-testid="cellInnerDiv"]');
//         possibleXposts.forEach((post) => {
//             const data = extract_data(post);
//             if (data) insertTweetData(data);
//         });
//     };

//     const scrollAndWaitForPosts = async () => {
//         window.scrollBy(0, window.innerHeight);
//         await wait(2000);  // Wait for 1 second for the page to load more posts
//         handlePosts();  // Update the posts
//     };
//     const main = async () => {
//         for (let i = 0; i < 5; i++) {
//             await scrollAndWaitForPosts();
//         }
//     };
//     main();
// }