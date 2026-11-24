
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const argon2 = require('argon2');
const pool = require('../config/db');

// Configuración del correo con Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ==========================================
// 1. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ==========================================

const solicitarRecuperacion = async (req, res) => {
  try {
    const correo = String(req.body?.correo || '').trim();

    if (!correo) {
      return res.status(400).json({
        mensaje: 'El correo es obligatorio'
      });
    }

    // Respuesta genérica por seguridad
    const mensaje =
      'Si el correo está registrado, recibirás instrucciones de recuperación';

    // Buscar usuario activo
    const [usuarios] = await pool.query(
      `SELECT id FROM usuarios
       WHERE correo = ? AND activo = 1`,
      [correo]
    );

    // No revelar si el correo existe
    if (usuarios.length === 0) {
      return res.json({ mensaje });
    }

    const usuarioId = usuarios[0].id;

    // Generar token aleatorio
    const token = crypto.randomBytes(32).toString('hex');

    // Guardar únicamente el hash del token
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Expiración en 15 minutos
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    // Guardar token en MySQL
    await pool.query(
      `INSERT INTO recuperacion_password
       (usuario_id, token_hash, fecha_expiracion)
       VALUES (?, ?, ?)`,
      [usuarioId, tokenHash, expiracion]
    );

    // Construir enlace de recuperación
    const enlace =
      `${process.env.FRONTEND_URL}/restablecer-password?token=${token}`;

    // Enviar correo mediante Mailtrap
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: correo,
      subject: 'Recuperación de contraseña - Hotel Paraíso',
      text: `Hola,

Recibimos una solicitud para restablecer tu contraseña.

Abre el siguiente enlace:

${enlace}

Este enlace vence en 15 minutos.

Si no solicitaste este cambio, ignora este mensaje.

Hotel Paraíso`
    });

    return res.json({ mensaje });

  } catch (error) {
    console.error('Error al solicitar recuperación:', error);

    return res.status(500).json({
      mensaje: 'Error al procesar la recuperación'
    });
  }
};

// ==========================================
// 2. RESTABLECER CONTRASEÑA
// ==========================================

const restablecerPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body || {};

    // Validaciones básicas
    if (
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(token) ||
      typeof nuevaPassword !== 'string' ||
      nuevaPassword.length < 8
    ) {
      return res.status(400).json({
        mensaje: 'Token o contraseña inválidos'
      });
    }

    // Obtener hash del token recibido
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const conexion = await pool.getConnection();

    try {
      await conexion.beginTransaction();

      // Buscar token válido y bloquear registro
      const [registros] = await conexion.query(
        `SELECT r.id, r.usuario_id
         FROM recuperacion_password r
         INNER JOIN usuarios u ON u.id = r.usuario_id
         WHERE r.token_hash = ?
           AND r.utilizado = 0
           AND r.fecha_expiracion > NOW()
           AND u.activo = 1
         FOR UPDATE`,
        [tokenHash]
      );

      if (registros.length === 0) {
        await conexion.rollback();

        return res.status(400).json({
          mensaje: 'El enlace es inválido o ha expirado'
        });
      }

      const usuarioId = registros[0].usuario_id;

      // Generar hash seguro de la contraseña nueva
      const passwordHash = await argon2.hash(nuevaPassword, {
        type: argon2.argon2id
      });

      // Actualizar contraseña
      const [resultado] = await conexion.query(
        `UPDATE usuarios
         SET password_hash = ?
         WHERE id = ? AND activo = 1`,
        [passwordHash, usuarioId]
      );

      if (resultado.affectedRows !== 1) {
        throw new Error('No se pudo actualizar el usuario');
      }

      // Invalidar todos los tokens pendientes del usuario
      await conexion.query(
        `UPDATE recuperacion_password
         SET utilizado = 1
         WHERE usuario_id = ?
           AND utilizado = 0`,
        [usuarioId]
      );

      await conexion.commit();

      return res.json({
        mensaje: 'Contraseña actualizada correctamente'
      });

    } catch (error) {
      await conexion.rollback();
      throw error;

    } finally {
      conexion.release();
    }

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);

    return res.status(500).json({
      mensaje: 'Error al restablecer la contraseña'
    });
  }
};

// Exportar funciones
module.exports = {
  solicitarRecuperacion,
  restablecerPassword
};
