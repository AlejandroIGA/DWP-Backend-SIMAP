// authMiddleware.js
const jwt = require('jsonwebtoken');
const SECRET_KEY = '3$taE$UnaClav3D3$3gur1dad'; // Debe coincidir con la clave usada para firmar el token

function authMiddleware(req, res, next) {
    // Obtener el token de la cabecera 'Authorization'
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).send({ msg: "Token no proporcionado" });
    }

    try {
        // Verificar y decodificar el token
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // Adjuntar la información del usuario a la solicitud
        next(); // Continuar con la siguiente función de middleware o ruta
    } catch (error) {
        return res.status(401).send({ msg: "Token inválido o expirado inicie sesión nuevamente" });
    }
}

module.exports = authMiddleware;