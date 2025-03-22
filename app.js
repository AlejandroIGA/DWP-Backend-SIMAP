const express = require('express')
const cors = require('cors')
const { initializeApp, cert } = require('firebase-admin/app');


const app = express()
const port = 3000

app.use(cors())
app.use(express.json());

require('dotenv').config();

const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

initializeApp({
    credential: cert(serviceAccount)
})

const spacesService = require('./spaces');
const notificationsService = require('./notifications');
const devicesService = require('./devices');

app.use('/dashboard/spaces', spacesService);
app.use('/dashboard/notifications', notificationsService);
app.use('/dashboard/devices', devicesService);


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})