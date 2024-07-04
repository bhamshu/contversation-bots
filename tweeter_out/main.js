// get all tweets '' initially

// text box on top to write a query  
// send to localhost:3000/search with the json object
// {
//     query: "my query"
// }
const serverLink = 'http://localhost:3000';

async function fetchTweets() {
    try {
        const response = await fetch(serverLink+'/tweets');
        // just show the repsonse json on the page
        const tweets = await response.json();
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = JSON.stringify(tweets);
        // const tweets = await response.json();
        // displayTweets(tweets);
    } catch (error) {
        console.error('Error fetching tweets:', error);
    }
}

async function searchTweets() {
    const query = document.getElementById('queryInput').value;
    if(query==="") 
    {
        fetchTweets()
        return;
    }
    try {
        // const j = {"query":query} 
        // const response = await fetch(serverLink+'/search', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(j)
        // });
        const response = await fetch(serverLink+'/search?query='+query);
        const results = await response.json();
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = JSON.stringify(results);
        // displayTweets(results);
    } catch (error) {
        console.error('Error searching tweets:', error);
    }
}

// function displayTweets(tweets) {
//     const resultsDiv = document.getElementById('results');
//     resultsDiv.innerHTML = '';
//     tweets.forEach(tweet => {
//         const tweetDiv = document.createElement('div');
//         tweetDiv.textContent = tweet.text;
//         resultsDiv.appendChild(tweetDiv);
//     });
// }

window.onload = fetchTweets;

// textsearch query // timestamp
// threshold best x call 
// LOAD on live 
// localstroge  // client_pool // interest 