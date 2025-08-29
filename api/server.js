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
const Lesson = require('../models/lesson.model.js');
console.log("El modelo Lesson importado es:", Lesson);

// --- Creación de la App y Middlewares ---
const app = express();
app.use(cors({
  // Asegúrate de que esta URL es la de tu frontend desplegado
  origin: 'https://ulisesxxxi31.github.io' // O la URL de tu nuevo frontend
}));
app.use(express.json());


// ===============================================
//                    RUTAS
// ===============================================

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('¡Hola, mundo desde el servidor!');
});


// --- Rutas de Lecciones ---
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


// --- Rutas de Usuarios y Autenticación ---

app.post('/api/users/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();
        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
        }
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Credenciales inválidas' });
        res.status(200).json({ message: 'Inicio de sesión exitoso', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor. Inténtalo de nuevo.' });
    }
});

app.get('/api/users/by-email', async (req, res) => {
    try {
        const { email } = req.query;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.status(200).json({ 
          message: 'Usuario encontrado',
          user: { id: user._id, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error del servidor. Inténtalo de nuevo.' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({ role: 'student' }).select('-password');
        if (!users) return res.status(404).json({ message: 'No hay usuarios registrados.' });
        res.status(200).json({ users: users });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// --- Rutas de Progreso ---

app.post('/api/progress', async (req, res) => {
    try {
        const { userId, taskName, score, completed } = req.body;
        const newProgress = new Progress({ user: userId, taskName, score, completed });
        await newProgress.save();
        res.status(201).json({ message: 'Progreso guardado con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/progress/students', async (req, res) => {
    try {
        const studentProgress = await Progress.find().populate('user', 'name email');
        const groupedProgress = studentProgress.reduce((acc, progress) => {
            const { user, ...rest } = progress._doc;
            if (!acc[user.name]) {
                acc[user.name] = { name: user.name, email: user.email, tasks: [] };
            }
            acc[user.name].tasks.push(rest);
            return acc;
        }, {});
        res.status(200).json(Object.values(groupedProgress));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const progressHistory = await Progress.find({ user: userId }).sort({ date: 1 });
        if (!progressHistory || progressHistory.length === 0) {
            return res.status(404).json({ message: 'No se encontró historial de progreso.' });
        }
        res.status(200).json({ progress: progressHistory });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// --- Ruta para Poblar la Base de Datos (Seed) ---
app.get('/api/seed-lessons', async (req, res) => {
    try {
        const leccionesParaGuardar = [
            // PEGA AQUÍ EL ARRAY COMPLETO DE TUS LECCIONES,
            // ASEGURÁNDOTE DE QUE LA SINTAXIS ES CORRECTA
        ];

        await Lesson.deleteMany({});
        await Lesson.insertMany(leccionesParaGuardar);
        res.status(200).json({ message: '¡Lecciones de prueba guardadas con éxito!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ===============================================
//              CONEXIÓN A DB Y EXPORT
// ===============================================
const uri = process.env.MONGODB_URI || 'mongodb://1227.0.0.1:27017/deutsch_lesen_hoeren';

mongoose.connect(uri)
  .then(() => console.log('Conexión exitosa a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

module.exports = app;
