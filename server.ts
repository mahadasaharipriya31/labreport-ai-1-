import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to execute Python CLI engine
function runPythonEngine(payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || (process.platform === 'win32' ? 'py' : 'python3');
    const pythonArgs = [
      ...(process.platform === 'win32' && !process.env.PYTHON_EXECUTABLE ? ['-3'] : []),
      '-m',
      'backend.cli',
    ];
    const pyProcess = spawn(pythonExecutable, pythonArgs, {
      cwd: __dirname,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('error', (error) => {
      reject(new Error(`Unable to start Python executable "${pythonExecutable}": ${error.message}`));
    });

    pyProcess.on('close', (code) => {
      if (stderr) {
        console.warn('Python engine stderr:', stderr);
      }
      if (code !== 0) {
        reject(new Error(`Python process failed (exit code ${code}): ${stderr || stdout}`));
        return;
      }
      try {
        const json = JSON.parse(stdout);
        resolve(json);
      } catch (err) {
        console.error('Failed to parse Python output:', stdout);
        reject(new Error(`Python process failed (exit code ${code}): ${stderr || stdout}`));
      }
    });

    pyProcess.stdin.write(JSON.stringify(payload));
    pyProcess.stdin.end();
  });
}

// Handle all /api requests via Python engine
app.all('/api/*', async (req, res) => {
  try {
    const payload = {
      endpoint: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
    };

    const result = await runPythonEngine(payload);

    if (result.is_base64 && result.data) {
      const buffer = Buffer.from(result.data, 'base64');
      res.setHeader('Content-Type', result.content_type || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${result.filename || 'report.pdf'}"`);
      return res.status(result.status || 200).send(buffer);
    }

    return res.status(result.status || 200).json(result.data);
  } catch (err: any) {
    console.error('API Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LabReport AI Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
