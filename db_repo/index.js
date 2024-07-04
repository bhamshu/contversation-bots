const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pinecone } = require('@pinecone-database/pinecone');
const use = require('@tensorflow-models/universal-sentence-encoder')
const tf = require('@tensorflow/tfjs-node')

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());
// console.log(process.env.PINECONE_API_KEY)
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = "tweeter-out";
const index = pc.index(indexName);
// console.log(index)

tf.ready().then(() => {
    console.log('TensorFlow.js Node.js backend ready');
});
let model;
(async () => {
    model = await use.load();
    console.log('Universal Sentence Encoder model loaded');
})();

getEmbedding = async (text) => {
    const embeddings = await model.embed([text]);
    const embedding = embeddings.arraySync()[0];
    return embedding;
}
app.post("/tweet", async (req, res) => {
    const message = req.body;
    // add this data only if it does not exist
    const tweet = await prisma.tweet.findUnique({
        where: {
            tweetUrl: message.tweetUrl
        }
    });

    if (!tweet) {
        await prisma.tweet.create({
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
    }
    // add a vector to the Pinecone inde
    const embeddings = await getEmbedding(tweet.tweetText);
    const vector = {
        id: tweet.id,
        embedding: embeddings,
        metadata: {
            url: tweet.tweetUrl
        }
    }
    const dataindb = await index.upsert([vector]);
    res.json(dataindb);
});

app.get("/tweets", async (req, res) => {
    const tweets = await prisma.tweet.findMany();
    res.json(tweets);
});

app.get("/search", async (req, res) => {
    const { query } = req.body;
    console.log(query);
    const queryVector = await getEmbedding(query);
    console.log(queryVector);
    const response = await index.namespace("").query({

        vector: queryVector,
        topK:2,
        includeMetadata: true
    })
    console.log(response);
    // const { matches } = 
})


app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
