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
const treshold = 0.01;
setInterval(() => {
    console.log("Clients");
    console.log("no of clients", clients.size);
    clients.forEach((client, userId) => {
        console.log(userId, client.queries);
    })
}, 10000);
// websockurl = "ws://localhost:3000";

// app.use(express.json());
// app.use(cors());

let scrappers = []; // List of all connected scrappers
// let clients = []; // List of all connected clients

let clients = new Map(); // Map => userId : {ws, queries, urls}

const sendToClient = async (tweet) => {
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
                body: JSON.stringify({ type: 'check', query: query, tweetText: tweet.tweetText })
            });
            const data = await score.json();
            console.log("onchecking", data);
            console.log("Score", data.score);
            if (data.score > treshold) {
                send(ws, "queryResult", { tweet, query });
            }
        }
    }
}

const insertData = async (message) => {
    // console.log(message);
    await prisma.$connect();
    // add this data only if it does not exist
    let tweet = await prisma.tweet.findUnique({
        where: {
            tweetUrl: message.tweetUrl
        }
    });
    try {
        if (!tweet) {
            console.log("Adding tweet to the database");
            tweet = await prisma.tweet.create({
                data: {
                    userName: message.userName,
                    isVerified: message.isVerified,
                    userHandle: message.userHandle,
                    tweetTimestamp: message.tweetTimestamp,
                    tweetText: message.tweetText,
                    tweetUrl: message.tweetUrl,
                    numberOfLikes: message.numberOfLikes,
                    numberOfRetweets: message.numberOfRetweets,
                    numberOfComments: message.numberOfComments,
                },
            });

            console.log('tweet', tweet);
            // sent to port 5001 for processing 
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
        else
            return null;
    }
    catch {
        return null;
    }

    // check the new tweets score if good then send to the client
    sendToClient(tweet);
    return tweet;
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
        const { userId,type } = message;
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
        console.log("Scrapper Message Received", message);
        const { type, data } = message;
        if (type === "tweet") {
            await insertData(data);
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