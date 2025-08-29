// backend/models/user.js (VERSIÓN CORREGIDA)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true, // Asegura que no haya dos usuarios con el mismo email
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'teacher'], // Solo permite estos dos roles
        required: true
    }
});

// Middleware para hashear la contraseña automáticamente antes de guardarla
// (Esto es opcional pero muy buena práctica, así no tienes que hashearla en cada ruta)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compilar el modelo
const User = mongoose.model('User', userSchema);

// Exportar el modelo
module.exports = User;
