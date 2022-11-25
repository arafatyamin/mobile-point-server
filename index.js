const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());

const categoryCollections = require('./data/mobileCategories.json');
const mobilesCollections = require('./data/mobiles.json');

app.get('/', (req, res) => {
    res.send('mobileShope server running')
});

app.get('/mobiles-categories', (req, res) => {
    res.send(categoryCollections)
})

app.get('/mobiles', (req, res) => {
    res.send(mobilesCollections)
})



app.listen(port,()=>{
    console.log('mobileShope server listening on port', port);
})