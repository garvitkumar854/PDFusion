const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create uploads and outputs directories if they don't exist
const uploadsDir = 'uploads';
const outputsDir = 'outputs';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir);

const upload = multer({ dest: `${uploadsDir}/` });

function runQpdfCommand(command, res, inputPath, outputPath) {
  exec(command, (error) => {
    // Clean up the uploaded file immediately
    fs.unlinkSync(inputPath);

    if (error) {
      console.error("QPDF Error:", error.message);
      // Attempt to clean up output file on error as well
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      return res.status(500).send("Error processing PDF. The password might be incorrect, or the file may be corrupted.");
    }

    res.download(outputPath, (err) => {
      // Clean up the output file after download
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      if (err) {
        console.error("Download Error:", err.message);
      }
    });
  });
}

// 🔐 LOCK PDF
app.post('/lock', upload.single('file'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join(outputsDir, `locked_${Date.now()}.pdf`);
  const password = req.body.password || '1234';

  const command = `qpdf --encrypt ${password} ${password} 256 -- ${inputPath} ${outputPath}`;
  runQpdfCommand(command, res, inputPath, outputPath);
});

// 🔓 UNLOCK PDF
app.post('/unlock', upload.single('file'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join(outputsDir, `unlocked_${Date.now()}.pdf`);
  const password = req.body.password;

  if (!password) {
    fs.unlinkSync(inputPath);
    return res.status(400).send("Password is required.");
  }

  const command = `qpdf --password=${password} --decrypt ${inputPath} ${outputPath}`;
  runQpdfCommand(command, res, inputPath, outputPath);
});

app.get('/', (req, res) => {
  res.send('PDF API Server is running.');
});

app.listen(PORT, () => {
  console.log(`PDF API Server running on http://localhost:${PORT}`);
});
