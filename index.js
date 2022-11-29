const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o0lhbrs.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const run = async() => {
    try{
        const categoriesCollection = client.db('mobilePoint').collection('categoriesName')
        const productsCollection = client.db('mobilePoint').collection('products')
        const usersCollection = client.db('mobilePoint').collection('users')
        const bookingCollection = client.db('mobilePoint').collection('booking')
        const advertiseCollection = client.db('mobilePoint').collection('advertise')

        // make sure you use verifyAdmin after verifyJWT
        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            if(user) {
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1d'});
                return res.send({accessToken: token})
            }
            console.log(user)
            res.status(403).send({accessToken: ''})
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
        app.get('/user', async (req, res) => {
            const query = {role: 'user'};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        // get seller 
        app.get('/seller', async (req, res) => {
            const query = {role: 'seller'};
            const sellers = await usersCollection.find(query).toArray();
            res.send(sellers);
        });

        // get my products
        app.get('/manage/products/:email', async(req, res) => {
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
        app.get('/bookings/:email',  async (req, res) => {
            const email = req.params.email;

            if (email !== email) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { 
                sellerEmail: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        });

        // get admin with email address
        // app.get('/users/admin/:email', async (req, res) => {
        //     const email = req.params.email;
        //     const query = { email }
        //     const user = await usersCollection.findOne(query);
        //     res.send({ isAdmin: user?.role === 'admin' });
        // })


        // get admin with email address
        // app.get('/users/sellers', async (req, res) => {
        //     // const email = req.params.email;
        //     const query = {  }
        //     const user = await usersCollection.find(query);
        //     const seller =  {user?.role === 'admin'} 
        //     res.send();
        // })

        // add users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // add add product
        app.post('/addproduct', async (req, res) => {
            const user = req.body;
            const result = await productsCollection.insertOne(user);
            res.send(result);
        });

        // get advertise
        app.get('/advertise', async (req, res) => {
            const query = {}
            const products = await advertiseCollection.find(query).toArray();
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

        // delete buyer booking item
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = {_id: ObjectId(id)}
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })

        // delete buyer booking item
        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const result = await bookingCollection.deleteOne(filter);
            res.send(result);
        })

        // check is admin
        app.get('/user/admin/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role == 'admin'});
        })

        // check is seller
        app.get('/user/seller/:email', async(req, res)=>{
            const email = req.params.email;
            const query = {email}
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role == 'seller'});
        })


        // booking post
        // app.post('/booking', async (req, res) => {
        //     const product = req.body;
        //     const result = await bookingCollection.insertOne(product);
        //     res.send(result);
        // })


    //     // set admin role
    //     app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {
    //         const id = req.params.id;
    //         const filter = { _id: ObjectId(id) }
    //         const options = { upsert: true };
    //         const updatedDoc = {
    //             $set: {
    //                 role: 'admin'
    //             }
    //         }
    //         const result = await usersCollection.updateOne(filter, updatedDoc, options);
    //         res.send(result);
    //     })
    }


    finally{}
}
run().catch(err => console.log(err));










// app.get('/mobiles-categories', (req, res) => {
//     res.send(categoryCollections)
// })

// app.get('/mobiles', (req, res) => {
//     res.send(mobilesCollections)
// })

// app.get('/categories/:id', (req, res) => {
//     const id = req.params.id;
//     console.log(id);
//     const filter = mobilesCollections.filter(category_id === id);
//     console.log(filter);
//     res.send(filter);

// })

app.get('/', (req, res) => {
    res.send('mobileShope server running')
});

app.listen(port,()=>{
    console.log('mobileShope server listening on port', port);
})