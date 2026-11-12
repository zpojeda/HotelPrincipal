const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization;

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "Token de autenticación requerido"
    });
  }

  const token = autorizacion.slice(7);

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"]
    });

    req.usuarioId = datos.sub;
    next();

  } catch (error) {
    return res.status(401).json({
      mensaje: "Token inválido o vencido"
    });
  }
}

module.exports = verificarToken;