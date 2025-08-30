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
        // --- AÑADE ESTA SECCIÓN PARA CREAR EL PROFESOR ---
        console.log("Creando/verificando usuario profesor de prueba...");
        const teacherEmail = 'teacher.test@europaschool.org';
        
        // Buscamos si ya existe para no crearlo dos veces
        let teacher = await User.findOne({ email: teacherEmail });

        if (!teacher) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('teacher123', salt);
            teacher = new User({
                name: 'Profesor de Prueba',
                email: teacherEmail,
                password: hashedPassword,
                role: 'teacher'
            });
            await teacher.save();
            console.log("Profesor de prueba creado con éxito.");
        } else {
            console.log("El profesor de prueba ya existía.");
        }

      //----FIN DE BLOQUE---//
      
        const leccionesParaGuardar = [
            {
    "level": "A2",
    "lessonNumber": 1,
    "title": "Lección 1",
    "readings": [
        {
            "title": "Teil 1",
            "instructions": "Du liest in einer Zeitung diesen Text.\nWähle für die Aufgaben 1 bis 5 die richtige Lösung aus.",
            "text": "Lust eine Sprache zu lernen, aber überhaupt keine Lust auf Stress? Mit Kochrezepten im Unterricht und der Möglichkeit, die gelernte Sprache auf Reisen aktiv zu üben? Dann ist LUDIMUS das Richtige für dich!\n\nIn LUDIMUS lernt man Sprachen KREATIV\n\nÜbungen, Hausarbeiten und Tests? Nicht bei uns! Alle, die bei uns unterrichten, bringen viel Erfahrung mit und sind auch sehr kreativ. Wir lernen Spanisch, Französisch und Italienisch mit Kunst, Filmen, Liedern und sogar Kochrezepten. Wir haben beim Sprachenlernen, so wie Kinder beim Spielen, einfach nur Spaß. Kurse für Jugendliche ab 15 und für Erwachsene.\n\nWo?\n\nUnsere Schule hat große, moderne Räume. Bei gutem Wetter finden die Kurse sogar in unserem Garten statt. Die Gruppen sind schön klein, nicht mehr als 8 Personen. Die Kurse laufen jedes Jahr bis Ende Mai.\nInformiert euch auf unserer Webseite über die Kurse, die Einschreibungen und die Preise und seht in unserer tollen Fotosammlung, wie viel Spaß der Unterricht bei uns macht.\n\nWir reisen und entdecken Land und Sprache\n\nAlle zwei Jahre reisen wir mit unseren Schülern und Schülerinnen in europäische Städte, wo wir unsere Fremdsprachenkenntnisse auch benutzen und gemeinsam eine tolle Zeit verbringen! Unsere nächsten Reiseziele: Lanzarote, Palermo und Marseille.",
            "questions": [
                {
                    "text": "1.- Die Lehrerinnen und Lehrer...",
                    "options": [
                        "geben keine Hausaufgaben auf.",
                        "sind sehr jung und neu im Beruf.",
                        "sprechen alle mindestens drei Sprachen."
                    ],
                    "correctAnswer": "geben keine Hausaufgaben auf."
                },
                {
                    "text": "2.- Zu LUDIMUS kommen...?",
                    "options": [
                        "jugendliche und Erwachsene, die Deutsch lernen möchten.",
                        "Kinder, die Hausaufgaben langweilig finden.",
                        "Leute, die Unterricht ohne Stress machen wollen."
                    ],
                    "correctAnswer": "Leute, die Unterricht ohne Stress machen wollen."
                },
                {
                    "text": "4.- Die Kurse...?",
                    "options": [
                        "beginnen Ende Mai.",
                        "finden bei schlechten Wetter nicht statt.",
                        "finden drinnen oder draußen statt."
                    ],
                    "correctAnswer": "finden drinnen oder draußen statt."
                },
                {
                    "text": "5.- Auf der Webseite...?",
                    "options": [
                        "bekommt man wichtige Informationen zu den Kursen.",
                        "gibt es auch Online-Kurse.",
                        "gibt es keine Fotos."
                    ],
                    "correctAnswer": "bekommt man wichtige Informationen zu den Kursen."
                },
                {
                    "text": "Die Schülerinnen und Schüler...",
                    "options": [
                        "können auf Reisen Spanisch, Italienisch oder Französisch sprechen.",
                        "lernen alle zwei Jahre eine neue Sprache.",
                        "machen jedes Jahr eine Reise."
                    ],
                    "correctAnswer": "können auf Reisen Spanisch, Italienisch oder Französisch sprechen."
                }
            ]
        },
       {
  "title": "Teil 2",
  "text": "Sommerfest im Tal   27. – 30. Juli\n\nStrand-Zelt\n10.00–12.00   Fotoausstellung „Meer und Sonne“\n10.00–12.00   Workshop „Sicher am Strand und im Wasser“: Die besten Tipps für den Urlaub!\n12.30–18.00   Rhythmische Live-Musik von verschiedenen Bands: Tanz ohne Schuhe im Sand!\n18.30–20.00   Strandtennis-Turnier: Gewinne ein Strandtennis-Set!\n\nMärchen-Zelt\n10.00–12.00   Die schönsten „Unter-Wasser-Erzählungen“\n12.30–15.00   Kreatives Schreiben: „Rotkäppchen und der böse Wolf“ oder vielleicht „Grünkappchen und der liebe Wolf“?\n15.30–17.00   Theateraufführungen: „Der Löwe und das Mäuschen“ und andere Geschichten\n17.30–20.00   Workshop „Die Sonne in mir“: Der kleine Fisch Freudich erzählt uns seine Geschichte und zeigt uns den Weg zum Glück.\n\nKunst-Zelt\n10.00–12.00   Dein Sommer auf Papier: Male dein eigenes Bild!\n12.30–15.00   Strand-Bastelgruppe: Wir basteln mit Steinen, Holz und Sand!\n15.30–17.00   Projekt „Mein Poster“: Das lustigste Foto von dir und deiner Familie oder deinen Freunden als Poster!\n17.30–20.00   Workshop Kleidung: Hier kannst du dein langweiliges T-Shirt und deine langweilige Hose verschönern! Dazu brauchst du nur eine Schere und Fantasie!\n\nImbiss-Zelt\nWarme und kalte Getränke\nRohkost: Obst und Gemüse\nGrillecke: gegrillter Fisch, gegrilltes Fleisch und Gemüse\nPizza und Burger\nEis\n\nFitness-Zelt\nSpielecke für die Kleinen (zwei bis fünf Jahre)\nKletterwand\nWir lernen Hip-Hop tanzen (auch für Anfänger)",
  "questions": [
    {
      "text": "1.- Wo kann man etwas essen?",
      "options": [
        "Im Kunst-Zelt.",
        "Im Imbiss-Zelt.",
        "Im Märchen-Zelt."
      ],
      "correctAnswer": "Im Imbiss-Zelt."
    },
    {
      "text": "2.- Welche Aktivität ist für sehr kleine Kinder?",
      "options": [
        "Die Kletterwand.",
        "Das Strandtennis-Turnier.",
        "Die Spielecke."
      ],
      "correctAnswer": "Die Spielecke."
    },
    {
      "text": "3.- Was kann man um 19:00 Uhr im Strand-Zelt machen?",
      "options": [
        "Eine Fotoausstellung sehen.",
        "Strandtennis spielen.",
        "Live-Musik hören."
      ],
      "correctAnswer": "Strandtennis spielen."
    },
    {
      "text": "4.- Was braucht man im Kunst-Zelt für den Workshop Kleidung?",
      "options": [
        "Papier und Stifte.",
        "Steine, Holz und Sand.",
        "Eine Schere und Fantasie."
      ],
      "correctAnswer": "Eine Schere und Fantasie."
    },
    {
      "text": "5.- Was kann man im Märchen-Zelt lernen oder machen?",
      "options": [
        "Hip-Hop tanzen.",
        "Ein eigenes Bild malen.",
        "Kreativ schreiben."
      ],
      "correctAnswer": "Kreativ schreiben."
    }
  ]
},
      {
    "title": "Teil 3",
    "instructions": "Du liest eine E-Mail.\nWähle für die Aufgaben 11 bis 15 die richtige Lösung a, b oder c.",
    "text": "Liebe Mira,\n\n hoffentlich geht es dir inzwischen wieder besser! Was macht dein Bein? Musst du immer noch diesen schweren Gips tragen? Das ist jetzt im Sommer bei der Wärme bestimmtnicht sehr angenehm. Bald hast du es aber hinter dir und dann können wir wieder feiern.\n\n Die Party war super, aber du hast uns natürlich allen sehr gefehlt. Dafür bekommst du alsErste eine Mail von meinem neuen Computer! Du weißt ja, dass mir meine Eltern ihrenComputer immer geliehen haben, aber ich habe mir schon lange einen eigenen gewünscht.Und zum 15. Geburtstag habe ich ihn endlich bekommen!\n\n Ich wollte einen supermodernen Rechner haben und der war sogar sehr günstig. Es gabihn leider nur in Schwarz, aber er ist schön groß und hat super viel Platz, genug umviele Filme herunterzuladen und jede Menge Fotos oder Musik zu speichern.\n\n Die Fotos von der Party sind sehr schön geworden. Ich konnte sie noch nicht alle durchsehenund hochladen (nur auf meinem Smartphone habe ich über 200 Fotos), aber die lustigstenschicke ich dir zusammen mit dieser E-Mail.\n\n Wie lange musst du denn noch zu Hause bleiben? Ich freue mich, dich bald wiederzusehen!Ich könnte auch mal vorbeikommen, wenn du Lust hast. Oder du kommst – mitGips – zu mir und wir machen einen Filmabend. Was meinst du?\n\n Drück dich fest,\n Elsa",
    "questions": [
        {
            "text": "11 Warum war Mira nicht auf der Party?",
            "options": [
                "Es war ihr zu warm.",
                "Sie hatte Fieber.",
                "Sie war am Bein verletzt."
            ],
            "correctAnswer": "Sie war am Bein verletzt."
        },
        {
            "text": "12 Worüber freut sich Elsa?",
            "options": [
                "Sie hat nun einen eigenen Computer.",
                "Sie hat von ihren Eltern ein modernes Smartphone bekommen.",
                "Sie ist endlich 16 geworden."
            ],
            "correctAnswer": "Sie hat nun einen eigenen Computer."
        },
        {
            "text": "13 Was findet Elsa an dem Computer besonders gut?",
            "options": [
                "Dass er eine tolle Farbe hat und modern ist.",
                "Dass er nicht so groß ist und nicht viel Platz braucht.",
                "Dass er viel Platz zum Speichern hat."
            ],
            "correctAnswer": "Dass er viel Platz zum Speichern hat."
        },
        {
            "text": "14 Was schreibt Elsa über die Fotos?",
            "options": [
                "Dass sie leider nicht so lustig sind.",
                "Dass sie Mira alle Fotos schickt.",
                "Dass sie mit dem Smartphone mehr als 200 Fotos gemacht hat."
            ],
            "correctAnswer": "Dass sie mit dem Smartphone mehr als 200 Fotos gemacht hat."
        },
        {
            "text": "15 Was schlägt Elsa vor?",
            "options": [
                "Ein Treffen bei ihr oder bei Mira zu Hause.",
                "Einen Filmabend bei Mira.",
                "Einen Kinobesuch mit Mira."
            ],
            "correctAnswer": "Ein Treffen bei ihr oder bei Mira zu Hause."
        }
    ]
},
      {
    "title": "Teil 4",
    "instructions": "Sechs Jugendliche suchen auf der Webseite ihrer Schule eine Arbeitsgemeinschaft (AG).\nLies die Aufgaben 16 bis 20 und die Anzeigen a bis f.\nWelche Anzeige passt zu welcher Person?\nFür eine Aufgabe gibt es keine Lösung. Markiere so: X.\nDie Anzeige aus dem Beispiel kannst du nicht mehr wählen.",
    "text": "www.dreikurs-gymnasium.example.com\n\nDREIKURS-GYMNASIUM\nHier ein Einblick in unsere Arbeitsgemeinschaften (AGs):\n\na) Schmuck-AG\nWer gern Schmuck trägt und Lust auf Basteln und Experimentieren hat, ist hier richtig! Wir machen aus verschiedenen Materialien Ohrringe, Armreifen, Ketten und Ringe und lernen verschiedene Flechttechniken. Mehr Infos und Fotos findet ihr auf der Homepage der Schule.\n\nb) Yoga-AG\nEine kleine Einführung in die Welt des Yoga. Zusammen arbeiten wir an unserer Körperhaltung und sorgen mit Übungen und Körperstellungen (Asanas) für einen starken Körper. Kurzfilme und Fotos haben die Teilnehmer vom letzten Jahr auf der Internetseite der Schule hochgeladen. Schaut doch mal rein!\n\nc) Video-AG\nWenn du gern Videos machst und ein Smartphone, ein Tablet oder einen Laptop hast, komm zur Video-AG! Hier bekommst du viele Tipps, wie man Videos erstellt und bearbeitet. Dann kannst du auf den verschiedenen Plattformen die besten Videos hochladen.\n\nd) Schulband-AG\nWir gründen zusammen eine Band, machen Musik und haben Spaß! Singst du gut oder spielst du ein Instrument? Hörst du gern Rock- oder Popmusik? Dann bist du in der Schulband-AG genau richtig! Auf dem Sommerfest präsentieren wir dann unsere Arbeit!\n\ne) Fußball-AG\nAm wichtigsten sind in unserer AG natürlich Fußballtechniken und Gruppenarbeit. Das Training besteht aus Aufwärmen und Übungen mit dem Ball und aus einem kleinen Turnier. Regelmäßig nehmen wir an Wochenenden auch an größeren Turnieren teil.\n\nf) Gitarren-AG\nEgal ob du schon Gitarre spielst oder ob du jetzt damit anfangen möchtest, in unserer AG gibt es einen Platz für dich! Wir spielen Klassiker, Pop- und Rocksongs. Jedes Jahr geben wir auf der Weihnachtsfeier ein Konzert. Wenn du noch keine Gitarre hast, leihen wir dir eine aus – bis du deine eigene hast.",
    "questions": [
        {
            "text": "16 Samira möchte ein Musikinstrument spielen lernen.",
            "options": ["a", "b", "c", "d", "e", "f", "X"],
            "correctAnswer": "f"
        },
        {
            "text": "17 Mohammed macht gern Fotos und Filme mit seiner Smartphone-Kamera.",
            "options": ["a", "b", "c", "d", "e", "f", "X"],
            "correctAnswer": "c"
        },
        {
            "text": "18 Collin spielt gern Gitarre, aber sein Traum ist es, in einer Band zu singen.",
            "options": ["a", "b", "c", "d", "e", "f", "X"],
            "correctAnswer": "d"
        },
        {
            "text": "19 Ida singt sehr gern Kinderlieder.",
            "options": ["a", "b", "c", "d", "e", "f", "X"],
            "correctAnswer": "X"
        },
        {
            "text": "20 Finja arbeitet sehr gern mit den Händen.",
            "options": ["a", "b", "c", "d", "e", "f", "X"],
            "correctAnswer": "a"
        }
    ]
}
    ],
    "listenings": [
      {
    "title": "Hören Teil 1",
    "audioUrl": "URL_DE_CLOUDINARY_PARA_TEIL1.MP3",
    "instructions": "Du hörst fünf kurze Texte. Du hörst den Text zweimal.\nWähle für die Aufgaben 1 bis 5 die richtige Lösung aus.",
    "questions": [
        {
            "text": "1.- Welche Auskunft bekommt man in der Ansage der Praxis?",
            "options": [
                "Dass alle Termine eine Woche später stattfinden.",
                "Dass die Praxis nach dem 12.Mai geschlossen bleibt.",
                "Dass man Dr. Nowak unter 0208-69 69 99 18 anrufen kann."
            ],
            "correctAnswer": "Dass alle Termine eine Woche später stattfinden."
        },
        {
            "text": "2.- Was müssen die Besucher wissen?",
            "options": [
                "Dass der Rundgang im Erdgeschoss und im dritten Stock stattfinden.",
                "Dass die Führung in drei Sprachen ist.",
                "Dass Handys und Smartphones während der Führung nicht klingeln sollen."
            ],
            "correctAnswer": "Dass Handys und Smartphones während der Führung nicht klingeln sollen."
        },
        {
            "text": "3.- Warum will das Mädchen eine E-Mail schicken?",
            "options": [
                "Sie möchte ihre Freunde einladen.",
                "Sie möchte sich für vorgestern bedanken.",
                "Sie sucht ihre Jacke."
            ],
            "correctAnswer": "Sie möchte ihre Freunde einladen."
        },
        {
            "text": "4.- Was ist diesen Monat im Angebot? Wenn man für mehr als 25 Euro bestellt,...",
            "options": [
                "bekommt man eine Flasche Limo geschenkt.",
                "kostet jede Pizza nur 4 Euro.",
                "zahlt man 3 Euro weniger."
            ],
            "correctAnswer": "bekommt man eine Flasche Limo geschenkt."
        },
        {
            "text": "5.- Was macht der Junge mit dem Geld?",
            "options": [
                "Er behält es für nächstes Jahr.",
                "Er kauft sich Kleidung und Computerspiele.",
                "Er macht dieses Jahr eine Reise."
            ],
            "correctAnswer": "Er behält es für nächstes Jahr."
        }
    ]
},
      {
    "title": "Hören Teil 2",
    "audioUrl": "URL_DE_CLOUDINARY_PARA_TEIL2.MP3",
    "instructions": "Du hörst ein Gespräch. Du hörst den Text einmal.\nWas bringen Tilos und Annas Freunde zum Sommerfest mit?\nWähle für die Aufgaben 1 bis 5 das richtige Wort aus.\nWähle jedes Wort nur einmal.",
    "example": "Beispiel 0: Anna → Pizza",
    "questions": [], // Este Teil no tiene preguntas de opción múltiple, así que el array va vacío
    "dragDropOptions": [
        { "id": "a", "text": "Flasche Wasser" },
        { "id": "b", "text": "Pizza" },
        { "id": "c", "text": "Saft" },
        { "id": "d", "text": "Eis" },
        { "id": "e", "text": "Brötchen" },
        { "id": "f", "text": "Kuchen" },
        { "id": "g", "text": "Kaffee" },
        { "id": "h", "text": "Würstchen" },
        { "id": "i", "text": "Schokolade" }
    ],
    "dragDropAnswers": [
        { "person": "Jonas", "solution": "Brötchen" },
        { "person": "Noah", "solution": "Saft" },
        { "person": "Lukas", "solution": "Kaffee" },
        { "person": "Lina", "solution": "Eis" },
        { "person": "Emilia", "solution": "Kuchen" }
    ]
},
      {
    "title": "Hören Teil 3",
    "audioUrl": "URL_DE_CLOUDINARY_PARA_TEIL3.MP3",
    "instructions": "Du hörst fünf kurze Gespräche. Du hörst jeden Text einmal.\nWähle für die Aufgaben 11 bis 15 die richtige Lösung aus.",
    "questions": [
        {
            "text": "11.- Was braucht der Junge?",
            "options": [
                "Schuhe.",
                "Eine coole Sonnenbrille.",
                "Neue T-Shirts."
            ],
            "correctAnswer": "Neue T-Shirts."
        },
        {
            "text": "12.- Wann treffen sich die Mädchen?",
            "options": [
                "Um 19:30 Uhr.",
                "Um 20:00 Uhr.",
                "Um 21:00 Uhr."
            ],
            "correctAnswer": "Um 19:30 Uhr."
        },
        {
            "text": "13.- Was bekommt der Mann nicht zurück?",
            "options": [
                "Den Führerschein.",
                "Den Personalausweis.",
                "Das Formular."
            ],
            "correctAnswer": "Das Formular."
        },
        {
            "text": "14.- Was ist neben Fabians Haus?",
            "options": [
                "Das Schwimmbad.",
                "Der Bahnhof.",
                "Ein Kiosk."
            ],
            "correctAnswer": "Das Schwimmbad."
        },
        {
            "text": "15.- Was nimmt der Junge zum Lesen mit?",
            "options": [
                "Ein paar Comics.",
                "Das Tablet.",
                "Ein paar Bücher."
            ],
            "correctAnswer": "Das Tablet."
        }
    ]
},
      {
    "title": "Hören Teil 4",
    "audioUrl": "URL_DE_CLOUDINARY_PARA_TEIL4.MP3",
    "instructions": "Du hörst ein Interview. Du hörst den Text zweimal.\nWähle für die Aufgaben 16 bis 20 die richtige Lösung aus.",
    "example": "Luana kommt aus Deutschland → Nein",
    "questions": [
        {
            "text": "16.- Luana macht Kleidung nur für Frauen.",
            "options": [
                "Ja",
                "Nein"
            ],
            "correctAnswer": "Ja"
        },
        {
            "text": "17.- Luana findet es schade, dass Leute Kleidung wegwerfen.",
            "options": [
                "Ja",
                "Nein"
            ],
            "correctAnswer": "Ja"
        },
        {
            "text": "18.- Die Leute kaufen mehr Hosen als T-Shirts.",
            "options": [
                "Ja",
                "Nein"
            ],
            "correctAnswer": "Nein"
        },
        {
            "text": "19.- Luana verkauft ihre Kleidung über ihren Blog.",
            "options": [
                "Ja",
                "Nein"
            ],
            "correctAnswer": "Nein"
        },
        {
            "text": "20.- Luana muss viel lernen, weil sie nach der Schule studieren möchte.",
            "options": [
                "Ja",
                "Nein"
            ],
            "correctAnswer": "Nein"
        }
    ]
}
      
    ] // Dejamos esto vacío por ahora, aquí irían los datos de Hören
}
        ];

        await Lesson.deleteMany({});
        await Lesson.insertMany(leccionesParaGuardar);
        res.status(200).json({ message: '¡Datos de prueba (profesor y lecciones) creados con éxito!' });
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
