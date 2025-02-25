const mysql = require('mysql2');

const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

app.get('/', (req, res)=>{
  res.status(200);
  res.send("This is from root");
});

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'joseph',
  password: process.env.DB_PASSWORD || 'portfolio',
  database: process.env.DB_NAME || 'my_portfolio_db'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/submit', (req, res) => {
  const { name, email, message_type, message } = req.body;

  if (!name || !email || !message_type || !message) {
    return res.status(400).send('All fields are required.');
  }

  const sql = 'INSERT INTO form_submissions (name, email, message_type, message) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, message_type, message], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err.stack);
      return res.status(500).send('Database error.');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'New Form Submission',
      text: `Name: ${name}\nEmail: ${email}\nMessage Type: ${message_type}\nMessage: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).send(`Email error: ${error.message}`);
        }
        res.status(200).send('Form submitted successfully.');
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
