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
        return res.status(201).send({ msg: 'Cultivo actualizado correctamente' });
    } catch (error) {
        return res.status(500).send({ msg: 'Error al actualizar el cultivo' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('crops').doc(id).delete();
        return res.status(200).send({ msg: "Cultivo eliminado correctamente" });
    } catch (error) {
        return res.status(500).send({ msg: 'Error al eliminar el cultivo' });
    }
})

module.exports = router;