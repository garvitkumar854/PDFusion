
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const JSZip = require('jszip');

const app = express();
const PORT = process.env.PORT || 5000;

// --- QPDF Runtime Installation ---
const qpdfDir = path.join(__dirname, 'qpdf');
const qpdfBinDir = path.join(qpdfDir, 'bin');
let qpdfPath = 'qpdf'; // Default to PATH

async function setupQpdfForLinux() {
    if (process.platform !== 'linux') {
        console.log('Skipping QPDF setup: Not on Linux.');
        return;
    }

    qpdfPath = path.join(qpdfBinDir, 'qpdf');

    if (fs.existsSync(qpdfPath)) {
        console.log('QPDF already exists at', qpdfPath);
        return;
    }

    console.log('QPDF not found. Starting download and setup...');
    if (!fs.existsSync(qpdfDir)) fs.mkdirSync(qpdfDir, { recursive: true });

    // URL for a specific, stable version of QPDF for x86_64 Linux
    const qpdfUrl = 'https://github.com/qpdf/qpdf/releases/download/v11.9.0/qpdf-11.9.0-bin-linux-x86_64.zip';
    const zipPath = path.join(qpdfDir, 'qpdf.zip');

    try {
        console.log(`Downloading QPDF from ${qpdfUrl}...`);
        await new Promise((resolve, reject) => {
            const file = fs.createWriteStream(zipPath);
            https.get(qpdfUrl, (response) => {
                // Follow redirects
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    https.get(response.headers.location, (redirectResponse) => {
                        redirectResponse.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            resolve();
                        });
                    }).on('error', reject);
                } else {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }
            }).on('error', reject);
        });

        console.log('Download complete. Extracting...');
        const data = fs.readFileSync(zipPath);
        const zip = await JSZip.loadAsync(data);

        // Find the qpdf binary inside the zip (it's in a subfolder)
        const qpdfFile = Object.values(zip.files).find(file => file.name.endsWith('/bin/qpdf'));

        if (!qpdfFile) {
            throw new Error('qpdf binary not found in the downloaded zip file.');
        }

        // Extract qpdf binary
        const content = await qpdfFile.async('nodebuffer');
        if (!fs.existsSync(qpdfBinDir)) fs.mkdirSync(qpdfBinDir, { recursive: true });
        fs.writeFileSync(qpdfPath, content);
        
        console.log('Extraction complete. Setting permissions...');
        fs.chmodSync(qpdfPath, 0o755); // Make it executable
        
        console.log('QPDF setup successful.');

    } catch (error) {
        console.error('QPDF setup failed:', error);
        process.exit(1); // Exit if setup fails
    } finally {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    }
}
// --- End of QPDF Setup ---

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
    }
};

app.use(cors(corsOptions));
// --- End of CORS Configuration ---

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

// Initialize QPDF and then start the server
setupQpdfForLinux().then(() => {
    app.listen(PORT, () => {
        console.log(`PDF API Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
});
