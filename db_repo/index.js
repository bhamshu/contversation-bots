const express = require("express");
const http = require("http");
const { WebSocket } = require('ws');
const { PrismaClient } = require("@prisma/client");
// const cors = require("cors");
const dotenv = require("dotenv");
// const { Pinecone } = require('@pinecone-database/pinecone');

// const use = require('@tensorflow-models/universal-sentence-encoder')
// const tf = require('@tensorflow/tfjs-node');

dotenv.config();

const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
server.listen(3000, () => {
    console.log("Server is running on 3000");
});
const treshold = 0;

setInterval(() => {
    console.log("Clients");
    console.log("no of clients", clients.size);
    clients.forEach((client, userId) => {
        console.log(userId, client.queries);
    })
}, 10000);

let scrappers = []; // List of all connected scrappers
let clients = new Map(); // Map => userId : {ws, queries, urls}

const sendToClient = async (post, source) => {
    console.log("here");
    console.log("checking new post,", post);
    for (let [userId, client] of clients) {
        let flag = 0;
        const { ws, queries } = client;
        console.log("Sending to clients ");
        console.log("Queries", queries);

        for (let query of queries) {
            const score = await fetch('http://localhost:5001', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: 'check', query: query, text: post.text })
            });
            const data = await score.json();
            console.log("onchecking", data);
            console.log("Score", data.score);
            if (data.score > treshold) {
                send(ws, "queryResult", { tweet: post, query: query, source: source });
            }
        }
    }
}
const insertTweet = async (message) => {
    await prisma.$connect();
    // if this tweet does not exist then add it to the database
    let tweet = await prisma.tweet.findUnique({
        where: {
            tweetUrl: message.tweetUrl
        }
    });
    console.log("here");
    if (!tweet) {
        console.log("hereagain");
        tweet = await prisma.tweet.create({
            data: {
                userName: message.userName,
                isVerified: message.isVerified,
                userHandle: message.userHandle,
                tweetTimestamp: message.tweetTimestamp,
                text: message.text,
                tweetUrl: message.tweetUrl,
                numberOfLikes: message.numberOfLikes,
                numberOfRetweets: message.numberOfRetweets,
                numberOfComments: message.numberOfComments,
            },
        });
        console.log("Tweet", tweet);
        insertToSmartDB({ id: tweet.id, text: tweet.text, source: "twitter" });
        sendToClient(tweet, "twitter");
    }
}
const insertReddit = async (message) => {
    await prisma.$connect();
    let reddit = await prisma.reddit.findUnique({
        where: {
            redditUrl: message.redditUrl
        }
    });
    if (!reddit) {
        try {
            reddit = await prisma.reddit.create({
                data: {
                    userName: message.userName,
                    userHandle: message.userHandle,
                    postTimestamp: message.postTimestamp,
                    text: message.text,
                    redditUrl: message.redditUrl,
                    numberOfUpvotes: message.numberOfUpvotes,
                    numberOfComments: message.numberOfComments,
                },
            });
            insertToSmartDB({ id: reddit.id, text: reddit.text, source: "reddit" });
            sendToClient(reddit, "reddit");
        }
        catch {
            return;
        }
    }
}
const insertData = async (data) => {
    console.log("Inserting Data", data);
    await prisma.$connect();
    let { source, message } = data;
    if (source === "twitter") {
        try {
            await insertTweet(message);
        }
        catch {
            return;
        }
    }
}
const insertToSmartDB = (message) => {
    const { id, text, source } = message;
    console.log("Inserting to Smart DB");
    const msg = { type: 'insert', data: { id, text, source } };
    console.log("Message", msg);
    const mes = JSON.stringify(msg);
    fetch('http://localhost:5001', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: mes
    }).then((response) => {

        if (response.status === 200) {
            console.log("Data sent to processing server");
        }
        else {
            console.log("Error sending data to processing server");
        }
    });
}
const insertAllData = async () => {
    const tweets = await prisma.tweet.findMany();
    console.log(tweets);
    for (let tweet of tweets) {
        const msg = { type: 'tweet', data: tweet };
        const mes = JSON.stringify(msg);
        const response = await fetch('http://localhost:5001', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: mes
        });
        if (response.status === 200) {
            console.log("Data sent to processing server");
        }
        else {
            console.log("Error sending data to processing server");
        }
    }
}
const getAllTweets = async (ws) => {
    const tweets = await prisma.tweet.findMany();
    tweets.sort((a, b) => {
        return new Date(b.tweetTimestamp) - new Date(a.tweetTimestamp);
    })
    send(ws, "allTweets", tweets);
}
const searchTweets = async (query, ws) => {

    if (query === "") return;

    const msg = { type: 'query', query: query };
    const mes = JSON.stringify(msg);
    console.log("Sending query to processing server", query, " ", mes);
    const response = await fetch('http://localhost:5001', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: mes
    });
    if (response.status === 200) {
        console.log("Query sent to processing server");
    }
    else {
        console.log("Error sending query to processing server");
        return;
    }
    //  how to get the response from the processing server
    let data = await response.json();
    let idss = data.ids;
    // console.log("ids", idss[0]);
    idss = idss[0].map(id => parseInt(id));
    // console.log("ids", idss);
    const tweets = await prisma.tweet.findMany({
        where: {
            id: {
                in: idss
            }
        }
    });
    // console.log("Tweets", tweets);
    for (let tweet of tweets) {
        send(ws, "queryResult", { tweet, query });
    }
}

