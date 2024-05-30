const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// middleware

app.use(cors({
    origin: ['http://localhost:5173' ,
             'https://assignment-11-client-side-xi.vercel.app',
                  
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ieebpm5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middle ware by create me 

const logger = async (req, res, next) => {
    console.log('Called:', req.host, req.originalUrl)
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    // no token available
    if (!token) {
        return res.status(401).send({ message: 'Not  Authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //error

        if (err) {
            return res.status(401).send({ message: 'Unauthorized Access' })
        }
        // console.log('Value in the token', decoded)
        req.user = decoded;
        next();
    })
    // console.log('Called:', req.host , req.originalUrl)

}

 const cookieOption = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    secure: process.env.NODE_ENV === 'production'? true: false,
 
}

async function run() {
    try {

        const blogsCollection = client.db('BlogsDB').collection('AllBlogs');
        const subscriberCollection = client.db('BlogsDB').collection('Subscriber');
        const wishlistCollection = client.db('BlogsDB').collection('Wishlist');

        const commentCollection = client.db('BlogsDB').collection('Comments');

        // auth related JWT api 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log('User for log in  Token:', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1h' })
            // res.send(token);

            res.cookie('token', token, cookieOption )
                .send({ success: true })

        })

        // for log out and remove token 

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('log out ', user);
            res.clearCookie('token', { ...cookieOption, maxAge: 0 }).send({ success: true })
        })

        // service related get all data operation api

        app.get('/addBlogs',   async (req, res) => {
            // consol.log('Cook COoki Cokkies', req.cookies)
            const cursor = blogsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // specific data read for details

        app.get('/addBlogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })

        // updated or put operation

        app.put('/addBlogs/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedBlog = req.body;
            const blog = {
                $set: {
                    name: updatedBlog.name,
                    title: updatedBlog.title,
                    short_description: updatedBlog.short_description,
                    long_description: updatedBlog.long_description,
                    category: updatedBlog.category,
                    photo: updatedBlog.photo,
                    userPhoto: updatedBlog.userPhoto

                }
            }
            const result = await blogsCollection.updateOne(filter, blog, options);
            res.send(result);
        })




        // data inserted from addBlogs

        app.post('/addBlogs', async (req, res) => {
            const newBlogs = req.body;
            console.log(newBlogs);
            const result = await blogsCollection.insertOne(newBlogs);
            res.send(result);

        })


        // subscriber data api

        // data inserted from Subscriber-Blogs
        app.post('/subscriber', async (req, res) => {
            const newSub = req.body;
            console.log(newSub);
            const result = await subscriberCollection.insertOne(newSub);
            res.send(result);

        })

        // all subsriber getting

        app.get('/subscriber', async(req,res)=>{
            const result = await subscriberCollection.find().toArray();
            res.send(result);
        })


        // comment data api
        app.post('/comments', async (req, res) => {
            const newCom = req.body;
            console.log(newCom);
            const result = await commentCollection.insertOne(newCom);
            res.send(result);

        })

        //  All comment get api for specific blogId

        app.get('/comments',  async (req, res) => {
            const cursor = commentCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/comments/:blogId', async (req, res) => {
            const blogId_id = req.params.blogId;
            const result = await commentCollection.find({ blogId: blogId_id }).toArray();
            res.send(result);
        })



        // wishlist data insert 
        app.post(`/wishlist`, async (req, res) => {
            const newWish = req.body;
            console.log(newWish);
            const { _id, ...rest } = newWish
            const result = await wishlistCollection.insertOne({
                blogId: _id, ...rest
            });
            res.send(result);

        })
        // all wishlist data
        app.get('/wishlist', async (req, res) => {
            const cursor = wishlistCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // specific data read send to email

        app.get('/wishlist/:userEmail', logger, verifyToken, async (req, res) => {
            //  console.log('Query Email',req.query)
            const email_id = req.params.userEmail;
            console.log(email_id, 1)
            console.log('token owner info', req.user?.email);
            // console.log('Query email', req.query?.email)

            if (req.user?.email !== req.params?.userEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const result = await wishlistCollection.find({ userEmail: email_id }).toArray();
            res.send(result);
        })

        // data remove or delete operation
        app.delete(`/wishlist/:id`, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await wishlistCollection.deleteOne(query);
            res.send(result);
        })

        // wishlist details
        app.get('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: id }
            const result = await wishlistCollection.findOne(query);
            res.send(result);
        })







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
