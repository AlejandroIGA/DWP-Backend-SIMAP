const WebSocket = require('ws');
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server });
    const activeConnections = new Map();
    const deviceIntervals = new Map(); // Nuevo Map para almacenar intervalos

    wss.on('connection', (ws) => {
        console.log('Nueva conexión WebSocket establecida');

        ws.on('message', async (message) => {
            try {
                const { device_id, user_id } = JSON.parse(message);

                // Verificar que el dispositivo pertenezca al usuario
                const deviceRef = db.collection('devices').doc(device_id);
                const doc = await deviceRef.get();

                if (!doc.exists || doc.data().user_id !== user_id) {
                    ws.send(JSON.stringify({ error: "Dispositivo no autorizado" }));
                    return ws.close();
                }

                // Limpiar intervalo existente para este dispositivo
                if (deviceIntervals.has(device_id)) {
                    clearInterval(deviceIntervals.get(device_id));
                    deviceIntervals.delete(device_id);
                }

                // Registrar conexión
                activeConnections.set(device_id, ws);
                console.log(`Dispositivo conectado: ${device_id}`);

                // Simular datos
                const intervalId = setInterval(async () => {
                    if (activeConnections.has(device_id)) {
                        console.log("Enviando datos");
                        const min = Number(doc.data().min);
                        const max = Number(doc.data().max);
                        const value = (Math.random() * (max - min) + min).toFixed(2);
                        const reading = {
                            device_id,
                            value,
                            timestamp: new Date().toISOString()
                        };

                        ws.send(JSON.stringify(reading));
                        await db.collection('readings').add(reading);
                    }
                }, 30000);

                // Guardar el nuevo intervalo
                deviceIntervals.set(device_id, intervalId);

                ws.on('close', () => {
                    if (deviceIntervals.has(device_id)) {
                        clearInterval(deviceIntervals.get(device_id));
                        deviceIntervals.delete(device_id);
                    }
                    activeConnections.delete(device_id);
                    console.log(`Conexión cerrada para dispositivo ${device_id}`);
                });

            } catch (error) {
                console.error('Error en WebSocket:', error);
                ws.close();
            }
        });
    });

    return wss;
}

module.exports = setupWebSocket;