const firstmessage = (ws) => {
    return async (message) => {
        message = message.toString();
        message = JSON.parse(message);
        // console.log("First Message Received", message);
        const { type, data } = message
        if (type === "client") {
            const clientobj = {
                ws: ws,
                queries: new Set(data),
                urls: new Set()
            }
            // clients.push(clientobj);
            clients.set(message.userId, clientobj);
            console.log("Client Connected");
            ws.on('close', () => {
                console.log("Client Disconnected");
                clients.delete(data.userId);
            });
            ws.off('message', firstmessage(ws));
            ws.on('message', handleClientMessage(ws))
        }
        if (type === "scrapper") {
            scrappers.push(ws);
            console.log("Scrapper Connected");
            ws.on('close', () => {
                console.log("Scrapper Disconnected");
                scrappers = scrappers.filter(scrapper => scrapper !== ws);
            });
            ws.off('message', firstmessage(ws));
            send(ws, "connected", {});
            ws.on('message', handleScrapperMessage(ws));
        }
    }
}
const send = (ws, type, data) => {
    ws.send(JSON.stringify({ type, data }));
}
const handleClientMessage = (ws) => {
    return async (message) => {
        message = message.toString();
        message = JSON.parse(message);
        console.log("Client Message Received", message);
        const { userId, type } = message;
        switch (type) {
            case "getAllTweets":
                await getAllTweets(ws);
                break;
            case "removeQuery":
                clients.get(userId).queries.delete(message.data);
                break;
            case "search":
                clients.get(userId).queries.add(message.data);
                searchTweets(message.data, ws);
                break;
            default:
                console.log("Invalid message type");
        }
    }
}

const handleScrapperMessage = (ws) => {
    return async (message) => {
        message = message.toString();
        message = JSON.parse(message);
        // console.log("Scrapper Message Received", message);
        const { type, data } = message;
        if (type === "tweet") {
            await insertData({ source: "twitter", message: data });
        }
    }
}
const WebSocketConnection = async (websock) => {
    console.log("Websocket Server Started");
    websock.on('connection', (ws) => {
        console.log("New Connection");
        ws.on('message', firstmessage(ws));
    });
}
WebSocketConnection(wss);
// insertAllData();

const populatereddits = async () => {
    const response = await fetch('http://localhost:5001', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'reddit' })
    });
    if (response.status === 200) {
        console.log("Reddit Data sent to processing server");
    }
    else {
        console.log("Error sending Reddit data to processing server");
    }

}
// setInterval(populatereddits, 10000);    