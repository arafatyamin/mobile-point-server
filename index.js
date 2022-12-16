const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0lhbrs.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


const run = async() => {
    try{
        const categoriesCollection = client.db('mobilePoint').collection('categoriesName')
        const productsCollection = client.db('mobilePoint').collection('products')
        const usersCollection = client.db('mobilePoint').collection('users')
        const bookingCollection = client.db('mobilePoint').collection('booking')
        const advertiseCollection = client.db('mobilePoint').collection('advertise')
        const paymentsCollection = client.db('mobilePoint').collection('payments')

        // make sure you use verifyAdmin after verifyJWT
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            if(user) {
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '30d'});
                return res.send({accessToken: token})
            }
            console.log(user)
            res.status(403).send({accessToken: ''})
        })

        app.post('/create-payment-intent', async(req, res)=>{
            const booking = req.body;
            const price = booking.sellPrice;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                  ],
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })

        // get all categories
        app.get('/categories', async(req, res) => {
            const query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        })

        // get all products
        app.get('/products', async(req, res) => {
            const query = {};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        })
        // get product with product id
        app.get('/products/:id', async(req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)};
            const product = await productsCollection.findOne(query);
            res.send(product);
        })

        // filter with categories id
        app.get('/categories/:id', async(req, res) => {
            const id = req.params.id;
            const query = {}
            const results = await productsCollection.find(query).toArray();
            const resultCollections = results.filter(result => result.category_id === id)
            res.send(resultCollections);
        })

        // get users 
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        // get users 
        app.get('/user',verifyJWT, async (req, res) => {
            const query = {role: 'user'};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        // get seller 
        app.get('/seller',verifyJWT, async (req, res) => {
            const query = {role: 'seller'};
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        });

        // get my products
        app.get('/manage/products/:email', verifyJWT, async(req, res) => {
            const email = req.params.email;
            const query = {sellerEmail: email};
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })

        // my order
        app.get('/myOrder', async (req, res)=>{
            const email = req.query.email;
            const query = {email: email};
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })
        

        // get all booking with seller
        app.get('/bookings/:email',   async (req, res) => {
            const email = req.params.email;

            if (email !== email) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { 
                sellerEmail: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        });


        //payments
        app.post('/payments', async (req, res)=>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updateResult = await bookingCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })
        // add users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // add add product
        app.post('/addproduct', async (req, res) => {
            const user = req.body;
            const product = await productsCollection.insertOne(user);
            res.send(product);
        });

        // get advertise
        app.get('/advertise', async (req, res) => {
            const query = {}
            const products = await advertiseCollection.find(query).sort({"postTime":-1}).toArray();
            res.send(products);
        })

        // get advertise
        app.get('/advertiseLimit', async (req, res) => {
            const query = {}
            const products = await advertiseCollection.find().sort( {"postTime":-1} ).limit(8).toArray();
            res.send(products);
        })

        // advertise item post
        app.post('/advertise', async (req, res) => {
            const advItem = req.body;

            const query = {
                _id: advItem._id,
                sellerEmail: advItem.sellerEmail,
            }

            const alreadyAdded = await advertiseCollection.find(query).toArray();

            if (alreadyAdded.length) {
                const message = `You already have a booking on ${advItem.title}`
                return res.send({ acknowledged: false, message })
            }

            const product = await advertiseCollection.insertOne(advItem);
            res.send(product);
        })
        // check is admin
        app.get('/user/admin/:email',  async(req, res)=>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })

        // check is seller
        app.get('/user/seller/:email',  async(req, res)=>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'seller'});
        })

        app.get('/booking/:id', async(req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
        })
        // app.get('/advertises/:id', async(req, res) => {
        //     const id = req.params.id;
        //     console.log(id);
        //     const query = { _id: ObjectId(id)};
        //     const booking = await advertiseCollection.findOne(query);
        //     res.send(booking);
        // })

        app.get('/bookings', async (req, res)=>{
            const query = {};
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings)
        })

        app.post('/booking', async(req, res) =>{
            const booking = req.body
            const query = {
                productId: booking.productId,
                email: booking.email,
            }

            const alreadyBooked = await bookingCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking.productName}`
                return res.send({ acknowledged: false, message })
            }
            

            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        // delete buyer product item
        app.delete('/product/:id',  async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = {_id: ObjectId(id)}
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })

        // delete buyer booking item
        app.delete('/booking/:id',  async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const result = await bookingCollection.deleteOne(filter);
            res.send(result);
        })

        // delete buyer booking item
        app.delete('/user/:id',  async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = {_id: ObjectId(id)}
            const user = await usersCollection.deleteOne(filter);
            res.send(user);
        })

        // app.get('/addPay', async (req, res)=>{
        //     const filter = {}
        //     const options = {upsert: true}
        //     const updatedDoc = {
        //         $set:{
        //             payment: "false",
        //         }
        //     }
        //     const result = await    bookingCollection.updateMany(filter, options, updatedDoc);
        //     res.send(result);
        // })
        
        // app.get('/user/:id',  async (req, res) => {
        //     const id = req.params.id;
        //     console.log(id);
        //     const filter = {_id: ObjectId(id)}
        //     const user = await usersCollection.findOne(filter);
        //     res.send(user);
        // })

        

    }


    finally{}
}
run().catch(err => console.log(err));


app.get('/', (req, res) => {
    res.send('mobileShope server running')
});

app.listen(port,()=>{
    console.log('mobileShope server listening on port', port);
})