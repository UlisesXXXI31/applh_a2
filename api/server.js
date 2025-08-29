// ===============================================
//              IMPORTS Y CONFIGURACIÓN
// ===============================================
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// --- Importación de Modelos ---
const User = require('../models/user');
const Progress = require('../models/progress');
const Lesson = require('../models/lesson.model.js'); // ¡Correcto!

// --- Creación de la App ---
const app = express();

// --- Middlewares ---
// Configura CORS UNA SOLA VEZ para permitir peticiones desde tu frontend
app.use(cors({
  origin: 'https://tu-frontend.github.io' // <-- CAMBIA ESTO POR LA URL DE TU FRONTEND
}));
app.use(express.json()); // Middleware para entender JSON

// --- Conexión a la Base de Datos ---
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/deutsch_lesen_hoeren';
mongoose.connect(uri)
  .then(() => console.log('Conexión exitosa a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));


// ===============================================
//                    RUTAS
// ===============================================

app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde el servidor!');
});

// --- Rutas de Lecciones (las nuevas) ---
app.get('/api/lessons', async (req, res) => {
    try {
        const { level } = req.query;
        if (!level) return res.status(400).json({ message: 'El nivel es requerido' });
        const lessons = await Lesson.find({ level: level }).sort({ lessonNumber: 1 }).select('title lessonNumber');
        res.status(200).json(lessons);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las lecciones: " + error.message });
    }
});

app.get('/api/lessons/:id', async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ message: 'Lección no encontrada.' });
        res.status(200).json(lesson);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener la lección: " + error.message });
    }
});


// --- Rutas de Usuarios y Autenticación (las que ya tenías) ---
app.post('/api/users/register', async (req, res) => { /* ... tu código de registro ... */ });
app.post('/api/auth/login', async (req, res) => { /* ... tu código de login ... */ });
app.get('/api/users', async (req, res) => { /* ... tu código para obtener usuarios ... */ });
// ... (pega aquí el resto de tus rutas de users y progress que ya tenías)


// --- Ruta para Poblar la Base de Datos (Seed) ---
app.get('/api/seed-lessons', async (req, res) => {
    try {
        const leccionesParaGuardar = [
            {
                level: "A2",
                lessonNumber: 1,
                title: "Lección 1 de Prueba",
                readings: [
                    {
                        title: "Teil 1 de Prueba",
                        text: "Este es el texto del Teil 1 de Lesen.",
                        questions: [
                            {
                                text: "Pregunta 1 de prueba",
                                options: ["Opción A", "Opción B", "Opción C"],
                                correctAnswer: "Opción A"
                            }
                        ]
                    }
                ],
                listenings: [] // Puedes añadir aquí los datos de Hören
            }
        ];

        await Lesson.deleteMany({});
        await Lesson.insertMany(leccionesParaGuardar);
        res.status(200).json({ message: '¡Lecciones de prueba guardadas con éxito!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ===============================================
//              EXPORT FINAL (PARA VERCEL)
// ===============================================
module.exports = app;
