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
      let queryObj ={};
      let sortObj = {};
      const category = req.query.category;
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      if(category){
        queryObj.category= category;
      };
      if(sortField && sortOrder){sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;}
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      };

      if (Object.keys(queryObj).length > 0) {
        query = { ...query, ...queryObj };
      }
      // In this update, I've merged the query and queryObj to ensure that both category filtering and other filters work together. This should help in correctly filtering foods based on the specified category.
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page -1)*limit;
      const totalFoods = await serviceCollection.countDocuments()
        const result = await serviceCollection.find(query).skip(skip).limit(limit).sort(sortObj).toArray();
        res.send({totalFoods, result});
    });
    app.get('/allFood/:name', async (req, res) => {
      const name = req.params.name;
      const query = { food_name: { $regex: new RegExp(name, 'i') } }; // Case-insensitive search
      const result = await serviceCollection.find(query).toArray();
      res.send(result);
});
    app.get('/allFoods/:id', async(req, res)=> {
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const result = await serviceCollection.findOne(filter);
        res.send(result);
      })
      app.post('/allFoods', async(req, res)=>{
        const addFood = req.body;
        const result = await serviceCollection.insertOne(addFood)
        res.send(result);
      });
      app.delete('/allFoods/:id', async(req, res)=> {
        const id = req.params.id;
        const result = await serviceCollection.deleteOne({_id: new ObjectId(id)})
        res.send(result);
      });
      app.put('/allFoods/:id', async(req,res)=>{
        const id = {_id: new ObjectId(req.params.id)};
        const body = req.body;
        const updatedData = {
          $set:{...body}
        };
        const option = {upsert: true};
        const result = await serviceCollection.updateOne(id, updatedData, option)
        res.send(result)
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
      });
      app.get('/orders/:id', async(req, res)=> {
        const id = req.params.id;
        const result = await orderCollection.findOne({_id: new ObjectId(id)})
        res.send(result);
      });

      app.put('/orders/:id', async(req,res)=>{
        const id = {_id: new ObjectId(req.params.id)};
        const body = req.body;
        const updatedData = {
          $set:{...body}
        };
        const option = {upsert: true};
        const result = await orderCollection.updateOne(id, updatedData, option)
        res.send(result)
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