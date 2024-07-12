// config
// =========================================================
// const serverLink = 'http://localhost:3000';
const serverwsLink = 'ws://localhost:3000/ws';
let queryies = localStorage.getItem('queries') || [];
// random uuid 
// const queryies = [];
// =========================================================

let ws = new WebSocket(serverwsLink);
ws.onopen = () => {
    console.log('Connected to the server');
    ws.send(JSON.stringify({ type: "client", data: { userId, queries: queryies } }));
}
ws.onmessage = (message) => {
    console.log("message", message.data);
    const { type, data } = JSON.parse(message.data);
    switch (type) {
        case "allTweets":
            displayTweets(data);
            break;
        case "queryResult":
            addTweetToDOM(data);
        default:
            console.log("Invalid message type");
    }
}
// const allTweetshandler = (tweets) =>

async function fetchTweets() {
    ws.send(JSON.stringify({ type: "getAllTweets" }));
}
const showQueryOnUI = (query) => {
    const queryElement = document.createElement('div');
    queryElement.innerHTML = `
        <span>${query}</span>
        <button id="remove">X</button>
    `;
    const removeQuery = () => {
        queryElement.querySelector('#remove').addEventListener('click', () => {
            queryElement.remove();
            queryies = queryies.filter(q => q !== query);
            localStorage.setItem('queries', queryies);
        });
    }
    removeQuery();
    document.getElementById('queryContainer').appendChild(queryElement);
}
async function searchTweets() {
    const query = document.getElementById('queryInput').value;
    if (queryies.includes(query)) return;
    queryies.push(query);
    localStorage.setItem('queries', queryies);
    showQueryOnUI(query);

    // console.log("query", query);
    // ws.send(JSON.stringify({ type: "search", query: query }));
}
const loadTweets = async () => {
    // extract userid from url  // localhost:5000/?userId=123
    const userId = new URLSearchParams(window.location.search).get('userId');
    console.log("userId", userId);
    // if(path[path.length - 1] === 'tweets')
    console.log("queryies", queryies);
    // localStorage.setItem('queries', queryies);
    if (queryies.length === 0)
        fetchTweets();
    else {
        queryies = queryies.split(',');
        queryies.forEach(query => {
            showQueryOnUI(query);
            ws.send(JSON.stringify({ type: "search", query: query }));
        });

    }
}
function displayTweets(tweets) {
    const resultsDiv = document.getElementById('results');
    console.log("tweets", tweets)
    resultsDiv.innerHTML = '';
    tweets.forEach(tweet => {
        addTweetToDOM(tweet, null);
    });
}
function addTweetToDOM(tweet, query) {
    const resultsDiv = document.getElementById('results');
    const tweetDiv = document.createElement('div');
    tweetDiv.className = 'tweet-card';
    if (query) tweetDiv.setAttribute('data-query', query);
    let { userName, isVerified, userHandle, tweetTimestamp, tweetText, tweetUrl, numberOfLikes, numberOfRetweets, numberOfComments } = tweet;
    tweetDiv.innerHTML = `
        <h3>${userName}</h3>
        <p>${isVerified}</p>
        <p>${userHandle}</p>
        <p>${tweetTimestamp}</p>
        <p>${tweetText}</p>
        <p>${tweetUrl}</p>
        <p>${numberOfLikes}</p>
        <p>${numberOfRetweets}</p>
        <p>${numberOfComments}</p>
    `;
    resultsDiv.appendChild(tweetDiv);
}
window.onload = loadTweets;

// timestamp 
// LOAD on live 
// interest 
// revalidate data 
// multiple query 
