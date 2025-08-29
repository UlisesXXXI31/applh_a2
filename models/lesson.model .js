// backend/models/lesson.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Sub-documentos para las partes de la lección ---

// Para preguntas de opción múltiple
const QuestionSchema = new Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true }
}, { _id: false }); // _id: false para que no cree IDs para cada pregunta

// Para la actividad de arrastrar de Hören Teil 2
const DragDropOptionSchema = new Schema({
    id: { type: String, required: true },
    text: { type: String, required: true }
}, { _id: false });

const DragDropAnswerSchema = new Schema({
    person: { type: String, required: true },
    solution: { type: String, required: true }
}, { _id: false });

// Schema para un "Teil" de Lesen
const ReadingPartSchema = new Schema({
    title: { type: String, required: true }, // "Teil 1", "Teil 2", etc.
    text: { type: String, required: true },
    instructions: { type: String },
    questions: [QuestionSchema]
});

// Schema para un "Teil" de Hören
const ListeningPartSchema = new Schema({
    title: { type: String, required: true }, // "Hören Teil 1", etc.
    audioUrl: { type: String, required: true },
    instructions: { type: String },
    example: { type: String },
    questions: [QuestionSchema], // Para actividades de opción múltiple
    dragDropOptions: [DragDropOptionSchema], // Para la actividad de arrastrar
    dragDropAnswers: [DragDropAnswerSchema]  // Para la actividad de arrastrar
});

// --- El Schema principal de la Lección ---

const LessonSchema = new Schema({
    level: { type: String, required: true, enum: ['A1', 'A2', 'B1'] },
    lessonNumber: { type: Number, required: true },
    title: { type: String, required: true }, // "Lección 1"
    readings: [ReadingPartSchema],
    listenings: [ListeningPartSchema]
});

// Crear un índice para buscar lecciones eficientemente
LessonSchema.index({ level: 1, lessonNumber: 1 }, { unique: true });

const Lesson = mongoose.model('Lesson', LessonSchema);

module.exports = Lesson;

