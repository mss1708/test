// IRCTC Application JavaScript

// Application Data
const appData = {
  stations: [
    {"code": "NDLS", "name": "New Delhi", "city": "Delhi"},
    {"code": "BCT", "name": "Mumbai Central", "city": "Mumbai"},
    {"code": "HWH", "name": "Howrah Jn", "city": "Kolkata"},
    {"code": "MAS", "name": "Chennai Central", "city": "Chennai"},
    {"code": "SBC", "name": "Bangalore City", "city": "Bangalore"},
    {"code": "SC", "name": "Secunderabad Jn", "city": "Hyderabad"},
    {"code": "PUNE", "name": "Pune Jn", "city": "Pune"},
    {"code": "ADI", "name": "Ahmedabad Jn", "city": "Ahmedabad"},
    {"code": "JP", "name": "Jaipur", "city": "Jaipur"},
    {"code": "LKO", "name": "Lucknow Nr", "city": "Lucknow"}
  ],
  trains: [
    {
      "number": "12951",
      "name": "Mumbai Rajdhani",
      "from": "NDLS",
      "to": "BCT",
      "departure": "16:55",
      "arrival": "08:35",
      "duration": "15h 40m",
      "distance": "1384 km",
      "classes": {
        "1AC": {"fare": 4540, "available": 12},
        "2AC": {"fare": 2895, "available": 45},
        "3AC": {"fare": 2090, "available": 78}
      }
    },
    {
      "number": "12301",
      "name": "Howrah Rajdhani",
      "from": "NDLS",
      "to": "HWH",
      "departure": "17:00",
      "arrival": "10:05",
      "duration": "17h 05m",
      "distance": "1441 km",
      "classes": {
        "1AC": {"fare": 4985, "available": 8},
        "2AC": {"fare": 3150, "available": 32},
        "3AC": {"fare": 2265, "available": 65}
      }
    },
    {
      "number": "12621",
      "name": "Tamil Nadu Express",
      "from": "NDLS",
      "to": "MAS",
      "departure": "22:30",
      "arrival": "07:40",
      "duration": "33h 10m",
      "distance": "2180 km",
      "classes": {
        "SL": {"fare": 825, "available": 156},
        "3AC": {"fare": 2185, "available": 89},
        "2AC": {"fare": 3140, "available": 34},
        "1AC": {"fare": 5230, "available": 15}
      }
    }
  ],
  popularRoutes: [
    {"from": "Delhi", "to": "Mumbai", "duration": "15h 40m"},
    {"from": "Delhi", "to": "Kolkata", "duration": "17h 05m"},
    {"from": "Delhi", "to": "Chennai", "duration": "33h 10m"},
    {"from": "Mumbai", "to": "Bangalore", "duration": "23h 45m"},
    {"from": "Delhi", "to": "Jaipur", "duration": "4h 35m"}
  ],
  sampleBookings: [
    {
      "pnr": "2847392561",
      "train": "12951 - Mumbai Rajdhani",
      "from": "New Delhi",
      "to": "Mumbai Central",
      "date": "2025-10-15",
      "class": "2AC",
      "status": "Confirmed",
      "passengers": [
        {"name": "John Doe", "age": 32, "gender": "Male", "seat": "A1-45"}
      ],
      "fare": 2895
    },
    {
      "pnr": "2847392562",
      "train": "12301 - Howrah Rajdhani",
      "from": "New Delhi",
      "to": "Howrah Jn",
      "date": "2025-10-20",
      "class": "3AC",
      "status": "RAC",
      "passengers": [
        {"name": "Jane Smith", "age": 28, "gender": "Female", "seat": "RAC-12"}
      ],
      "fare": 2265
    }
  ]
};

// Application State
let currentPage = 'home';
let currentUser = null; // Start with no user logged in
let searchResults = [];
let selectedTrain = null;
let pendingBookingTrain = null; // Store train selection when user needs to login
let bookingData = {
  passengers: [],
  contact: {},
  payment: ''
};

// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const toggleForm = document.getElementById('toggleForm');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const trainSearchForm = document.getElementById('trainSearchForm');
const fromStation = document.getElementById('fromStation');
const toStation = document.getElementById('toStation');
const fromDropdown = document.getElementById('fromDropdown');
const toDropdown = document.getElementById('toDropdown');
const swapStations = document.getElementById('swapStations');
const journeyDate = document.getElementById('journeyDate');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    journeyDate.value = today;
    journeyDate.min = today;

    // Load popular routes
    loadPopularRoutes();

    // Set up event listeners
    setupEventListeners();

    // Initialize login state (start with no user)
    updateLoginState();

    // Show home page by default
    showPage('home');
}

