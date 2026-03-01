import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './server/db.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-teachers';

app.use(cors());
app.use(express.json());

// Authentication Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// --- API Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Barcha maydonlarni toldiring' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO teachers (name, email, password) VALUES (?, ?, ?)');
    const info = stmt.run(name, email, hashedPassword);
    
    const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: info.lastInsertRowid, name, email } });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Bu email allaqachon ro`yxatdan o`tgan' });
    } else {
      res.status(500).json({ error: 'Server xatosi' });
    }
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email va parolni kiriting' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM teachers WHERE email = ?');
    const teacher: any = stmt.get(email);

    if (!teacher) {
      return res.status(400).json({ error: 'Email yoki parol noto`g`ri' });
    }

    const validPassword = await bcrypt.compare(password, teacher.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email yoki parol noto`g`ri' });
    }

    const token = jwt.sign({ id: teacher.id, email: teacher.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: teacher.id, name: teacher.name, email: teacher.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('SELECT id, name, email FROM teachers WHERE id = ?');
  const teacher = stmt.get(req.user.id);
  if (!teacher) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  res.json({ user: teacher });
});

// Get all students for the logged-in teacher
app.get('/api/students', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('SELECT * FROM students WHERE teacher_id = ? ORDER BY created_at DESC');
  const students = stmt.all(req.user.id);
  res.json(students);
});

// Add a new student
app.post('/api/students', authenticateToken, (req: any, res) => {
  const { first_name, last_name, grade_level } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'Ism va familiyani kiriting' });
  }

  const stmt = db.prepare('INSERT INTO students (teacher_id, first_name, last_name, grade_level) VALUES (?, ?, ?, ?)');
  const info = stmt.run(req.user.id, first_name, last_name, grade_level || '');
  
  const newStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(info.lastInsertRowid);
  res.json(newStudent);
});

// Delete a student
app.delete('/api/students/:id', authenticateToken, (req: any, res) => {
  const stmt = db.prepare('DELETE FROM students WHERE id = ? AND teacher_id = ?');
  const info = stmt.run(req.params.id, req.user.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'O`quvchi topilmadi yoki o`chirishga ruxsat yo`q' });
  }
  res.json({ success: true });
});

// Edit a student
app.put('/api/students/:id', authenticateToken, (req: any, res) => {
  const { first_name, last_name, grade_level } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'Ism va familiyani kiriting' });
  }

  const stmt = db.prepare('UPDATE students SET first_name = ?, last_name = ?, grade_level = ? WHERE id = ? AND teacher_id = ?');
  const info = stmt.run(first_name, last_name, grade_level || '', req.params.id, req.user.id);
  
  if (info.changes === 0) {
    return res.status(404).json({ error: 'O`quvchi topilmadi yoki tahrirlashga ruxsat yo`q' });
  }

  const updatedStudent = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  res.json(updatedStudent);
});

// Get evaluations for a student
app.get('/api/students/:id/evaluations', authenticateToken, (req: any, res) => {
  // First check if student belongs to teacher
  const studentCheck = db.prepare('SELECT id FROM students WHERE id = ? AND teacher_id = ?').get(req.params.id, req.user.id);
  if (!studentCheck) {
    return res.status(403).json({ error: 'Ruxsat yo`q' });
  }

  const stmt = db.prepare('SELECT * FROM evaluations WHERE student_id = ? ORDER BY date DESC');
  const evaluations = stmt.all(req.params.id);
  res.json(evaluations);
});

// Add an evaluation
app.post('/api/students/:id/evaluations', authenticateToken, (req: any, res) => {
  const { subject, score, comments } = req.body;
  if (!subject || score === undefined) {
    return res.status(400).json({ error: 'Fan va bahoni kiriting' });
  }

  // Check ownership
  const studentCheck = db.prepare('SELECT id FROM students WHERE id = ? AND teacher_id = ?').get(req.params.id, req.user.id);
  if (!studentCheck) {
    return res.status(403).json({ error: 'Ruxsat yo`q' });
  }

  const stmt = db.prepare('INSERT INTO evaluations (student_id, subject, score, comments) VALUES (?, ?, ?, ?)');
  const info = stmt.run(req.params.id, subject, score, comments || '');
  
  const newEval = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(info.lastInsertRowid);
  res.json(newEval);
});

// Get ranking (average score per student)
app.get('/api/ranking', authenticateToken, (req: any, res) => {
  const stmt = db.prepare(`
    SELECT 
      s.id, s.first_name, s.last_name, s.grade_level,
      COUNT(e.id) as total_evaluations,
      AVG(e.score) as average_score
    FROM students s
    LEFT JOIN evaluations e ON s.id = e.student_id
    WHERE s.teacher_id = ?
    GROUP BY s.id
    ORDER BY average_score DESC, total_evaluations DESC
  `);
  const ranking = stmt.all(req.user.id);
  res.json(ranking);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
