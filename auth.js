const router = require('express').Router();
const { getFirestore, Filter } = require('firebase-admin/firestore');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = getFirestore();
const SECRET_KEY = '3$taE$UnaClav3D3$3gur1dad';


router.post('/register', async (req, res) => {
    let { name, phone, city, country, email, password } = req.body;


    if (!name || !phone || !city || !country || !email || !password) {
        return res.status(400).send({ msg: "Debe completar todos los campos" });
    }

    //Verificar si el usuario o correo ya existen
    const userRef = db.collection('simapUsers');
    const registers = await userRef.where('email', '==', email).get();

    if (registers.empty) {
        console.log('Se registrará el nuevo usuario')
        const hash = await bcrypt.hash(password, 10);
        let data = {
            name: name,
            password: hash,
            email: email,
            phone: phone,
            city: city,
            country: country
        }
        try {
            const response = await db.collection('simapUsers').add(data);
            if (response.id) {
                return res.status(201).send({ msg: "Registro realizado con éxito" });
            } else {
                return res.status(500).send({ msg: "Error al registrar usuario" });
            }
        } catch (error) {
            return res.status(500).send({ msg: "Error al registrar usuario" });
        }
    } else {
        console.log('este usuario ya existe')
        return res.status(400).send({ msg: "El correo o usuario ya están registrados" });
    }
});

router.post('/login', async (req, res) => {
    let { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ msg: "Faltan datos" });
    }

    const userRef = db.collection('simapUsers');
    const registers = await userRef.where('email', '==', email).get();

    if (registers.empty) {
        return res.status(400).send({ msg: "Credenciales incorrectas" });
    }

    const doc = registers.docs[0];
    const userData = doc.data();
    const user_id = doc.id;

    const isMatch = await bcrypt.compare(password, userData.password);

    if (!isMatch) {
        return res.status(400).send({ msg: "Credenciales incorrectas" });
    }

    // Actualizar el campo lastLogin
    await userRef.doc(user_id).update({
        lastLogin: new Date()
    });

    // Crear token JWT
    const token = jwt.sign(
        { id: user_id, email: userData.email },
        SECRET_KEY,
        { expiresIn: '40m' }
    );

    res.setHeader('token', token);
    res.setHeader('Access-Control-Expose-Headers', 'token'); // Exponer el header 'token'

    return res.status(200).send({
        msg: "Credenciales correctas",
        user: user_id,
    });
});


module.exports = router;
