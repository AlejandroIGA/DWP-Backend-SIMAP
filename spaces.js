const router = require('express').Router();
const { getFirestore, Filter } = require('firebase-admin/firestore');



const db = getFirestore();

router.get('/:user_id', async (req, res) => {
    const spaces = [];
    try {
        const { user_id } = req.params;
        const spaceRef = db.collection('spaces');
        const registers = await spaceRef.where('user_id', '==', user_id).get();
        if (registers.empty) {
            return res.status(400).send({ msg: "No hay espacios registrados" })
        }

        registers.forEach(doc => {
            const spaceData = doc.data();
            spaces.push({
                id: doc.id,
                ...spaceData
            });
        });

        return res.status(201).send({ msg: "Espacios encontrados", data: spaces });
    } catch (error) {
        console.error("ERROR GET /spaces", error);
        return res.status(500).send({ msg: "Error al obtener los espacios" })
    }
})

router.post('/', async (req, res) => {
    let { name, user_id } = req.body;

    if (!name || !user_id) {
        return res.status(400).send({ msg: "Datos incompletos" });
    }

    const spaceRef = db.collection('spaces');
    const registers = await spaceRef.where('name', '==', name).where('user_id', '==', user_id).get();

    if (!registers.empty) {
        return res.status(400).send({ msg: "Ya existe un espacio con este nombre" });
    }

    let data = {
        name: name,
        user_id: user_id,
        date: new Date()
    }

    try {
        const response = await db.collection('spaces').add(data);
        if (response.id) {
            return res.status(201).send({ msg: "Se registro el nuevo espacio" })
        } else {
            return res.status(400).send({ msg: "Se genero un error al registrar el nuevo espacio" })
        }
    } catch (error) {
        console.log('ERROR POST /spaces', error);
        return res.status(500).send({ msg: "Error con la base de datos" });
    }
})

router.put('/update/:id', async (req, res) => {
    let { name } = req.body;
    let { id } = req.params;
    if (!name) {
        return res.status(400).send({ msg: "Datos incompletos" });
    }

    try {
        const spaceRef = db.collection('spaces').doc(id);
        await spaceRef.update({
            name
        })
        return res.status(201).send({ msg: 'Espacio actualizado correctamente' });
    } catch (error) {
        console.log('ERROR PUT /spaces', error);
        return res.status(500).send({ msg: 'Error al actualizar la tarea' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('spaces').doc(id).delete();
        return res.status(200).send({ msg: "Espacio eliminado correctamente" });
    } catch (error) {
        return res.status(500).send({ msg: 'Error al eliminar la tarea' });
    }
})

module.exports = router;