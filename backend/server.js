// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'rovalgroup.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// -----------------------
// DATABASE CONNECTION
// -----------------------
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database:', DB_FILE);
        initializeDatabase();
    }
});

// Initialize database tables (will keep existing tables if present)
function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS service_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_type TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        vehicle_type TEXT,
        driver_category TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Error creating service_requests table:', err);
        else console.log('Service requests table ready');
    });

    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price_per_day INTEGER NOT NULL,
        description TEXT,
        passengers INTEGER,
        fuel_type TEXT,
        transmission TEXT,
        image_url TEXT
    )`, (err) => {
        if (err) console.error('Error creating vehicles table:', err);
        else {
            console.log('Vehicles table ready');
            insertSampleVehiclesIfEmpty();
        }
    });
}

// Insert a few sample vehicles only if the table is empty
function insertSampleVehiclesIfEmpty() {
    db.get("SELECT COUNT(*) as count FROM vehicles", (err, row) => {
        if (err) {
            console.error('Error checking vehicles count:', err);
            return;
        }

        const count = row && row.count ? row.count : 0;
        console.log(`Found ${count} vehicles in database`);

        if (count === 0) {
            const vehicles = [
                // economy
                ['Toyota Prius', 'economy', 40000, 'Compact and fuel-efficient perfect for city driving.', 5, 'hybrid', 'Automatic', 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=300&q=80'],
                ['Honda Civic', 'economy', 38000, 'Popular sedan known for reliability and fuel efficiency.', 5, 'petrol', 'Automatic', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=300&q=80'],

                // premium
                ['Mercedes-Benz E-Class', 'premium', 80000, 'Luxury sedan with advanced technology and comfort.', 5, 'petrol', 'Automatic', 'https://example.com/merc.jpg'],
                ['BMW 5 Series', 'premium', 90000, 'Executive sedan with sporty performance and luxury.', 5, 'petrol', 'Automatic', 'https://example.com/bmw.jpg'],

                // suv
                ['Toyota RAV4', 'suv', 55000, 'Popular compact SUV perfect for families and adventures.', 5, 'petrol', 'Automatic', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=300&q=80'],
                ['Land Cruiser V8', 'suv', 100000, 'Luxury SUV with exceptional comfort and capability.', 7, 'diesel', 'Automatic', 'https://example.com/landcruiser.jpg'],

                // commercial
                ['Toyota Hiace', 'commercial', 60000, 'Reliable van for passenger transport or cargo delivery.', 12, 'diesel', 'Manual', 'https://example.com/hiace.jpg'],
                ['Ford Transit', 'commercial', 65000, 'Versatile commercial van for various business needs.', 8, 'diesel', 'Automatic', 'https://example.com/transit.jpg']
            ];

            const stmt = db.prepare(`INSERT INTO vehicles (name, category, price_per_day, description, passengers, fuel_type, transmission, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            vehicles.forEach(v => stmt.run(v, (err) => {
                if (err) console.error('Error inserting vehicle:', err);
            }));
            stmt.finalize(err => {
                if (err) console.error('Error finalizing insertion stmt:', err);
                else console.log('Sample vehicles inserted');
            });
        }
    });
}

// -----------------------
// EMAIL TRANSPORTER (logger fallback)
// -----------------------
// Use real nodemailer transporter in production by checking process.env values.
// For now, we log emails to console to avoid crashes if credentials are missing.
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
} else {
    transporter = {
        sendMail: (mailOptions, cb) => {
            console.log('\n=== Email (logged, not sent) ===');
            console.log('To:', mailOptions.to);
            console.log('Subject:', mailOptions.subject);
            console.log('HTML:', mailOptions.html ? '(html content)' : mailOptions.text);
            console.log('=== End Email Log ===\n');
            cb && cb(null, { message: 'logged' });
        }
    };
}

// -----------------------
// API ROUTES
// -----------------------

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all vehicles or filtered by query param `category` (case-insensitive)
// Example: /api/vehicles?category=economy
app.get('/api/vehicles', (req, res) => {
    const category = (req.query.category || '').toString().trim().toLowerCase();

    if (category && category !== 'all') {
        // Use case-insensitive comparison
        const sql = `SELECT * FROM vehicles WHERE LOWER(category) = ? ORDER BY id`;
        db.all(sql, [category], (err, rows) => {
            if (err) {
                console.error('Error fetching vehicles by category:', err);
                return res.status(500).json({ error: err.message });
            }
            return res.json(rows);
        });
    } else {
        // Return all
        db.all('SELECT * FROM vehicles ORDER BY id', (err, rows) => {
            if (err) {
                console.error('Error fetching vehicles:', err);
                return res.status(500).json({ error: err.message });
            }
            return res.json(rows);
        });
    }
});

// (Optional) also support the "category" path variant: /api/vehicles/category/:category
app.get('/api/vehicles/category/:category', (req, res) => {
    const category = (req.params.category || '').toString().trim().toLowerCase();
    db.all('SELECT * FROM vehicles WHERE LOWER(category) = ? ORDER BY id', [category], (err, rows) => {
        if (err) {
            console.error('Error fetching vehicles by category (path):', err);
            return res.status(500).json({ error: err.message });
        }
        return res.json(rows);
    });
});

// Submit service request
app.post('/api/service-request', (req, res) => {
    const { serviceType, name, email, phone, vehicleType, driverCategory, message } = req.body;

    if (!serviceType || !name || !email || !phone || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `INSERT INTO service_requests (service_type, name, email, phone, vehicle_type, driver_category, message) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [serviceType, name, email, phone, vehicleType, driverCategory, message], function(err) {
        if (err) {
            console.error('Error inserting service request:', err);
            return res.status(500).json({ error: err.message });
        }

        // Send (or log) notification email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@rovalgroup.com',
            to: 'rovalgroup1@gmail.com, niishimwe54@gmail.com',
            subject: `New Service Request from ${name}`,
            html: `
                <h3>New Service Request</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Service Type:</strong> ${serviceType}</p>
                <p><strong>Vehicle Type:</strong> ${vehicleType || 'Not specified'}</p>
                <p><strong>Driver Category:</strong> ${driverCategory || 'Not specified'}</p>
                <p><strong>Message:</strong> ${message}</p>
                <p><em>Submitted at ${new Date().toLocaleString()}</em></p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email send error (logged):', error);
            } else {
                console.log('Email send info:', info && info.message ? info.message : info);
            }
        });

        res.json({ message: 'Service request submitted', id: this.lastID });
    });
});

// Get all service requests (admin)
app.get('/api/service-requests', (req, res) => {
    db.all('SELECT * FROM service_requests ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching service requests:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Update service request status
app.put('/api/service-requests/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    db.run('UPDATE service_requests SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
            console.error('Error updating request status:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Service request updated' });
    });
});

// -----------------------
// SERVE FRONTEND
// -----------------------
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// For any routes not handled by the API, send index.html (so client-side routing still works)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// -----------------------
// START SERVER
// -----------------------
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
    console.log(`API endpoints available at: http://localhost:${PORT}/api/`);
});
