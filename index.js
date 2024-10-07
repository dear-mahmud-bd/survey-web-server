const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o38st.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const userCollection = client.db('SURVEY_APP_DB').collection('all_user');
        const surveyCollection = client.db('SURVEY_APP_DB').collection('all_survey');



        // add user when Register a user...
        app.post('/users', async (req, res) => {
            const user = req.body;
            // insert email if user doesnt exists: (1. email unique, 2. upsert 3. simple checking)
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });
        // pro_users related api ...
        app.get('/users/pro_user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            // console.log(user?.pro_user);
            res.send({ pro_user: user?.pro_user });
        })






        // Get all surveys ...
        app.get('/all-survey', async (req, res) => {
            // const serviceName = req.query.survey_name;
            let query = {};
            // if (surveyName) {
            //     query.surveyName = { $regex: surveyName, $options: 'i' };
            // }
            const cursor = surveyCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        // Get a specific survey ...
        app.get('/all-survey/:_id', async (req, res) => {
            const id = req.params._id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: 'Invalid ID format. ID must be a 24-character hexadecimal string.' });
            }
            const query = { _id: new ObjectId(id) };
            const result = await surveyCollection.findOne(query);
            res.send(result);
        })
        // Get Recent Survey ...
        app.get('/recent-surveys', async (req, res) => {
            const result = await surveyCollection.find({}).sort({ createdISO: -1 }).limit(6).toArray();
            res.send(result);
        });
        // Get Most Voted Survey ...
        app.get('/mostvoted-surveys', async (req, res) => {
            const result = await surveyCollection.find({}).sort({ total_vote: -1 }).limit(6).toArray();
            res.send(result);
        });
        // update vote count and add user email...
        app.put('/all-survey/:_id', async (req, res) => {
            const id = req.params._id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateSurvey = req.body;
            const survey = await surveyCollection.findOne(filter);
            const isYesVote = updateSurvey.vote === 'yes';
            const updatedVoteCount = (isYesVote ? (survey.yes_vote || 0) : (survey.no_vote || 0)) + 1;
            const voteField = isYesVote ? 'yes_vote' : 'no_vote';
            const surveyDoc = {
                $set: {
                    total_vote: (survey.total_vote || 0) + 1,
                    [voteField]: updatedVoteCount
                },
                $addToSet: {
                    voters: updateSurvey.email
                }
            };
            console.log(surveyDoc);
            const result = await surveyCollection.updateOne(filter, surveyDoc, options);
            res.send(result);
        });



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Server Connected Successfully for SURVEY APP')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})