function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            if (page === 'bookings' && !currentUser) {
                showLoginModal();
                return;
            }
            showPage(page);
        });
    });

    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Login modal
    loginBtn.addEventListener('click', () => {
        if (currentUser) {
            logout();
        } else {
            showLoginModal();
        }
    });

    closeModal.addEventListener('click', () => {
        hideLoginModal();
    });

    // Modal backdrop click
    loginModal.querySelector('.modal-backdrop').addEventListener('click', () => {
        hideLoginModal();
    });

    // Toggle between login and register
    toggleForm.addEventListener('click', (e) => {
        e.preventDefault();
        toggleAuthForm();
    });

    // Station autocomplete
    setupStationAutocomplete(fromStation, fromDropdown);
    setupStationAutocomplete(toStation, toDropdown);

    // Swap stations
    swapStations.addEventListener('click', () => {
        const temp = fromStation.value;
        fromStation.value = toStation.value;
        toStation.value = temp;
    });

    // Train search form
    trainSearchForm.addEventListener('submit', handleTrainSearch);

    // Login form
    loginForm.addEventListener('submit', handleLogin);

    // Register form
    registerForm.addEventListener('submit', handleRegister);

    // Modify search button
    const modifySearchBtn = document.getElementById('modifySearch');
    if (modifySearchBtn) {
        modifySearchBtn.addEventListener('click', () => {
            showPage('home');
        });
    }

    // Booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBooking);
    }

    // Add passenger button
    const addPassengerBtn = document.getElementById('addPassenger');
    if (addPassengerBtn) {
        addPassengerBtn.addEventListener('click', addPassengerRow);
    }

    // Close ticket modal
    const closeTicketModal = document.getElementById('closeTicketModal');
    if (closeTicketModal) {
        closeTicketModal.addEventListener('click', () => {
            document.getElementById('ticketModal').classList.add('hidden');
        });
    }

    // Print ticket
    const printTicket = document.getElementById('printTicket');
    if (printTicket) {
        printTicket.addEventListener('click', () => {
            window.print();
        });
    }

    // Cancel ticket
    const cancelTicket = document.getElementById('cancelTicket');
    if (cancelTicket) {
        cancelTicket.addEventListener('click', handleCancelTicket);
    }
}

