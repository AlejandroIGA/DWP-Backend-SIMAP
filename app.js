const express = require('express');
const cors = require('cors');
const http = require('http');
const { initializeApp, cert } = require('firebase-admin/app');
const authMiddleware = require('./authMiddleware');

const app = express();
const server = http.createServer(app);
const port = 3000;

app.use(cors({
    origin: 'https://dwp-frontend-simap.onrender.com',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
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
});

const spacesService = require('./spaces');
const notificationsService = require('./notifications');
const devicesService = require('./devices');
const authService = require('./auth');
const cropsService = require('./crops');
const profileService = require('./profile');
const setupWebSocket = require('./webSocketDevices');


setupWebSocket(server);

// Rutas públicas (sin autenticación)
app.use('/', authService);

// Rutas protegidas (requieren autenticación)
app.use('/dashboard/spaces', authMiddleware, spacesService);
app.use('/dashboard/notifications', authMiddleware, notificationsService);
app.use('/dashboard/devices', authMiddleware, devicesService);
app.use('/dashboard/crops', authMiddleware, cropsService);
app.use('/dashboard/profile', authMiddleware, profileService);

server.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});