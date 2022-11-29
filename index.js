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