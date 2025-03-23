const router = require('express').Router();
const { getFirestore, Filter } = require('firebase-admin/firestore');

const db = getFirestore();

router.get('/:user_id', async (req, res) => {
    const crops = [];
    try {
        const { user_id } = req.params;
        const cropRef = db.collection('crops');
        const registers = await cropRef.where('user_id', '==', user_id).get();
        if (registers.empty) {
            return res.status(400).send({ msg: "No hay cultivos registrados" })
        }

        registers.forEach(doc => {
            const cropData = doc.data();
            crops.push({
                id: doc.id,
                ...cropData
            });
        });
        return res.status(201).send({ msg: "Cultivos encontrados", data: crops });
    } catch (error) {
        return res.status(500).send({ msg: "Error al obtener los cultivos" })
    }
})

router.get('/:user_id/space/:space', async (req, res) => {
    const crops = [];
    try {
        const { user_id, space } = req.params;
        const cropRef = db.collection('crops');
        let registers;
        if (space == "all") {
            registers = await cropRef.where('user_id', '==', user_id).get();
        } else {
            registers = await cropRef.where('user_id', '==', user_id).where('space', "==", space).get();
        }
        if (registers.empty) {
            return res.status(400).send({ msg: "No hay cultivos registrados" })
        }

        registers.forEach(doc => {
            const cropData = doc.data();
            crops.push({
                id: doc.id,
                ...cropData
            });
        });
        return res.status(201).send({ msg: "Cultivos encontrados", data: crops });
    } catch (error) {
        return res.status(500).send({ msg: "Error al obtener los cultivos" })
    }
})

router.post('/', async (req, res) => {
    let { name, crop, tempMin, tempMax, humMin, humMax, humFmin, humFmax, type, space, user_id } = req.body;

    if (!name || !user_id || !crop || !tempMin || !tempMax || !humMin || !humMax || !humFmin || !humFmax) {
        return res.status(400).send({ msg: "Datos incompletos" });
    }

    const cropRef = db.collection('crops');
    const registers = await cropRef.where('name', '==', name).where('user_id', '==', user_id).get();

    if (!registers.empty) {
        return res.status(400).send({ msg: "Ya existe un cultivo con este nombre" });
    }

    let data = {
        name: name,
        crop: crop,
        tempMin: tempMin,
        tempMax: tempMax,
        humMin: humMin,
        humMax: humMax,
        humFmin: humFmin,
        humFmax: humFmax,
        type: type == undefined ? null : type,
        space: space == undefined || space == "" ? null : space,
        user_id: user_id
    }

    try {
        const response = await db.collection('crops').add(data);
        if (response.id) {
            return res.status(201).send({ msg: "Se registro el nuevo cultivo" })
        } else {
            return res.status(400).send({ msg: "Se genero un error al registrar el nuevo cultivo" })
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send({ msg: "Error con la base de datos" });
    }
})

router.put('/update/:id', async (req, res) => {
    let { name, crop, tempMin, tempMax, humMin, humMax, humFmin, humFmax, type, space, } = req.body;
    let { id } = req.params;
    if (!name || !crop || !tempMin || !tempMax || !humMin || !humMax || !humFmin || !humFmax) {
        return res.status(400).send({ msg: "Datos incompletos" });
    }

    try {
        const cropRef = db.collection('crops').doc(id);
        const cropDoc = await cropRef.get();
        const oldName = cropDoc.data().name; // Nombre antiguo del cultivo

        await cropRef.update({
            name,
            crop,
            tempMin,
            tempMax,
            humMin,
            humMax,
            humFmin,
            humFmax,
            type,
            space
        })

        const deviceRef = db.collection('devices');
        const deviceQuery = await deviceRef.where('crop', '==', oldName).get();

        if (!deviceQuery.empty) {
            const batch = db.batch(); // Usar un batch para múltiples actualizaciones

            deviceQuery.forEach((doc) => {
                const deviceDocRef = db.collection('devices').doc(doc.id);
                batch.update(deviceDocRef, { crop: name }); // Actualizar el campo "crop"
            });

            await batch.commit(); // Ejecutar todas las actualizaciones en lote
        }

        return res.status(201).send({ msg: 'Cultivo actualizado correctamente' });
    } catch (error) {
        return res.status(500).send({ msg: 'Error al actualizar el cultivo' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener el cultivo antes de eliminarlo para obtener su nombre
        const cropDoc = await db.collection('crops').doc(id).get();
        if (!cropDoc.exists) {
            return res.status(404).send({ msg: "El cultivo no existe" });
        }

        const cropName = cropDoc.data().name; // Nombre del cultivo

        // Eliminar el cultivo
        await db.collection('crops').doc(id).delete();

        // Buscar todos los dispositivos asociados al cultivo
        const deviceRef = db.collection('devices');
        const deviceQuery = await deviceRef.where('crop', '==', cropName).get();

        // Si hay dispositivos asociados, eliminarlos
        if (!deviceQuery.empty) {
            const batch = db.batch(); // Usar un batch para múltiples eliminaciones

            deviceQuery.forEach((doc) => {
                const deviceDocRef = db.collection('devices').doc(doc.id);
                batch.delete(deviceDocRef); // Eliminar el dispositivo
            });

            await batch.commit(); // Ejecutar todas las eliminaciones en lote
        }

        return res.status(200).send({ msg: "Cultivo eliminado correctamente" });
    } catch (error) {
        console.error("ERROR DELETE /delete/:id", error);
        return res.status(500).send({ msg: "Error al eliminar el cultivo" });
    }
});

module.exports = router;