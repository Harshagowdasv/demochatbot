const express = require('express');
const XLSX = require('xlsx');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to Excel file
const excelFilePath = path.join(__dirname, 'database.xlsx');

// Load or create the Excel file
const loadWorkbook = () => {
    if (require('fs').existsSync(excelFilePath)) {
        return XLSX.readFile(excelFilePath);
    } else {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([['Username', 'Email', 'Password']]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
        XLSX.writeFile(excelFilePath, workbook);
        return workbook;
    }
};

// Route to handle signup
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const workbook = loadWorkbook();
    const worksheet = workbook.Sheets['Users'];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Check if username already exists
    const userExists = data.some(row => row.Username === username);
    if (userExists) {
        return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    // Add new user
    XLSX.utils.sheet_add_json(worksheet, [{ Username: username, Email: email, Password: password }], { skipHeader: true, origin: -1 });
    XLSX.writeFile(excelFilePath, workbook);

    res.json({ success: true, message: 'Signup successful!' });
});

// Route to handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const workbook = loadWorkbook();
    const worksheet = workbook.Sheets['Users'];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Check if user exists and password matches
    const user = data.find(row => row.Username === username && row.Password === password);
    if (user) {
        res.json({ success: true, message: 'Login successful!' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
