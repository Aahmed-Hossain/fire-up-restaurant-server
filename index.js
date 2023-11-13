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
const orderCollection = client.db('fireUpRestaurant').collection('orders')

    app.get('/allFoods', async(req, res)=>{
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page -1)*limit;
      const totalFoods = await serviceCollection.countDocuments()
        const result = await serviceCollection.find().skip(skip).limit(limit).toArray();
        res.send({totalFoods, result});
    });
    app.get('/allFoods/:id', async(req, res)=> {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const result = await serviceCollection.findOne(filter);
        res.send(result);
      })

      // orders
      app.post('/orders', async(req, res)=>{
        const order = req.body;
        const result = await orderCollection.insertOne(order)
        res.send(result);
      });
      app.get('/orders', async(req, res)=> {
        let query = {};
        if(req.query?.email){
          query = {email: req.query.email}
        };
        const result = await orderCollection.find(query).toArray()
        res.send(result)
      });
      app.delete('/orders/:id', async(req, res)=> {
        const id = req.params.id;
        const result = await orderCollection.deleteOne({_id: new ObjectId(id)})
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