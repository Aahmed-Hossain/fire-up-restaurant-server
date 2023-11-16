const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// midleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ukrdjza.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req.cookies.MY_TOKEN;
  console.log("tok tok from middle ware:", token);
  if (!token) {
    return res.status(401).send({ message: "not authorized" });
  }
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "un authorized" });
    }
    // if token valid it would be decoded
    console.log("value in the token", decoded);
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();

    const foodCollection = client.db("fireUpRestaurant").collection("foods");
    const orderCollection = client.db("fireUpRestaurant").collection("orders");
    const blogCollection = client.db("fireUpRestaurant").collection("blogs");
    // json web token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res
        .cookie("MY_TOKEN", token, { httpOnly: true, secure: false })
        .send({ success: true });
    });
    app.post("/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("MY_TOKEN", { maxAge: 0 }).send({ success: true });
    });
    app.get("/allFoods", async (req, res) => {
      let queryObj = {}; // for category
      let sortObj = {}; // for sortField+sortOrder(asc , dsc)
      const category = req.query.category;
      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;
      if (category) {
        queryObj.category = category;
      }
      if (sortField && sortOrder) {
        sortObj[sortField] = sortOrder === "asc" ? 1 : -1; // {price: 1 or -1}
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }

      if (Object.keys(queryObj).length > 0) {
        query = { ...query, ...queryObj };
      }
      // merged the query and queryObj to ensure that both category filtering and other filters work together.
      const page = Number(req.query.page);
      const limit = Number(req.query.limit);
      const skip = (page - 1) * limit;
      const totalFoods = await foodCollection.countDocuments();
      const result = await foodCollection
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortObj)
        .toArray();
      res.send({ totalFoods, result });
    });

    app.get("/allFood/:name", async (req, res) => {
      const name = req.params.name;
      const query = { food_name: { $regex: new RegExp(name, "i") } }; // Case-insensitive search
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/allFoods/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(filter);
      res.send(result);
    });
    app.post("/allFoods", async (req, res) => {
      const addFood = req.body;
      const result = await foodCollection.insertOne(addFood);
      res.send(result);
    });
    app.delete("/allFoods/:id", async (req, res) => {
      const id = req.params.id;
      const result = await foodCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.put("/allFoods/:id", async (req, res) => {
      const id = { _id: new ObjectId(req.params.id) };
      const body = req.body;
      const updatedData = {
        $set: { ...body },
      };
      const option = { upsert: true };
      const result = await foodCollection.updateOne(id, updatedData, option);
      res.send(result);
    });

    // orders
    app.post("/orders", async (req, res) => {
      const body = req.body; // body
      const id = req.body._id;
      const filter = { _id: new ObjectId(id) };
      const targetedFood = await foodCollection.findOne(filter);
      delete body._id; // deleting _id from body parameters  as already have _id in mongodb so i can't input any key _id in mogodb
      const food = {
        ...body,
        quantity: Number(targetedFood.quantity) - Number(body.quantity),
        order_count: Number(targetedFood.order_count) + Number(body.quantity),
      };
      const updatedData = {
        $set: { quantity: Number(targetedFood.quantity) - Number(body.quantity), order_count: Number(targetedFood.order_count) + Number(body.quantity), },
      };
      const result = await orderCollection.insertOne(food);
      const option = { upsert: true };
      const insertToAllFoods = await foodCollection.updateOne(
        filter,
        updatedData,
        option
      );
      res.send(result);
    });
    app.get("/orders", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await orderCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const result = await orderCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const result = await orderCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });
    app.put("/orders/:id", async (req, res) => {
      const id = { _id: new ObjectId(req.params.id) };
      const body = req.body;
      const updatedData = {
        $set: { ...body },
      };
      const option = { upsert: true };
      const result = await orderCollection.updateOne(id, updatedData, option);
      res.send(result);
    });
    app.get("/blogs", async (req, res) => {
      const result = await blogCollection.find().toArray();
      res.send(result);
    });
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fire Up Restaurant server Site is running");
});
app.listen(port, () => {
  console.log(`Restaurnat is running on port:${port}`);
});
