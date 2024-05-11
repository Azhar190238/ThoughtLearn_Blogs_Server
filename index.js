const express = require('express');
const cors = require('cors');
// const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser')
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// middleware

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ieebpm5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const blogsCollection = client.db('BlogsDB').collection('AllBlogs');
    const subscriberCollection = client.db('BlogsDB').collection('Subscriber');
    const wishlistCollection = client.db('BlogsDB').collection('Wishlist')



            // service related get all data operation api

            app.get('/addBlogs', async (req, res) => {
                const cursor = blogsCollection.find();
                const result = await cursor.toArray();
                res.send(result);
            })
           // specific data read for details

            app.get('/addBlogs/:id' , async(req,res) => {
               const id =req.params.id;
               const query = { _id: new ObjectId(id)}
               const result = await blogsCollection.findOne(query);
               res.send(result);
            })

    // updated or put operation

    app.put('/addBlogs/:id', async(req, res) =>{
        const id = req.params.id;
        const filter = { _id: new ObjectId(id)}
        const options = {upsert:true};
        const updatedBlog = req.body;
        const blog ={
            $set:{
                title: updatedBlog.title,
                short_description: updatedBlog.short_description,
                long_description: updatedBlog.long_description,
                category: updatedBlog.category,
                photo: updatedBlog.photo
               
            }
        }
        const result = await blogsCollection.updateOne(filter,blog,options);
        res.send(result);
    })

            

     
    // data inserted from addBlogs

            app.post('/addBlogs', async(req,res)=>{
                const newBlogs = req.body;
                console.log(newBlogs);
                const result= await blogsCollection.insertOne(newBlogs);
                res.send(result);
          
            })


            // subscriber data api

               // data inserted from Subscriber-Blogs
               app.post('/subscriber', async(req,res)=>{
                const newSub = req.body;
                console.log(newSub);
                const result= await subscriberCollection.insertOne(newSub);
                res.send(result);
          
            })
   // data inserted for wishlist
            app.post('/wishlist', async(req,res)=>{
                const newSub = req.body;
                console.log(newSub);
                const result= await subscriberCollection.insertOne(newSub);
                res.send(result);
          
            })


    // //specific data read send to email

    //   app.get('/wishlist/:id', async(req, res) =>{
    //     const id= req.params.id;
    //     const result = await blogsCollection.find({email:id}).toArray();
    //     res.send(result);
    // })


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
    res.send('Blog is running');

})
app.listen(port, () => {
    console.log(`Blog server is running ${port}`)
})
