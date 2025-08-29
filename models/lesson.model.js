// backend/models/lesson.model.js (VERSIÓN FINAL Y CORREGIDA)

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Sub-documentos (estructuras internas) ---

const QuestionSchema = new Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true }
}, { _id: false });

const ReadingPartSchema = new Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    instructions: { type: String },
    questions: [QuestionSchema]
}, { _id: false });

const ListeningPartSchema = new Schema({
    title: { type: String, required: true },
    audioUrl: { type: String, required: true },
    instructions: { type: String },
    example: { type: String },
    questions: [QuestionSchema]
    // Si necesitas la actividad de arrastrar, la añadimos aquí después
}, { _id: false });


// --- El Schema principal de la Lección ---

const LessonSchema = new Schema({
    level: { type: String, required: true, enum: ['A1', 'A2', 'B1'] },
    lessonNumber: { type: Number, required: true },
    title: { type: String, required: true },
    readings: [ReadingPartSchema],
    listenings: [ListeningPartSchema]
});

// Crear un índice para buscar lecciones eficientemente
LessonSchema.index({ level: 1, lessonNumber: 1 }, { unique: true });

// Compilar el modelo a partir del schema
const Lesson = mongoose.model('Lesson', LessonSchema);

// Exportar el modelo compilado. ESTA ES LA LÍNEA MÁS IMPORTANTE.
module.exports = Lesson;
