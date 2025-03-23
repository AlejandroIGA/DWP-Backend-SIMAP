const router = require('express').Router();
const { getFirestore, Filter } = require('firebase-admin/firestore');

const db = getFirestore();

router.get('/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;
        const ref = db.collection('simapUsers');
        const register = await ref.doc(user_id).get();

        if (register.empty) {
            return res.status(400).send({ msg: "El usuario no esta registrado" });
        }

        return res.status(201).send({ msg: "Usuario encontrado", data: register.data() });
    } catch (error) {
        return res.status(500).send({ msg: "Error al obtener la información del usuario" })
    }
});

router.put('/update/:user_id', async (req, res) => {
    let { user_id } = req.params;
    let { name, phone, city, country, email } = req.body;

    if (!name || !phone || !city || !country || !email) {
        return res.status(400).send({ msg: "Datos incompletos" });
    }

    try {
        const ref = db.collection('simapUsers').doc(user_id);
        await ref.update({
            name,
            phone,
            city,
            country,
            email
        })
        return res.status(201).send({ msg: "Información actualizada" })
    } catch (error) {
        return res.status(500).send({ msg: "Error al actualizar la información" })
    }
})



module.exports = router;