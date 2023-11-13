const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const cookieParser =  require('cookie-parser');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// midleware
app.use(cors({origin: ['http://localhost:5173', 'http://localhost:5174'],credentials: true}));
app.use(express.json());
// app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ukrdjza.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

const serviceCollection = client.db('fireUpRestaurant').collection('foods')

    app.get('/allFoods', async(req, res)=>{
        const result = await serviceCollection.find().toArray();
        res.send(result);
    });
    app.get('/allFoods/:id', async(req, res)=> {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const result = await serviceCollection.findOne(filter);
        res.send(result);
      })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=> {
    res.send('Fire Up Restaurant server Site is running')
});
app.listen(port, ()=>{
    console.log(`Restaurnat is running on port:${port}`);
});