const router = require('express').Router();
const { getFirestore, Filter } = require('firebase-admin/firestore');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const nodemailer = require('nodemailer');


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

    // Actualizar el campo lastLogin y el MFA
    const secret = speakeasy.generateSecret({ length: 20 });
    await userRef.doc(user_id).update({
        mfa: secret.base32
    });

    return res.status(200).send({
        msg: "Credenciales correctas",
        secret: secret.otpauth_url
    });
});

router.post('/verify-otp', async (req, res) => {
    const { email, token } = req.body;

    const userRef = db.collection('simapUsers');
    const registers = await userRef.where('email', '==', email).get();

    const doc = registers.docs[0];
    const userData = doc.data();
    const user_id = doc.id;

    const verified = speakeasy.totp.verify({
        secret: userData.mfa,
        encoding: 'base32',
        token,
        window: 1,
    });

    if (verified) {
        await userRef.doc(user_id).update({
            lastLogin: new Date(),
        });
        // Crear token JWT
        const token = jwt.sign(
            { id: user_id, email: userData.email },
            SECRET_KEY,
            { expiresIn: '40m' }
        );
        res.setHeader('token', token);
        res.setHeader('Access-Control-Expose-Headers', 'token'); // Exponer el header 'token'

        res.status(200).send({ success: true, user: user_id, state: userData.city });
    } else {
        res.status(401).send({ success: false, msg: 'Código incorrecto' });
    }

})

router.post('/send-code', async (req, res) => {
    const { email } = req.body;
    const userRef = db.collection('simapUsers');
    const registers = await userRef.where('email', '==', email).get();

    if (registers.empty) {
        return res.status(400).send({ msg: "El correo ingresado no existe" });
    }

    const doc = registers.docs[0];
    const user_id = doc.id;

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'karmatron58@gmail.com',
            pass: 'ohgo vgig oyqb ccmo'
        }
    });

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = 6; // Longitud del captcha
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    try {
        await userRef.doc(user_id).update({
            code: result
        })

        await transporter.sendMail({
            from: 'Recuperación de contraseña',
            to: email,
            subject: 'Código de seguridad',
            html: `Este es su código de seguridad: ${result}`
        })

        res.status(200).send({ msg: "Código enviado", success: true })

    } catch (error) {
        res.status(500).send({ msg: "Error con el servidor" })
    }
})

router.post('/validate-code', async (req, res) => {
    const { email, code } = req.body;
    const userRef = db.collection('simapUsers');
    const registers = await userRef.where('email', '==', email).where('code', '==', code).get();

    if (registers.empty) {
        return res.status(400).send({ msg: "Código invalido" });
    }

    const doc = registers.docs[0];
    const user_id = doc.id;

    try {
        await userRef.doc(user_id).update({
            code: null
        })
        res.status(200).send({ msg: "Código valido, ingrese una nueva contraseña", success: true })
    } catch (error) {
        res.status(500).send({ msg: "Error con el servidor" })
    }
})

router.post('/update-psw', async (req, res) => {
    try {
        const { email, psw } = req.body;
        const userRef = db.collection('simapUsers');
        const registers = await userRef.where('email', '==', email).get();

        const doc = registers.docs[0];
        const user_id = doc.id;

        const hash = await bcrypt.hash(psw, 10);
        await userRef.doc(user_id).update({
            password: hash
        });
        res.status(200).send({ msg: "Contraseña actualizada", success: true })
    } catch (error) {
        res.status(500).send({ msg: "Error con el servidor" })
    }
})


module.exports = router;
