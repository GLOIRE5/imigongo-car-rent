// API Base URL - Use your Render backend URL
const API_BASE_URL = 'https://imigongo-car-rent-4.onrender.com';

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // If clicking on Fleet link, ensure vehicles are loaded
            if (targetId === '#fleet') {
                setTimeout(() => {
                    if (document.querySelectorAll('.car-card').length === 0) {
                        loadVehicles();
                    }
                }, 500);
            }
        }
    });
});

// Form submission
document.getElementById('serviceRequestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        serviceType: document.getElementById('serviceType').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        vehicleType: document.getElementById('vehicleType').value,
        driverCategory: document.getElementById('driverCategory').value,
        message: document.getElementById('message').value
    };
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Submit to backend API - Now using your Render URL
    fetch(`${API_BASE_URL}/api/service-request`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        alert('Thank you for your request! We will contact you shortly.');
        document.getElementById('serviceRequestForm').reset();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Sorry, there was an error sending your request. Please try again later or contact us directly.');
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
});

// Load vehicles from backend
function loadVehicles(category = 'all') {
    const fleetGrid = document.getElementById('fleetGrid');
    
    // Show loading state
    fleetGrid.innerHTML = `
        <div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--secondary); margin-bottom: 1rem;"></i>
            <p>Loading ${category === 'all' ? 'all vehicles' : category + ' vehicles'}...</p>
        </div>
    `;
    
    // Now using your Render backend URL
    fetch(`${API_BASE_URL}/api/vehicles?category=${category}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(vehicles => {
            if (vehicles.length === 0) {
                fleetGrid.innerHTML = `
                    <div class="no-vehicles" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                        <i class="fas fa-car" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
                        <h3>No vehicles found</h3>
                        <p>No vehicles available in the ${category} category at the moment.</p>
                        <button class="btn" onclick="loadVehicles('all')" style="margin-top: 1rem;">
                            View All Vehicles
                        </button>
                    </div>
                `;
                return;
            }
            
            fleetGrid.innerHTML = '';
            vehicles.forEach(vehicle => {
                const carCard = document.createElement('div');
                carCard.className = 'car-card';
                carCard.setAttribute('data-category', vehicle.category);
                
                carCard.innerHTML = `
                    <div class="car-img">
                        <img src="${vehicle.image_url}" alt="${vehicle.name}" 
                             onerror="this.src='https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80'">
                    </div>
                    <div class="car-details">
                        <h3>${vehicle.name}</h3>
                        <p class="car-price">RWF ${vehicle.price_per_day.toLocaleString()}/day</p>
                        <p>${vehicle.description}</p>
                        <div class="car-specs">
                            <div class="spec">
                                <i class="fas fa-user"></i>
                                <p>${vehicle.passengers} Passengers</p>
                            </div>
                            <div class="spec">
                                <i class="fas fa-gas-pump"></i>
                                <p>${vehicle.fuel_type}</p>
                            </div>
                            <div class="spec">
                                <i class="fas fa-cog"></i>
                                <p>${vehicle.transmission}</p>
                            </div>
                        </div>
                        <button class="btn btn-small" onclick="requestVehicle('${vehicle.name}', '${vehicle.category}')" style="margin-top: 1rem; width: 100%;">
                            <i class="fas fa-car"></i> Request This Vehicle
                        </button>
                    </div>
                `;
                
                fleetGrid.appendChild(carCard);
            });
            
            // Re-initialize animations for new elements
            initializeAnimations();
        })
        .catch(error => {
            console.error('Error loading vehicles:', error);
            fleetGrid.innerHTML = `
                <div class="error" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #dc3545;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Error Loading Vehicles</h3>
                    <p>Unable to load vehicles at the moment. Please try again later.</p>
                    <button class="btn" onclick="loadVehicles('${category}')" style="margin-top: 1rem;">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        });
}

// Function to pre-fill vehicle type when clicking "Request This Vehicle"
function requestVehicle(vehicleName, vehicleCategory) {
    // Scroll to request form
    document.querySelector('#request').scrollIntoView({ 
        behavior: 'smooth' 
    });
    
    // Pre-fill the vehicle type based on the vehicle category
    const vehicleTypeSelect = document.getElementById('vehicleType');
    
    if (vehicleCategory && vehicleTypeSelect) {
        vehicleTypeSelect.value = vehicleCategory;
    }
    
    // Set focus to name field
    setTimeout(() => {
        document.getElementById('name').focus();
    }, 500);
}

// Fleet filtering functionality
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Load all vehicles initially
    loadVehicles();
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            console.log('Filtering by:', filterValue); // Debug log
            loadVehicles(filterValue);
        });
    });
    
    // Also load vehicles when fleet section comes into view (Intersection Observer)
    const fleetSection = document.getElementById('fleet');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Check if vehicles are already loaded
                const existingVehicles = document.querySelectorAll('.car-card');
                if (existingVehicles.length === 0) {
                    loadVehicles();
                }
            }
        });
    }, { threshold: 0.3 });
    
    if (fleetSection) {
        observer.observe(fleetSection);
    }
});

// Sticky header
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        header.style.padding = '0.5rem 0';
    } else {
        header.style.boxShadow = 'none';
        header.style.padding = '1rem 0';
    }
});

// Simple animation for elements when they come into view
function checkVisibility() {
    const elements = document.querySelectorAll('.service-card, .car-card, .driver-card');
    
    elements.forEach(element => {
        const position = element.getBoundingClientRect();
        
        // If element is in viewport
        if(position.top < window.innerHeight - 100) {
            element.style.opacity = 1;
            element.style.transform = 'translateY(0)';
        }
    });
}

function initializeAnimations() {
    const elements = document.querySelectorAll('.service-card, .car-card, .driver-card');
    
    elements.forEach(element => {
        element.style.opacity = 0;
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Check visibility on scroll and load
    window.addEventListener('scroll', checkVisibility);
    checkVisibility();
}

// Set initial state for animated elements
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
});

// Add some CSS for the new button styles
const style = document.createElement('style');
style.textContent = `
    .btn-small {
        padding: 8px 16px !important;
        font-size: 0.9rem !important;
    }
    
    .loading, .no-vehicles, .error {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .car-card {
        display: flex;
        flex-direction: column;
    }
    
    .car-card .btn {
        margin-top: auto;
    }
    
    .filter-btn.active {
        background: var(--primary) !important;
        color: white !important;
    }
`;
document.head.appendChild(style);