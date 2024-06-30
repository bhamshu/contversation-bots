const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

app.post('/tweet', async (req, res) => {
    const message = req.body;
    console.log(process.env.DATABASE_URL);
    console.log(req.body)
    
    const tweet = await prisma.tweet.create({
        data: {
            userName: message.userName,
            isVerified: message.isVerified,
            userHandle: message.userHandle,
            tweetTimestamp: new Date(),
            tweetText: message.tweetText,
            tweetUrl: message.tweetUrl,
            numberOfLikes: message.numberOfLikes,
            numberOfRetweets: message.numberOfRetweets,
            numberOfComments: message.numberOfComments,
        },
    });
    res.json(tweet);
});

app.get('/tweets', async (req, res) => {
    const tweets = await prisma.tweet.findMany();
    res.json(tweets);
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});