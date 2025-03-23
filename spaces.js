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

        for (const doc of registers.docs) {
            const spaceData = doc.data();

            // Consultar las plantas asociadas a este espacio
            const cropRef = db.collection('crops');
            const cropQuery = await cropRef.where('space', '==', spaceData.name).get();

            // Contar el número de plantas
            const plantCount = cropQuery.size;

            // Agregar el espacio con el número de plantas a la respuesta
            spaces.push({
                id: doc.id,
                ...spaceData,
                members: plantCount // Número de plantas asociadas
            });
        }

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
        const spaceDoc = await spaceRef.get();
        const oldName = spaceDoc.data().name;

        await spaceRef.update({
            name
        })

        const cropRef = db.collection('crops');
        const cropQuery = await cropRef.where('space', '==', oldName).get();

        if (!cropQuery.empty) {
            const batch = db.batch(); // Usar un batch para múltiples actualizaciones

            cropQuery.forEach((doc) => {
                const cropDocRef = db.collection('crops').doc(doc.id);
                batch.update(cropDocRef, { space: name }); // Actualizar el campo "space"
            });

            await batch.commit(); // Ejecutar todas las actualizaciones en lote
        }

        return res.status(201).send({ msg: 'Espacio actualizado correctamente' });
    } catch (error) {
        console.log('ERROR PUT /spaces', error);
        return res.status(500).send({ msg: 'Error al actualizar el espacio' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const spaceDoc = await db.collection('spaces').doc(id).get();
        const spaceData = spaceDoc.data();
        const spaceName = spaceData.name;

        await db.collection('spaces').doc(id).delete();

        const cropRef = db.collection('crops');
        const cropQuery = await cropRef.where('space', '==', spaceName).get();

        if (!cropQuery.empty) {
            const batch = db.batch(); // Usar un batch para múltiples actualizaciones

            cropQuery.forEach((doc) => {
                const cropRef = db.collection('crops').doc(doc.id);
                batch.update(cropRef, { space: "" }); // Actualizar el campo "space"
            });

            await batch.commit(); // Ejecutar todas las actualizaciones en lote
        }

        return res.status(200).send({ msg: "Espacio eliminado correctamente" });
    } catch (error) {
        return res.status(500).send({ msg: 'Error al eliminar el espacios' });
    }
})

module.exports = router;