function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Remove active class from all nav links
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;

        // Add active class to corresponding nav link
        const activeLink = document.querySelector(`[data-page="${pageId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load page-specific data
        if (pageId === 'bookings') {
            loadBookings();
        }
    }

    // Close mobile menu
    navMenu.classList.remove('active');
}

function setupStationAutocomplete(input, dropdown) {
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }

        const matches = appData.stations.filter(station => 
            station.name.toLowerCase().includes(query) || 
            station.city.toLowerCase().includes(query) ||
            station.code.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            dropdown.innerHTML = matches.map(station => 
                `<div class="autocomplete-item" data-code="${station.code}" data-name="${station.name}">
                    <strong>${station.name}</strong><br>
                    <small>${station.city} (${station.code})</small>
                </div>`
            ).join('');

            dropdown.style.display = 'block';

            // Add click event listeners to dropdown items
            dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', () => {
                    input.value = item.dataset.name;
                    input.dataset.code = item.dataset.code;
                    dropdown.style.display = 'none';
                });
            });
        } else {
            dropdown.style.display = 'none';
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function loadPopularRoutes() {
    const routesContainer = document.getElementById('popularRoutes');
    if (!routesContainer) return;

    routesContainer.innerHTML = appData.popularRoutes.map(route => 
        `<div class="route-card" onclick="fillSearchForm('${route.from}', '${route.to}')">
            <div class="route-from-to">${route.from} → ${route.to}</div>
            <div class="route-duration">${route.duration}</div>
        </div>`
    ).join('');
}

function fillSearchForm(from, to) {
    // Find station by city name
    const fromStation = appData.stations.find(s => s.city === from);
    const toStation = appData.stations.find(s => s.city === to);
    
    if (fromStation && toStation) {
        document.getElementById('fromStation').value = fromStation.name;
        document.getElementById('fromStation').dataset.code = fromStation.code;
        document.getElementById('toStation').value = toStation.name;
        document.getElementById('toStation').dataset.code = toStation.code;
    }
}

function handleTrainSearch(e) {
    e.preventDefault();
    
    const fromCode = fromStation.dataset.code;
    const toCode = toStation.dataset.code;
    const date = journeyDate.value;
    const travelClass = document.getElementById('travelClass').value;

    if (!fromCode || !toCode) {
        showToast('Please select valid stations', 'error');
        return;
    }

    if (fromCode === toCode) {
        showToast('Source and destination cannot be same', 'error');
        return;
    }

    // Show loading state
    const searchBtn = document.querySelector('.search-btn');
    const btnText = searchBtn.querySelector('.btn-text');
    const spinner = searchBtn.querySelector('.loading-spinner');
    
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');

    // Try calling backend API first
    fetch(`/api/search?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`)
        .then(res => res.json())
        .then(data => {
            searchResults = data.trains && data.trains.length ? data.trains : appData.trains.filter(train => {
                return (train.from === fromCode && train.to === toCode) ||
                       (train.from === toCode && train.to === fromCode);
            });
        })
        .catch(() => {
            // Fallback to local data on error
            searchResults = appData.trains.filter(train => {
                return (train.from === fromCode && train.to === toCode) ||
                       (train.from === toCode && train.to === fromCode);
            });
        })
        .finally(() => {
            // Reset button state
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');

            // Show results
            displaySearchResults(fromCode, toCode, date, travelClass);
            showPage('search');
        });
}

function displaySearchResults(fromCode, toCode, date, travelClass) {
    // Update search summary
    const fromStationData = appData.stations.find(s => s.code === fromCode);
    const toStationData = appData.stations.find(s => s.code === toCode);
    
    const searchSummary = document.getElementById('searchSummary');
    const formattedDate = new Date(date).toLocaleDateString('en-IN');
    
    searchSummary.innerHTML = `
        <strong>${fromStationData.name}</strong> to <strong>${toStationData.name}</strong> 
        on <strong>${formattedDate}</strong> • <strong>${travelClass}</strong>
    `;

    // Display trains
    const trainsList = document.getElementById('trainsList');
    
    if (searchResults.length === 0) {
        trainsList.innerHTML = `
            <div class="empty-state">
                <h4>No trains found</h4>
                <p>Sorry, no trains are available for this route on the selected date.</p>
                <button class="btn btn--primary" onclick="showPage('home')">Modify Search</button>
            </div>
        `;
        return;
    }

    trainsList.innerHTML = searchResults.map(train => {
        const fromStationName = appData.stations.find(s => s.code === train.from)?.name;
        const toStationName = appData.stations.find(s => s.code === train.to)?.name;
        
        return `
            <div class="train-card">
                <div class="train-header">
                    <div class="train-info">
                        <h4>${train.name}</h4>
                        <div class="train-number">#${train.number}</div>
                    </div>
                </div>
                
                <div class="train-timing">
                    <div class="time-info">
                        <div class="time">${train.departure}</div>
                        <div class="station">${fromStationName}</div>
                    </div>
                    <div class="duration-info">
                        <div>${train.duration}</div>
                        <div>${train.distance}</div>
                    </div>
                    <div class="time-info">
                        <div class="time">${train.arrival}</div>
                        <div class="station">${toStationName}</div>
                    </div>
                </div>
                
                <div class="classes-grid">
                    ${Object.entries(train.classes).map(([className, classData]) => `
                        <div class="class-option">
                            <div class="class-name">${className}</div>
                            <div class="class-fare">₹${classData.fare}</div>
                            <div class="class-availability">Available: ${classData.available}</div>
                            <button class="btn btn--primary book-now-btn" 
                                    onclick="selectTrain('${train.number}', '${className}')"
                                    ${classData.available === 0 ? 'disabled' : ''}>
                                ${classData.available > 0 ? 'Book Now' : 'Sold Out'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function selectTrain(trainNumber, className) {
    const train = searchResults.find(t => t.number === trainNumber);
    if (!train) return;

    const trainData = {
        ...train,
        selectedClass: className,
        fare: train.classes[className].fare
    };

    // If user is not logged in, show login modal and store the train selection
    if (!currentUser) {
        pendingBookingTrain = trainData;
        showLoginModal();
        return;
    }

    // User is logged in, proceed with booking
    proceedWithBooking(trainData);
}

function proceedWithBooking(trainData) {
    selectedTrain = trainData;

    // Update train summary on booking page
    updateTrainSummary();
    
    // Show booking page
    showPage('booking');
}

function updateTrainSummary() {
    const trainSummary = document.getElementById('trainSummary');
    if (!selectedTrain || !trainSummary) return;

    const fromStationData = appData.stations.find(s => s.code === selectedTrain.from);
    const toStationData = appData.stations.find(s => s.code === selectedTrain.to);

    trainSummary.innerHTML = `
        <div class="train-summary-content">
            <h4>${selectedTrain.name} (${selectedTrain.number})</h4>
            <div class="journey-details">
                <span><strong>${fromStationData.name}</strong> ${selectedTrain.departure}</span>
                <span>→</span>
                <span><strong>${toStationData.name}</strong> ${selectedTrain.arrival}</span>
            </div>
            <div class="class-fare-info">
                <span><strong>Class:</strong> ${selectedTrain.selectedClass}</span>
                <span><strong>Fare:</strong> ₹${selectedTrain.fare} per passenger</span>
            </div>
        </div>
    `;

    // Update fare breakdown
    updateFareBreakdown();
}

function updateFareBreakdown() {
    const fareBreakdown = document.getElementById('fareBreakdown');
    if (!selectedTrain || !fareBreakdown) return;

    const passengerCount = Math.max(1, document.querySelectorAll('.passenger-row').length);
    const baseFare = selectedTrain.fare * passengerCount;
    const taxes = Math.round(baseFare * 0.05); // 5% tax
    const total = baseFare + taxes;

    fareBreakdown.innerHTML = `
        <div class="fare-row">
            <span>Base Fare (${passengerCount} passenger${passengerCount > 1 ? 's' : ''})</span>
            <span>₹${baseFare}</span>
        </div>
        <div class="fare-row">
            <span>Service Tax</span>
            <span>₹${taxes}</span>
        </div>
        <div class="fare-row fare-total">
            <span>Total Amount</span>
            <span>₹${total}</span>
        </div>
    `;
}

function addPassengerRow() {
    const passengerForm = document.getElementById('passengerForm');
    const passengerCount = passengerForm.querySelectorAll('.passenger-row').length;
    
    if (passengerCount >= 4) {
        showToast('Maximum 4 passengers allowed per booking', 'error');
        return;
    }

    const passengerRow = document.createElement('div');
    passengerRow.className = 'passenger-row';
    passengerRow.innerHTML = `
        <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" class="form-control" name="passengerName" required>
        </div>
        <div class="form-group">
            <label class="form-label">Age *</label>
            <input type="number" class="form-control" name="passengerAge" min="1" max="120" required>
        </div>
        <div class="form-group">
            <label class="form-label">Gender *</label>
            <select class="form-control" name="passengerGender" required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label">Berth Preference</label>
            <select class="form-control" name="berthPreference">
                <option value="">No Preference</option>
                <option value="Lower">Lower</option>
                <option value="Middle">Middle</option>
                <option value="Upper">Upper</option>
                <option value="Side Lower">Side Lower</option>
                <option value="Side Upper">Side Upper</option>
            </select>
        </div>
        <button type="button" class="remove-passenger" onclick="removePassengerRow(this)">×</button>
    `;

    passengerForm.appendChild(passengerRow);
    updateFareBreakdown();
}

function removePassengerRow(button) {
    const passengerRow = button.closest('.passenger-row');
    passengerRow.remove();
    updateFareBreakdown();
}

function handleBooking(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const bookingBtn = document.querySelector('.book-ticket-btn');
    const btnText = bookingBtn.querySelector('.btn-text');
    const spinner = bookingBtn.querySelector('.loading-spinner');
    
    // Show loading state
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    bookingBtn.disabled = true;
    // Build booking payload
    const passengerRows = document.querySelectorAll('.passenger-row');
    const passengers = [];
    passengerRows.forEach(row => {
        const name = row.querySelector('[name="passengerName"]').value;
        const age = row.querySelector('[name="passengerAge"]').value;
        const gender = row.querySelector('[name="passengerGender"]').value;
        passengers.push({ name, age: parseInt(age), gender, seat: `${selectedTrain.selectedClass}-${Math.floor(Math.random() * 100) + 1}` });
    });

    const payload = {
        userEmail: currentUser ? currentUser.email : 'guest@local',
        train: `${selectedTrain.number} - ${selectedTrain.name}`,
        from: appData.stations.find(s => s.code === selectedTrain.from).name,
        to: appData.stations.find(s => s.code === selectedTrain.to).name,
        date: journeyDate.value,
        class: selectedTrain.selectedClass,
        fare: selectedTrain.fare,
        passengers
    };

    // Call backend if available
    fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        const pnr = data.pnr || generatePNR();

        // Add to local sample bookings for immediate UI
        const booking = Object.assign({ pnr, status: 'Confirmed' }, payload);
        appData.sampleBookings.push(booking);

        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
        bookingBtn.disabled = false;

        showToast(`Booking confirmed! PNR: ${pnr}`, 'success');
        setTimeout(() => showPage('bookings'), 1200);
    })
    .catch(err => {
        // Fallback local behavior
        const pnr = generatePNR();
        const booking = Object.assign({ pnr, status: 'Confirmed' }, payload);
        appData.sampleBookings.push(booking);

        btnText.classList.remove('hidden');
        spinner.classList.add('hidden');
        bookingBtn.disabled = false;

        showToast(`Booking confirmed (local)! PNR: ${pnr}`, 'success');
        setTimeout(() => showPage('bookings'), 1200);
    });
}

function generatePNR() {
    return Math.floor(Math.random() * 9000000000) + 1000000000;
}

function showLoginModal() {
    loginModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideLoginModal() {
    loginModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function toggleAuthForm() {
    const loginFormEl = document.getElementById('loginForm');
    const registerFormEl = document.getElementById('registerForm');
    const modalTitle = document.getElementById('modalTitle');
    const toggleText = document.getElementById('toggleText');
    const toggleForm = document.getElementById('toggleForm');

    if (loginFormEl.classList.contains('hidden')) {
        // Show login form
        loginFormEl.classList.remove('hidden');
        registerFormEl.classList.add('hidden');
        modalTitle.textContent = 'Login';
        toggleText.textContent = "Don't have an account?";
        toggleForm.textContent = 'Register here';
    } else {
        // Show register form
        loginFormEl.classList.add('hidden');
        registerFormEl.classList.remove('hidden');
        modalTitle.textContent = 'Register';
        toggleText.textContent = "Already have an account?";
        toggleForm.textContent = 'Login here';
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    // Call backend login API
    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error('Invalid credentials');
        return res.json();
    })
    .then(user => {
        currentUser = user;
        updateLoginState();
        hideLoginModal();
        showToast('Login successful!', 'success');

        if (pendingBookingTrain) {
            proceedWithBooking(pendingBookingTrain);
            pendingBookingTrain = null;
        }
    })
    .catch(err => {
        // Fallback to local simulation
        currentUser = { email, name: email.split('@')[0] };
        updateLoginState();
        hideLoginModal();
        showToast('Login successful (local)!', 'success');

        if (pendingBookingTrain) {
            proceedWithBooking(pendingBookingTrain);
            pendingBookingTrain = null;
        }
    });
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }
    // Call backend register API
    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    })
    .then(res => {
        if (!res.ok) throw new Error('Registration failed');
        return res.json();
    })
    .then(user => {
        currentUser = user;
        updateLoginState();
        hideLoginModal();
        showToast('Registration successful!', 'success');

        if (pendingBookingTrain) {
            proceedWithBooking(pendingBookingTrain);
            pendingBookingTrain = null;
        }
    })
    .catch(err => {
        // Fallback to local simulation
        currentUser = { email, name };
        updateLoginState();
        hideLoginModal();
        showToast('Registration successful (local)!', 'success');

        if (pendingBookingTrain) {
            proceedWithBooking(pendingBookingTrain);
            pendingBookingTrain = null;
        }
    });
}

function updateLoginState() {
    const loginBtn = document.getElementById('loginBtn');
    
    if (currentUser) {
        loginBtn.textContent = `Hello, ${currentUser.name}`;
    } else {
        loginBtn.textContent = 'Login / Register';
    }
}

function logout() {
    currentUser = null;
    pendingBookingTrain = null;
    updateLoginState();
    showToast('Logged out successfully', 'success');
    showPage('home');
}

function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    
    if (!currentUser) {
        bookingsList.innerHTML = `
            <div class="empty-state">
                <h4>Please login to view bookings</h4>
                <button class="btn btn--primary" onclick="showLoginModal()">Login</button>
            </div>
        `;
        return;
    }
    // If backend available and user logged in, fetch bookings
    if (currentUser && currentUser.email) {
        fetch(`/api/bookings?email=${encodeURIComponent(currentUser.email)}`)
            .then(res => res.json())
            .then(data => {
                const bookings = data.bookings && data.bookings.length ? data.bookings : appData.sampleBookings;
                renderBookings(bookingsList, bookings);
            })
            .catch(() => {
                if (appData.sampleBookings.length === 0) {
                    bookingsList.innerHTML = `
                        <div class="empty-state">
                            <h4>No bookings found</h4>
                            <p>You haven't made any bookings yet.</p>
                            <button class="btn btn--primary" onclick="showPage('home')">Book a Ticket</button>
                        </div>
                    `;
                    return;
                }
                renderBookings(bookingsList, appData.sampleBookings);
            });
        return;
    }

    if (appData.sampleBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="empty-state">
                <h4>No bookings found</h4>
                <p>You haven't made any bookings yet.</p>
                <button class="btn btn--primary" onclick="showPage('home')">Book a Ticket</button>
            </div>
        `;
        return;
    }

    renderBookings(bookingsList, appData.sampleBookings);
}

function renderBookings(container, bookings) {
    container.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <div class="booking-header-info">
                <div class="pnr-info">
                    <h4>PNR: <span class="pnr-number">${booking.pnr}</span></h4>
                    <div>${booking.train}</div>
                </div>
                <div class="booking-status status-${String(booking.status).toLowerCase()}">
                    ${booking.status}
                </div>
            </div>
            
            <div class="journey-info">
                <div class="journey-point">
                    <div class="journey-station">${booking.from}</div>
                    <div class="journey-time">${new Date(booking.date).toLocaleDateString()}</div>
                </div>
                <div class="journey-arrow">→</div>
                <div class="journey-point">
                    <div class="journey-station">${booking.to}</div>
                    <div class="journey-time">${booking.class}</div>
                </div>
            </div>
            
            <div class="booking-actions">
                <button class="btn btn--outline" onclick="viewTicketDetails('${booking.pnr}')">
                    View Details
                </button>
                ${booking.status === 'Confirmed' ? 
                    `<button class="btn btn--secondary" onclick="confirmCancelTicket('${booking.pnr}')">
                        Cancel Ticket
                    </button>` : ''
                }
            </div>
        </div>
    `).join('');
}

function viewTicketDetails(pnr) {
    const booking = appData.sampleBookings.find(b => b.pnr === pnr);
    if (!booking) return;

    const ticketModal = document.getElementById('ticketModal');
    const ticketDetails = document.getElementById('ticketDetails');
    
    ticketDetails.innerHTML = `
        <div class="ticket-info-grid">
            <div class="ticket-info-item">
                <div class="ticket-info-label">PNR Number</div>
                <div class="ticket-info-value">${booking.pnr}</div>
            </div>
            <div class="ticket-info-item">
                <div class="ticket-info-label">Train</div>
                <div class="ticket-info-value">${booking.train}</div>
            </div>
            <div class="ticket-info-item">
                <div class="ticket-info-label">Journey Date</div>
                <div class="ticket-info-value">${new Date(booking.date).toLocaleDateString()}</div>
            </div>
            <div class="ticket-info-item">
                <div class="ticket-info-label">Class</div>
                <div class="ticket-info-value">${booking.class}</div>
            </div>
            <div class="ticket-info-item">
                <div class="ticket-info-label">Status</div>
                <div class="ticket-info-value booking-status status-${booking.status.toLowerCase()}">${booking.status}</div>
            </div>
            <div class="ticket-info-item">
                <div class="ticket-info-label">Total Fare</div>
                <div class="ticket-info-value">₹${booking.fare}</div>
            </div>
        </div>
        
        <div class="passenger-list">
            <h5>Passenger Details</h5>
            ${booking.passengers.map((passenger, index) => `
                <div class="passenger-item">
                    <span>${index + 1}. ${passenger.name} (${passenger.age}/${passenger.gender})</span>
                    <span>${passenger.seat}</span>
                </div>
            `).join('')}
        </div>
    `;

    ticketModal.classList.remove('hidden');
}

function confirmCancelTicket(pnr) {
    if (confirm('Are you sure you want to cancel this ticket? Cancellation charges may apply.')) {
        handleCancelTicket(pnr);
    }
}

function handleCancelTicket(pnr) {
    const bookingIndex = appData.sampleBookings.findIndex(b => b.pnr === pnr);
    if (bookingIndex !== -1) {
        appData.sampleBookings[bookingIndex].status = 'Cancelled';
        loadBookings();
        document.getElementById('ticketModal').classList.add('hidden');
        showToast('Ticket cancelled successfully', 'success');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastClose = toast.querySelector('.toast-close');
    
    // Set message and type
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    
    // Show toast
    toast.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 5000);
    
    // Close on click
    toastClose.onclick = () => {
        toast.classList.add('hidden');
    };
}