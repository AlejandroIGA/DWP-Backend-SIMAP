const router = require('express').Router();
const { getFirestore, Filter } = require('firebase-admin/firestore');

const db = getFirestore();

router.get('/:user_id', async (req, res) => {
    const devices = [];
    try {
        const { user_id } = req.params;
        const deviceRef = db.collection('devices');
        const registers = await deviceRef.where('user_id', '==', user_id).get();

        if (registers.empty) {
            return res.status(400).send({ msg: "No hay dispositivos registrados" })
        }

        registers.forEach(doc => {
            const deviceData = doc.data();
            devices.push({
                id: doc.id,
                ...deviceData
            });
        });

        return res.status(201).send({ msg: "Dispositivos encontrados", data: devices });
    } catch (error) {
        return res.status(500).send({ msg: "Error al obtener los dispositivos" })
    }
})

router.post('/', async (req, res) => {
    let { name, crop, min, max, user_id, type } = req.body;

    if (!name || !user_id || !crop || !min || !max || !type) {
        return res.status(400).send({ msg: "Datos incompletos" });
    }

    const deviceRef = db.collection('devices');
    const registers = await deviceRef.where('name', '==', name).where('user_id', '==', user_id).get();

    if (!registers.empty) {
        return res.status(400).send({ msg: "Ya existe un dispositivo con este nombre" });
    }

    let data = {
        name: name,
        user_id: user_id,
        crop: crop,
        min: min,
        max: max,
        type: type,
    }

    try {
        const response = await db.collection('devices').add(data);
        if (response.id) {
            return res.status(201).send({ msg: "Se registro el nuevo dispositivo" })
        } else {
            return res.status(400).send({ msg: "Se genero un error al registrar el nuevo dispositivo" })
        }
    } catch (error) {
        return res.status(500).send({ msg: "Error con la base de datos" });
    }
})

router.put('/update/:id', async (req, res) => {
    let { name, crop, min, max, type } = req.body;
    let { id } = req.params;

    if (!name || !crop || !min || !max || !type) {
        return res.status(400).send({ msg: "Datos incompletos" });
    }

    try {
        const deviceRef = db.collection('devices').doc(id);
        await deviceRef.update({
            name,
            crop,
            min,
            max,
            type
        })
        return res.status(201).send({ msg: 'Dispositivo actualizado correctamente' });
    } catch (error) {
        console.log('ERROR PUT /spaces', error);
        return res.status(500).send({ msg: 'Error al actualizar el dispositivo' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('devices').doc(id).delete();
        return res.status(200).send({ msg: "Dispositivo eliminado correctamente" });
    } catch (error) {
        return res.status(500).send({ msg: 'Error al eliminar el dispositivo' });
    }
})

module.exports = router;
