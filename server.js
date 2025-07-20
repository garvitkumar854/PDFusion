
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

let qpdfPath = 'qpdf'; // Use system qpdf

// --- CORS Configuration ---
const allowedOrigins = [
    'https://pdf-fusion-ew1vxh9b6-garvit-kumars-projects.vercel.app',
    'https://pdf-fusion.vercel.app', // Your new production domain
    'http://localhost:3000'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors());
app.options('*', cors()); // Enable pre-flight for all routes
// --- End of CORS Configuration ---

app.use((req, res, next) => {
  console.log('Request:', req.method, req.url, 'Origin:', req.headers.origin);
  next();
});

app.use(express.json());

// Create uploads and outputs directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir);

const upload = multer({ dest: uploadsDir });

function runQpdfCommand(command, res, inputPath, outputPath) {
  exec(command, (error, stdout, stderr) => {
    // Always clean up the uploaded file
    if (fs.existsSync(inputPath)) {
      fs.unlink(inputPath, (err) => {
        if (err) console.error("Error deleting input file:", err);
      });
    }

    if (error) {
      console.error("QPDF Error:", stderr);
      // Clean up the failed output file
      if (fs.existsSync(outputPath)) {
        fs.unlink(outputPath, (err) => {
          if (err) console.error("Error deleting output file on error:", err);
        });
      }
      
      let userMessage = "Error processing PDF.";
      if (stderr.includes('password') || stderr.includes('permission to open')) {
          userMessage = "The password provided is incorrect.";
      } else if (stderr.includes('is not a PDF file')) {
          userMessage = "The file is corrupted or not a valid PDF.";
      }
      
      return res.status(500).send(userMessage);
    }

    res.download(outputPath, (err) => {
      // Clean up the output file after successful download
      if (fs.existsSync(outputPath)) {
        fs.unlink(outputPath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting output file after download:", unlinkErr);
        });
      }
      if (err) {
        console.error("Download Error:", err.message);
      }
    });
  });
}

// 🔐 LOCK PDF
app.post('/lock', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const inputPath = req.file.path;
  const outputPath = path.join(outputsDir, `locked_${Date.now()}.pdf`);
  const password = req.body.password || '1234';

  const command = `"${qpdfPath}" --encrypt "${password}" "${password}" 256 -- "${inputPath}" "${outputPath}"`;
  runQpdfCommand(command, res, inputPath, outputPath);
});

// 🔓 UNLOCK PDF
app.post('/unlock', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const inputPath = req.file.path;
  const outputPath = path.join(outputsDir, `unlocked_${Date.now()}.pdf`);
  const password = req.body.password;

  if (!password) {
    // Clean up uploaded file before sending response
    if (fs.existsSync(inputPath)) {
       fs.unlinkSync(inputPath);
    }
    return res.status(400).send("Password is required.");
  }

  const command = `"${qpdfPath}" --password="${password}" --decrypt "${inputPath}" "${outputPath}"`;
  runQpdfCommand(command, res, inputPath, outputPath);
});

app.get('/', (req, res) => {
  res.send('PDF API Server is running.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`PDF API Server running on port ${PORT}`);
});
