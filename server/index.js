const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
app.use('/api/data', require('./routes/data'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/rewards', require('./routes/rewards'));
app.use('/api/redemptions', require('./routes/redemptions'));
app.use('/api/student-levels', require('./routes/studentLevels'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/grades', require('./routes/grades'));

// Health Check
app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'EngCenter API is running.' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
