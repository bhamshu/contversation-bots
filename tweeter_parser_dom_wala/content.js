// configurations 
// ======================================================================= // 
const limit = 10;
let todo = false;
let cnt = 0;
let serverwslink = "ws://localhost:3000"
// ======================================================================= // 
const createWebSocket = (serverwslink) => {
    let ws = new WebSocket(serverwslink);

    ws.onopen = () => {
        console.log('Connected to the WebSocket server');
        let msg = { type: 'scrapper', data: 'Connected to the WebSocket server' };
        ws.send(JSON.stringify(msg));
    };

    ws.onmessage = (msg) => {
        // console.log('Message from server:', event.data);
        const { type, data } = JSON.parse(msg.data);
        console.log('Message from server:', type, data);
    };

    ws.onclose = () => {
        console.log('Disconnected from the WebSocket server');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    return ws;
}
const ws = createWebSocket(serverwslink);
const functionality = () => {
    // if (todo) {
    //     todo = false;

    // }
    // else {
    //     todo = true;
    // ws.close();
    // ws = createWebSocket(serverwslink);
    parseXcomContent();
    if (cnt == 0) {
        const userId = getUser();
        window.open(`http://localhost:5000?userId=${userId}`, '_blank');
    } 
    cnt = 1;
}
const getUser = () => {
    const $ = (selector, context = document) => context.querySelector(selector);
    const user_name = $('a[data-testid="AppTabBar_Profile_Link"]').href.split('/')[3];
    return user_name;
}
function parseXcomContent() {
    const urls = new Set();
    const wait = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

    const extract_data = (post) => {
        const $ = (selector, context = post) => context.querySelector(selector);
        // console.log('post : ', post);

        try {
            let user_name = $('div[data-testid="User-Name"] div[dir="ltr"] span span').textContent.trim();
            let isVerified = $('svg[aria-label="Verified account"]') ? true : false;
            let user_handle = $('div[data-testid="User-Name"] a[tabindex="-1"]').innerText;
            let tweet_timestamp = $('time').getAttribute('datetime');
            let text = $('div[data-testid="tweetText"]').textContent.trim();
            let tweet_url = $('a[role="link"][href*="/status/"]').getAttribute('href');
            let number_of_likes = $('button[data-testid="like"] span').innerText;
            let number_of_retweets = $('button[data-testid="retweet"] span').innerText;
            let number_of_comments = $('button[data-testid="reply"] span').innerText;
            return {
                userName: user_name,
                isVerified: isVerified,
                userHandle: user_handle,
                tweetTimestamp: tweet_timestamp,
                text: text,
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
    const insertTweetData = async (data) => {
        console.log("Data to be inserted: ", data);
        const msg = { type: 'tweet', data: data };
        ws.send(JSON.stringify(msg));
    };

    const handlePosts = () => {
        const possibleXposts = document.querySelectorAll('[data-testid="cellInnerDiv"]');
        possibleXposts.forEach((post) => {
            const data = extract_data(post);
            if (data && !urls.has(data.tweetUrl)) {
                insertTweetData(data);
                urls.add(data.tweetUrl);
            }
        });
    };

    const scrollAndWaitForPosts = async () => {
        window.scrollBy(0, window.innerHeight);
        await wait(2000);  // Wait for 1 second for the page to load more posts
        handlePosts();  // Update the posts
    };
    const main = async () => {
        // let startTime = Date.now();
        // while (true) {
        //     await scrollAndWaitForPosts();
        //     if (Date.now() - startTime >= 100000) {
        //         break;
        //     }
        // }
        // console.log('parsed ', urls.size, ' posts');
        // for (let i = 1; i <= limit; i++) {
        while(true)
            await scrollAndWaitForPosts();
        // }
    };
    main();
}
const addParseButton = () => {
    const button = document.createElement('button');
    button.id = 'parseButton';
    button.innerText = 'Parse X.com';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '1000';
    button.style.padding = '10px 20px';
    button.style.backgroundColor = '#1DA1F2';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);
    button.addEventListener('click', functionality);
};
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
// {
//     if (message.type === 'CONSOLE_LOG')
//     {
//         console.log('Message from background:', message.data);
//     }
// })
addParseButton();