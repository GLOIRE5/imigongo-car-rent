const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite Database
const db = new sqlite3.Database('./rovalgroup.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Service requests table
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
        if (err) {
            console.error('Error creating service_requests table:', err);
        } else {
            console.log('Service requests table ready');
        }
    });

    // Vehicles table
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
        if (err) {
            console.error('Error creating vehicles table:', err);
        } else {
            console.log('Vehicles table ready');
            insertSampleVehicles();
        }
    });
}

// Insert sample vehicles
function insertSampleVehicles() {
    // Check if vehicles table is empty
    db.get("SELECT COUNT(*) as count FROM vehicles", (err, row) => {
        if (err) {
            console.error('Error checking vehicles count:', err);
            return;
        }

        const count = row.count;
        console.log(`Found ${count} vehicles in database`);

        if (count === 0) {
            const vehicles = [
                // ECONOMY CARS (5 vehicles)
                {
                    name: 'Toyota Prius',
                    category: 'economy',
                    price_per_day: 40000,
                    description: 'Compact and fuel-efficient perfect for city driving.',
                    passengers: 5,
                    fuel_type: 'hybrid',
                    transmission: 'Automatic',
                    image_url: 'https://imgs.search.brave.com/GyWid3XGu22OvtniAXsnLdiT9iif-PM2NbOXZlsHDyg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5mdGNkbi5uZXQvanBnLzE0LzkzLzExLzI4LzM2MF9GXzE0OTMxMTI4MjZfWldaN1N2NVpsSHVjdmV4dk92Q1dSQnNuNzBUMDVqZEYuanBn'
                },
                {
                    name: 'Hyundai Santa Fe',
                    category: 'economy',
                    price_per_day: 45000,
                    description: 'Reliable and efficient SUV for everyday use.',
                    passengers: 5,
                    fuel_type: '16 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://imgs.search.brave.com/W54wdcImlUXgJ0L-hi6XLa_EKkP-z0fCNDRhxORlMNU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91cGxvYWQud2lraW1lZGlhLm9yZy93aWtpcGVkaWEvY29tbW9ucy9kL2QyLzIwMThfSHl1bmRhaV9TYW50YV9GZV9mcm9udF82LjE1LjE4LmpwZw'
                },
                {
                    name: 'Honda Civic',
                    category: 'economy',
                    price_per_day: 38000,
                    description: 'Popular sedan known for reliability and fuel efficiency.',
                    passengers: 5,
                    fuel_type: '18 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Toyota Corolla',
                    category: 'economy',
                    price_per_day: 35000,
                    description: 'World-renowned for reliability and low maintenance costs.',
                    passengers: 5,
                    fuel_type: '20 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Mazda 3',
                    category: 'economy',
                    price_per_day: 42000,
                    description: 'Sporty compact car with premium features.',
                    passengers: 5,
                    fuel_type: '17 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1563720223485-41b76f31f1c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },

                // PREMIUM CARS (5 vehicles)
                {
                    name: 'Mercedes-Benz E-Class',
                    category: 'premium',
                    price_per_day: 80000,
                    description: 'Luxury sedan with advanced technology and comfort.',
                    passengers: 5,
                    fuel_type: '15km/L',
                    transmission: 'Automatic',
                    image_url: 'https://imgs.search.brave.com/lgEgo9pe5eIkmUnEOSENflrZRYNhTVEv3Lq88oGAksw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9yZW50YWRyaXZlcnJ3YW5kYS5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMjIvMDcvbWVyY2VkZXMtcndhbmRhLTEwMjR4NTc0LmpwZw'
                },
                {
                    name: 'Toyota Corolla Altis',
                    category: 'premium',
                    price_per_day: 50000,
                    description: 'Premium version with sophisticated design and features.',
                    passengers: 5,
                    fuel_type: '18 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLmOdc00lQO9NIrLG0qVDvmfNpg3UcjmkCfg&s'
                },
                {
                    name: 'BMW 5 Series',
                    category: 'premium',
                    price_per_day: 90000,
                    description: 'Executive sedan with sporty performance and luxury.',
                    passengers: 5,
                    fuel_type: '14 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Audi A6',
                    category: 'premium',
                    price_per_day: 85000,
                    description: 'German luxury with quattro all-wheel drive and premium interior.',
                    passengers: 5,
                    fuel_type: '13 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Lexus ES',
                    category: 'premium',
                    price_per_day: 75000,
                    description: 'Japanese luxury with exceptional comfort and reliability.',
                    passengers: 5,
                    fuel_type: '16 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1563720223485-41b76f31f1c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },

                // SUV & FAMILY VEHICLES (5 vehicles)
                {
                    name: 'TOYOTA Land Cruiser V8',
                    category: 'suv',
                    price_per_day: 100000,
                    description: 'Luxury SUV with exceptional comfort and capability.',
                    passengers: 7,
                    fuel_type: '10 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://cloud.leparking.fr/2023/06/12/01/07/toyota-land-cruiser-2020-toyota-land-cruiser-vxr-5-7-full-option-dubizzle_8821968536.jpg'
                },
                {
                    name: 'Toyota RAV4',
                    category: 'suv',
                    price_per_day: 55000,
                    description: 'Popular compact SUV perfect for families and adventures.',
                    passengers: 5,
                    fuel_type: '15 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Honda CR-V',
                    category: 'suv',
                    price_per_day: 52000,
                    description: 'Spacious and reliable SUV with excellent fuel economy.',
                    passengers: 5,
                    fuel_type: '16 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Ford Explorer',
                    category: 'suv',
                    price_per_day: 68000,
                    description: 'American SUV with powerful performance and ample space.',
                    passengers: 7,
                    fuel_type: '12 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Range Rover Sport',
                    category: 'suv',
                    price_per_day: 120000,
                    description: 'Ultimate luxury SUV with off-road capability and premium features.',
                    passengers: 5,
                    fuel_type: '11 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },

                // COMMERCIAL VEHICLES (5 vehicles)
                {
                    name: 'KIA Sorento TXL',
                    category: 'commercial',
                    price_per_day: 70000,
                    description: 'Spacious van for group travel or cargo transport.',
                    passengers: 7,
                    fuel_type: '17 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://imgs.search.brave.com/1xieViT__SExhH_Hz2aBxPPYtW6HL0GQGXTa18jCUQg/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cucmVudGNhcnJ3YW5kYS5jb20vc3RvcmFnZS9UaHVtYm5haWwvMDFKTk5LR1REVFBSRVFBMkRBU0RCNVNaV1MuanBn'
                },
                {
                    name: 'Toyota Hiace',
                    category: 'commercial',
                    price_per_day: 60000,
                    description: 'Reliable van for passenger transport or cargo delivery.',
                    passengers: 12,
                    fuel_type: '13 km/L',
                    transmission: 'Manual',
                    image_url: 'https://images.unsplash.com/photo-1563720223485-41b76f31f1c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Ford Transit',
                    category: 'commercial',
                    price_per_day: 65000,
                    description: 'Versatile commercial van for various business needs.',
                    passengers: 8,
                    fuel_type: '14 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Nissan NV350',
                    category: 'commercial',
                    price_per_day: 58000,
                    description: 'Commercial van with excellent cargo space and reliability.',
                    passengers: 10,
                    fuel_type: '15 km/L',
                    transmission: 'Manual',
                    image_url: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                },
                {
                    name: 'Mercedes Sprinter',
                    category: 'commercial',
                    price_per_day: 85000,
                    description: 'Premium commercial van with advanced features and comfort.',
                    passengers: 12,
                    fuel_type: '12 km/L',
                    transmission: 'Automatic',
                    image_url: 'https://images.unsplash.com/photo-1563720223485-41b76f31f1c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'
                }
            ];

            const stmt = db.prepare(`INSERT INTO vehicles (name, category, price_per_day, description, passengers, fuel_type, transmission, image_url) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            
            vehicles.forEach(vehicle => {
                stmt.run([
                    vehicle.name,
                    vehicle.category,
                    vehicle.price_per_day,
                    vehicle.description,
                    vehicle.passengers,
                    vehicle.fuel_type,
                    vehicle.transmission,
                    vehicle.image_url
                ], (err) => {
                    if (err) {
                        console.error('Error inserting vehicle:', err);
                    }
                });
            });
            
            stmt.finalize((err) => {
                if (err) {
                    console.error('Error finalizing statement:', err);
                } else {
                    console.log('Sample vehicles inserted successfully');
                    console.log(`- ${vehicles.filter(v => v.category === 'economy').length} Economy cars`);
                    console.log(`- ${vehicles.filter(v => v.category === 'premium').length} Premium cars`);
                    console.log(`- ${vehicles.filter(v => v.category === 'suv').length} SUV & Family vehicles`);
                    console.log(`- ${vehicles.filter(v => v.category === 'commercial').length} Commercial vehicles`);
                }
            });
        }
    });
}

// Email configuration (simplified - will log instead of sending if not configured)
const transporter = {
    sendMail: (mailOptions, callback) => {
        console.log('\n=== EMAIL NOTIFICATION ===');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Body:', mailOptions.html ? 'HTML content prepared' : mailOptions.text);
        console.log('=== (Email service not configured - would send in production) ===\n');
        callback(null, { message: 'Email logged (not sent - configure email service)' });
    }
};

// Routes

// Get all vehicles
app.get('/api/vehicles', (req, res) => {
    const { category } = req.query;
    
    let query = 'SELECT * FROM vehicles';
    let params = [];
    
    if (category && category !== 'all') {
        query += ' WHERE category = ?';
        params.push(category);
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching vehicles:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Submit service request
app.post('/api/service-request', (req, res) => {
    const { serviceType, name, email, phone, vehicleType, driverCategory, message } = req.body;
    
    if (!serviceType || !name || !email || !phone || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const sql = `INSERT INTO service_requests (service_type, name, email, phone, vehicle_type, driver_category, message) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [serviceType, name, email, phone, vehicleType, driverCategory, message], function(err) {
        if (err) {
            console.error('Error inserting service request:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER || 'noreply@rovalgroup.com',
            to: 'rovalgroup1@gmail.com, niishimwe54@gmail.com',
            subject: `New Service Request from ${name}`,
            html: `
                <h2>New Service Request</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Service Type:</strong> ${serviceType}</p>
                <p><strong>Vehicle Type:</strong> ${vehicleType || 'Not specified'}</p>
                <p><strong>Driver Category:</strong> ${driverCategory || 'Not specified'}</p>
                <p><strong>Message:</strong> ${message}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            `
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Email error:', error);
            } else {
                console.log('Email notification logged');
            }
        });
        
        res.json({
            message: 'Service request submitted successfully! We will contact you shortly.',
            id: this.lastID
        });
    });
});

// Get all service requests (for admin)
app.get('/api/service-requests', (req, res) => {
    db.all('SELECT * FROM service_requests ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching service requests:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Update service request status (for admin)
app.put('/api/service-requests/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    db.run('UPDATE service_requests SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
            console.error('Error updating service request:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Service request updated successfully' });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Roval Group API is running',
        timestamp: new Date().toISOString()
    });
});

// In your server.js - make sure this route exists and works correctly:
app.get('/api/vehicles', (req, res) => {
    const { category } = req.query;
    
    let query = 'SELECT * FROM vehicles';
    let params = [];
    
    if (category && category !== 'all') {
        query += ' WHERE category = ?';
        params.push(category);
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching vehicles:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
    console.log(`API endpoints available at: http://localhost:${PORT}/api/`);
});