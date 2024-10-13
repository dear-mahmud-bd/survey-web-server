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
        const surveyVoteCollection = client.db('SURVEY_APP_DB').collection('survey_votes');
        const reportCollection = client.db('SURVEY_APP_DB').collection('all_report');
        const commentCollection = client.db('SURVEY_APP_DB').collection('all_comment');





        // Get all users ...
        app.get('/all-users', async (req, res) => {
            let query = {};
            const cursor = userCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })
        // get user role (TODO: _ _ _ )...
        app.get('/all-users/:_id', async (req, res) => {
            const id = req.params._id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: 'Invalid ID format. ID must be a 24-character hexadecimal string.' });
            }
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.findOne(query);
            res.send(result);
        })
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
        // change user role...
        app.put('/user-role/:_id', async (req, res) => {
            const id = req.params._id;
            if (!ObjectId.isValid(id)) {
                return res.status(400).send({ message: 'Invalid ID format. ID must be a 24-character hexadecimal string.' });
            }
            const role = req.body.role;
            const query = { _id: new ObjectId(id) };
            const update_role = { $set: { user_role: role } };
            const result = await userCollection.updateOne(query, update_role);
            res.send(result);
        });
        // pro_users related api ...
        app.get('/users/pro_user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            // console.log(user?.pro_user);
            res.send({ pro_user: user?.pro_user });
        });
        // admin api ...
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) admin = user?.user_role === 'admin';
            // console.log(user, admin);
            res.send({ admin });
        })
        // surveyor api ...
        app.get('/users/surveyor/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let surveyor = false;
            if (user) surveyor = user?.user_role === 'surveyor';
            // console.log(user, surveyor);
            res.send({ surveyor });
        })





        // add a survey in database ...
        app.post('/all-survey', async (req, res) => {
            const survey = req.body;
            // console.log(survey);
            const result = await surveyCollection.insertOne(survey);
            res.send(result);
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
        // Update a specific survey with surveyors...
        app.put('/my-survey/:_id', async (req, res) => {
            const id = req.params._id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateSurvey = req.body;
            // console.log(updateSurvey);
            const survey = {
                $set: {
                    title: updateSurvey.title,
                    question: updateSurvey.question,
                    description: updateSurvey.description,
                    category: updateSurvey.category,
                    deadline: updateSurvey.surveyDeadline,
                    deadlineISO: updateSurvey.deadlineISO,
                }
            };
            const result = await surveyCollection.updateOne(filter, survey, options);
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
            const { email } = req.body;
            // console.log("Put-", id);

            const filter = { _id: new ObjectId(id) };
            // const options = { upsert: true };
            const options = { returnDocument: 'after' };

            // console.log(survey);
            const surveyDoc = {
                $inc: { total_vote: 1 },
                $addToSet: { voters: email }
            };
            const result = await surveyCollection.updateOne(filter, surveyDoc, options);
            res.send(result);
        });
        // add a new comment to a specific survey
        app.patch('/all-survey/:_id', async (req, res) => {
            const id = req.params._id;
            const filter = { _id: new ObjectId(id) };
            const survey = await surveyCollection.findOne(filter);
            const { name, comment_date, comment } = req.body;
            const newComment = {
                user_name: name,
                comment_date: comment_date,
                message: comment
            };
            const addComment = { $push: { comments: newComment } };
            const result = await surveyCollection.updateOne(filter, addComment);
            // console.log(result);
            res.send(result);
        });
        // get specific user's survey as a surveyor...
        app.get('/my-survey/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            const query = { createdBy: email };
            const result = await surveyCollection.find(query).toArray();
            // const result = await surveyCollection.findOne(query);
            res.send(result);
        })





        // survey vote submition for another api...
        app.put('/survey-vote/:surveyId', async (req, res) => {
            const id = req.params.surveyId;
            const voter = req.body;
            const filter = { surveyId: id };
            const options = { upsert: true };
            // const voteIncrement = voter?.vote === 'yes' ? { yes_count: 1 } : { no_count: 1 };
            const voteIncrement = voter.vote === 'yes' ? { $inc: { yes_count: 1 } } : { $inc: { no_count: 1 } };
            // console.log(voter);
            // console.log("Type", voteIncrement);
            const updatedSurveyVote = {
                ...voteIncrement,
                $push: { voters: { name: voter.name, email: voter.email, type: voter.vote } }
            };
            // console.log(updatedSurveyVote);
            const result = await surveyVoteCollection.updateOne(filter, updatedSurveyVote, options);
            res.send(result);
        });
        // get specific survey result data...
        app.get('/survey-result/:surveyId', async (req, res) => {
            const surveyId = req.params.surveyId;
            // survey_votes surveyVoteCollection 
            const query = { surveyId: surveyId };
            const surveyResult = await surveyVoteCollection.findOne(query);
            // console.log(surveyResult?.voters);
            res.send(surveyResult?.voters);
        })
        // get specific user's perticipation...
        app.get('/users-participation/:email', async (req, res) => {
            const email = req.params.email;
            const query = { "voters.email": email };
            const userParticipation = await surveyVoteCollection.find(query).toArray();
            const userVotes = [];
            for (const survey of userParticipation) {
                const voterInfo = survey.voters.find(voter => voter.email === email);
                // Find the corresponding survey in the surveyCollection by its surveyId
                const surveyDetails = await surveyCollection.findOne({ _id: new ObjectId(survey.surveyId) });
                if (surveyDetails) {
                    userVotes.push({ surveyId: survey.surveyId, title: surveyDetails.title, type: voterInfo?.type });
                }
            }
            res.status(200).json(userVotes);
        });

        
        


        
        // add report api...
        app.post('/report-survey', async (req, res) => {
            const report = req.body;
            // console.log(report);
            const result = await reportCollection.insertOne(report);
            res.send(result);
        });
        // get specific user's repotr as a user...
        app.get('/user-report/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email);
            const query = { email: email };
            const result = await reportCollection.find(query).toArray();
            res.send(result);
        })

        // add comment api...
        app.post('/comment-survey', async (req, res) => {
            const comment = req.body;
            // console.log(comment);
            const result = await commentCollection.insertOne(comment);
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