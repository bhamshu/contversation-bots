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
// websockurl = "ws://localhost:3000";

// app.use(express.json());
// app.use(cors());

let scrappers = []; // List of all connected scrappers
// let clients = []; // List of all connected clients

let clients = {}; // dictionary of all connected clients

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
            return tweet;
        }
        else
            return null;
    }
    catch {
        return null;
    }
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
    ws.send(JSON.stringify({ type: "allTweets", data: tweets }));
}
const searchTweets = async (query) => {
    // send query request to 5001 
    const msg = { type: 'query', data: query };
    const mes = JSON.stringify(msg);
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
    }
}

const firstmessage = (ws) => {
    const handler = async (message) => {
        console.log('message', message.toString());
        const { type, data } = JSON.parse(message.toString());
        if (type === "client") 
        {
            const clientobj = {
                ws: ws,
                queries: data.queries,
                urls: new Set()
            }
            // clients.push(clientobj);
            clients[data.userId] = clientobj;
            console.log("Client Connected");
            ws.on('close', () => {
                console.log("Client Disconnected");
                clients.delete(data.userId);
            });
            ws.off('message', handler);
            ws.on('message', handleClientMessage(ws))
        }
        if (type === "scrapper") {
            scrappers.push(ws);
            console.log("Scrapper Connected");
            ws.on('close', () => {
                console.log("Scrapper Disconnected");
                scrappers = scrappers.filter(scrapper => scrapper !== ws);
            });
            ws.off('message', handler);
            send(ws, "connected", "connected");
            ws.on('message', handleScrapperMessage(ws));
        }
    }
    return handler;
}
const send = (ws, type, data) => {
    ws.send(JSON.stringify({ type, data }));
}
const handleClientMessage = (ws) => {
    return async (message) => {
        const { type, data } = JSON.parse(message.toString());
        switch (type) {
            case "getAllTweets":
                await getAllTweets(ws);
                break;
            case "removeQuery":
                // removeQuery(data);
                break;
            case "search":
                searchTweets(data);
                break;
            default:
                console.log("Invalid message type");
        }
    }
}

const handleScrapperMessage = async (message) => {
    const { type, data } = JSON.parse(message.toString());
    // console.log(type, data);
    if (type === "tweet") {
        await insertData(data);
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