const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const pool = require("./config/db");

// cambio
const authRoutes = require("./auth/auth.routes");

const app = express(); 

app.use(helmet());

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api", (req, res) =>{
    res.status(200).json({
        mensaje: "Api hotel Paraiso funcionando"
    });
});

app.get("/api/test-db", async (req, res) => {
    try {
        const [filas] = await pool.query(
            "SELECT DATABASE() AS baseDatos"
        );

        res.status(200).json({
            mensaje:"Conexión exitosa con MYSQL",
            baseDatos: filas[0].baseDatos
        });


    } catch (error) {
        console.error("Error de conexión", error.message);

        res.status(500).json({
            mensaje:"No se pudo conectar con MYSQL"
        });
    }
});

module.exports = app; 
