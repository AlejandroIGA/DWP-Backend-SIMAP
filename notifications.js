const router = require('express').Router();
const { getFirestore, Filter } = require('firebase-admin/firestore');

const db = getFirestore();

router.get('/:user_id', async (req, res) => {
    const notifications = [];
    try {
        const { user_id } = req.params;
        const notificationsRef = db.collection('notifications');
        const registers = await notificationsRef.where('user_id', '==', user_id).get();

        if (registers.empty) {
            return res.status(400).send({ msg: "No tiene notificaciones" });
        }

        registers.forEach(doc => {
            const notificationData = doc.data();
            notifications.push({
                id: doc.id,
                ...notificationData
            });
        });

        return res.status(201).send({ msg: "Notificaciones encontradas", data: notifications })
    } catch (error) {
        return res.status(500).send({ msg: "Error al obtener los espacios" })
    }
});

router.post('/', async (req, res) => {
    let { name, description, user_id } = req.body;

    if (!name || !description) {
        return res.status(400).send({ msg: "Datos incompletos" });
    }

    let data = {
        name: name,
        description: description,
        user_id: user_id,
        date: new Date()
    }

    try {
        const response = await db.collection('notifications').add(data);
        if (response.id) {
            return res.status(201).send({ msg: "Se creo una notificación" });
        } else {
            return res.status(400).send({ msg: "Error al crear la notifiación" });
        }
    } catch (error) {
        console.log("ERROR POST /notifications", error);
        return res.status(500).send({ msg: "Erro con la base de datos" });
    }
})

router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('notificactions').doc(id).delete();
        return res.status(200).send({ msg: "Notificación eliminada" })
    } catch (error) {
        return res.status(500).send({ msg: "Error al eliminar la notificación" })
    }
})

module.exports = router;