// backend/models/lesson.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Sub-schemas para las partes internas de la lección ---

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
    // Aquí puedes añadir los schemas para la actividad de arrastrar si la necesitas
}, { _id: false });


// --- El Schema principal de la Lección ---

const LessonSchema = new Schema({
    level: { type: String, required: true, enum: ['A1', 'A2', 'B1'] },
    lessonNumber: { type: Number, required: true },
    title: { type: String, required: true },
    readings: [ReadingPartSchema],
    listenings: [ListeningPartSchema]
});

LessonSchema.index({ level: 1, lessonNumber: 1 }, { unique: true });

// Exportar usando el patrón "singleton"
module.exports = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
