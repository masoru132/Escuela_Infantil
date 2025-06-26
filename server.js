const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos si es necesario
app.use('/public', express.static(path.join(__dirname, 'PUBLIC')));

// Crear carpetas si no existen
const carpetas = [
  'PUBLIC/json',
  'PUBLIC/pdf',
  'PUBLIC/multimedia/img/eventos'
];

carpetas.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configurar Multer según el tipo de archivo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'pdf') {
      cb(null, 'PUBLIC/pdf');
    } else if (file.fieldname === 'imagen') {
      cb(null, 'PUBLIC/multimedia/img/eventos');
    } else {
      cb(new Error('Campo inesperado: ' + file.fieldname));
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Ruta para recibir el formulario
// Para los valores que se quieren guardar, es necesario que coincida el atributo "name"
app.post('/eventos', upload.fields([{ name: 'imagen' }, { name: 'pdf' }]), (req, res) => {
  try {
    const { titulo, parrafo, fecha } = req.body;

    const imagen = req.files['imagen']?.[0];
    const pdf = req.files['pdf']?.[0];

    const rutaImagen = imagen ? `multimedia/img/eventos/${imagen.filename}` : null;
    const rutaPDF = pdf ? `pdf/${pdf.filename}` : null;

    const nuevoEvento = {
      titulo,
      parrafo,
      fecha,
      imagen: rutaImagen,
      pdf: rutaPDF
    };

    const jsonPath = path.join(__dirname, 'PUBLIC/json/Eventos.json');

    let eventos = [];
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf8');
      eventos = JSON.parse(data);
    }

    eventos.push(nuevoEvento);
    fs.writeFileSync(jsonPath, JSON.stringify(eventos, null, 2));

    res.json({ mensaje: '✅ Evento guardado correctamente', evento: nuevoEvento });
  } catch (err) {
    console.error('❌ Error al guardar evento:', err);
    res.status(500).json({ error: 'Error al guardar evento' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
