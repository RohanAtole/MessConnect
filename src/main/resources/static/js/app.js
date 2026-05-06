document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadStaticPartials();
        initApp();
    } catch (error) {
        console.error(error);
        document.getElementById('app').innerHTML = `
            <main style="min-height: 100vh; display: grid; place-items: center; padding: 24px;">
                <div class="glass-card" style="max-width: 560px; padding: 32px; text-align: center;">
                    <h1>MessConnect could not load</h1>
                    <p style="color: var(--text-muted); margin-top: 12px;">Start the app from Spring Boot or a local web server so the UI modules can be fetched.</p>
                </div>
            </main>
        `;
    }
});

async function loadStaticPartials() {
    const regions = [
        { mount: 'navbar-mount', files: ['partials/navbar.html'] },
        {
            mount: 'main-view',
            files: [
                'views/home.html',
                'views/auth.html',
                'views/discovery.html',
                'views/customer-dashboard.html',
                'views/vendor-dashboard.html',
                'views/admin-dashboard.html'
            ]
        },
        { mount: 'footer-mount', files: ['partials/footer.html'] }
    ];

    for (const region of regions) {
        const mount = document.getElementById(region.mount);
        if (!mount) continue;
        const html = await Promise.all(region.files.map(loadPartial));
        mount.innerHTML = html.join('\n');
    }
}

async function loadPartial(path) {
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`Unable to load UI module: ${path}`);
    }
    return response.text();
}

function initApp() {
    updateNav();
    loadFeaturedMess();
    bindAdminModalForms();
    
    // Handle forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const regForm = document.getElementById('register-form');
    if (regForm) regForm.addEventListener('submit', handleRegister);

    // Default view
    const user = auth.getUser();
    if (user) {
        if (user.role === 'ADMIN') navigateTo('admin-dashboard');
        else if (user.role === 'VENDOR') navigateTo('vendor-dashboard');
        else if (user.role === 'CUSTOMER') navigateTo('home');
    }
}

function updateNav() {
    const user = auth.getUser();
    const authLinks = document.getElementById('auth-links');
    const userLinks = document.getElementById('user-links');
    const dashboardLink = document.getElementById('dashboard-link');

    if (user) {
        authLinks.style.display = 'none';
        userLinks.style.display = 'flex';
        
        let dashboardRoute = 'home';
        if (user.role === 'ADMIN') dashboardRoute = 'admin-dashboard';
        else if (user.role === 'VENDOR') dashboardRoute = 'vendor-dashboard';
        else if (user.role === 'CUSTOMER') dashboardRoute = 'customer-dashboard';
        
        dashboardLink.onclick = () => navigateTo(dashboardRoute);
        dashboardLink.textContent = 'My Dashboard';
    } else {
        authLinks.style.display = 'flex';
        userLinks.style.display = 'none';
    }
}

function navigateTo(viewId) {
    const views = ['home-view', 'login-view', 'register-view', 'discovery-view', 'mess-detail-view', 'customer-dashboard-view', 'vendor-dashboard-view', 'admin-dashboard-view'];
    
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = 'none';
    });

    const target = document.getElementById(viewId + '-view');
    if (target) {
        target.style.display = viewId.includes('dashboard') ? 'grid' : 'block';
    }

    if (viewId === 'home') loadFeaturedMess();
    if (viewId === 'discovery') loadAllMess();
    if (viewId === 'customer-dashboard') {
        loadCustomerData();
        switchCustomerSection('subs');
    }
    if (viewId === 'vendor-dashboard') {
        loadVendorData();
        switchVendorSection('analytics');
    }
    if (viewId === 'admin-dashboard') {
        loadAdminData();
        switchAdminSection('overview');
    }
    
    window.scrollTo(0, 0);
}

// --- Sections Switching ---

function switchAdminSection(section) {
    const sections = ['admin-overview', 'admin-vendors', 'admin-users', 'admin-settings'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById('admin-' + section);
    if (target) target.style.display = 'block';
    setDashboardActiveItem('admin-dashboard-view', section);
    
    if (section === 'vendors') loadAllVendors();
    if (section === 'users') loadAllUsers();
    if (section === 'settings') loadAdminSettings();
}

function switchCustomerSection(section) {
    const sections = ['customer-subs', 'customer-discover', 'customer-payments', 'customer-profile'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById('customer-' + section);
    if (target) target.style.display = 'block';
    setDashboardActiveItem('customer-dashboard-view', section);
    
    if (section === 'discover') loadAvailablePlansForCustomer();
    if (section === 'payments') loadCustomerPayments();
    if (section === 'profile') loadCustomerProfile();
}

async function loadCustomerPayments() {
    const user = auth.getUser();
    try {
        const payments = await api.get(`/payments/customer/${user.id}`);
        const list = document.getElementById('c-payment-list');
        list.innerHTML = payments.map(p => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 15px;">INR ${p.amount}</td>
                <td style="padding: 15px;">${p.paymentMethod}</td>
                <td style="padding: 15px;"><span class="badge ${p.status}">${p.status}</span></td>
                <td style="padding: 15px;">${new Date(p.paymentDate).toLocaleDateString()}</td>
                <td style="padding: 15px;">
                    ${p.status === 'SUCCESS' ? `<button onclick="downloadInvoice(${p.id})" class="btn btn-primary" style="padding: 6px 12px; font-size: 11px;"><i class="fas fa-file-invoice"></i> Invoice</button>` : ''}
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No payments found.</td></tr>';
    } catch (error) { console.error(error); }
}

async function downloadInvoice(paymentId) {
    try {
        const user = auth.getUser();
        const payments = await api.get(`/payments/customer/${user.id}`);
        const p = payments.find(pay => pay.id === paymentId);
        
        if (!p || !p.subscription) {
            alert('Invoice details are only available for successful subscriptions.');
            return;
        }

        const vendor = p.subscription.plan.vendor;
        const customer = p.customer;
        const plan = p.subscription.plan;

        const invoiceHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice - ${p.transactionId}</title>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
                    .invoice-container { max-width: 800px; margin: auto; }
                    .invoice-header { display: flex; justify-content: space-between; border-bottom: 3px solid #f4f4f4; padding-bottom: 30px; margin-bottom: 30px; }
                    .brand-name { font-size: 32px; font-weight: 800; color: #ff4d4d; letter-spacing: -1px; }
                    .invoice-info { text-align: right; }
                    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin: 40px 0; }
                    .section-label { font-weight: 700; text-transform: uppercase; font-size: 11px; color: #888; margin-bottom: 8px; letter-spacing: 1px; }
                    .detail-name { font-weight: 700; font-size: 18px; margin-bottom: 4px; }
                    table { width: 100%; border-collapse: collapse; margin: 40px 0; }
                    th { text-align: left; background: #fafafa; padding: 15px; font-weight: 700; border-bottom: 2px solid #eee; }
                    td { padding: 15px; border-bottom: 1px solid #eee; }
                    .total-box { background: #fdfdfd; padding: 20px; border-radius: 12px; margin-left: auto; width: fit-content; min-width: 250px; border: 1px solid #eee; }
                    .total-row { display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; color: #ff4d4d; }
                    .footer { margin-top: 80px; text-align: center; color: #aaa; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
                    .no-print { position: fixed; top: 20px; right: 20px; z-index: 100; }
                    @media print { .no-print { display: none; } body { padding: 0; } }
                </style>
            </head>
            <body>
                <div class="no-print">
                    <button onclick="window.print()" style="padding: 12px 24px; background: #ff4d4d; color: white; border: none; border-radius: 8px; cursor: pointer; font-family: inherit; font-weight: 600; box-shadow: 0 4px 12px rgba(255,77,77,0.3);">Print / Save PDF</button>
                </div>
                <div class="invoice-container">
                    <div class="invoice-header">
                        <div>
                            <div class="brand-name">MessConnect</div>
                            <div style="color: #666;">Transaction ID: ${p.transactionId}</div>
                        </div>
                        <div class="invoice-info">
                            <div style="font-size: 24px; font-weight: 700; margin-bottom: 5px;">INVOICE</div>
                            <div>Date: ${new Date(p.paymentDate).toLocaleDateString()}</div>
                            <div style="color: #22c55e; font-weight: 600;">Status: Paid</div>
                        </div>
                    </div>

                    <div class="details-grid">
                        <div>
                            <div class="section-label">Service Provider (Vendor)</div>
                            <div class="detail-name">${vendor.messName}</div>
                            <div>${vendor.ownerName}</div>
                            <div style="font-size: 14px; color: #555;">${vendor.address}</div>
                            <div style="margin-top: 10px;">${vendor.phone}</div>
                            <div>${vendor.email}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="section-label">Billed To (Customer)</div>
                            <div class="detail-name">${customer.name}</div>
                            <div>${customer.phone || 'N/A'}</div>
                            <div>${customer.email}</div>
                            <div style="max-width: 280px; margin-left: auto; font-size: 14px; color: #555; margin-top: 5px;">${customer.address || ''}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Subscription Plan</th>
                                <th>Duration</th>
                                <th>Meals/Day</th>
                                <th style="text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div style="font-weight: 700;">${plan.name}</div>
                                    <div style="font-size: 12px; color: #777; margin-top: 4px;">Period: ${new Date(p.subscription.startDate).toLocaleDateString()} - ${new Date(p.subscription.endDate).toLocaleDateString()}</div>
                                </td>
                                <td>${plan.duration} Days</td>
                                <td>${plan.mealsPerDay}</td>
                                <td style="text-align: right; font-weight: 600;">INR ${p.amount}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="total-box">
                        <div style="font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 5px;">Total Amount Paid</div>
                        <div class="total-row">
                            <span>Grand Total</span>
                            <span>INR ${p.amount}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>Enjoy your meals! This is a digital receipt generated by MessConnect.</p>
                        <p>&copy; ${new Date().getFullYear()} MessConnect Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    } catch (error) {
        console.error(error);
        alert('Failed to generate invoice. Please try again.');
    }
}

function switchVendorSection(section) {
    const sections = ['vendor-analytics', 'vendor-menu', 'vendor-plans', 'vendor-attendance', 'vendor-settings'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = 'none';
    });
    const target = document.getElementById(`vendor-${section}`);
    if (target) target.style.display = 'block';
    setDashboardActiveItem('vendor-dashboard-view', section);
    
    if (section === 'menu') loadVendorMenu();
    if (section === 'plans') loadVendorPlans();
    if (section === 'attendance') loadVendorAttendance();
    if (section === 'settings') loadVendorSettings();
}

function setDashboardActiveItem(viewId, section) {
    const view = document.getElementById(viewId);
    if (!view) return;
    view.querySelectorAll('.sidebar-menu a, .sidebar-item').forEach(item => {
        const target = item.getAttribute('onclick') || '';
        item.classList.toggle('active', target.includes(`'${section}'`));
    });
}

// --- Home & Discovery ---

async function loadFeaturedMess() {
    try {
        const grid = document.getElementById('featured-grid');
        if (!grid) return;
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading messes...</div>';
        
        const messes = await api.get('/vendors/public/list');
        if (!messes || messes.length === 0) {
            grid.innerHTML = '<div class="glass-card" style="padding: 40px; text-align: center; grid-column: 1/-1;">No approved messes found.</div>';
            return;
        }
        grid.innerHTML = messes.slice(0, 3).map(v => createMessCard(v)).join('');
    } catch (error) {
        console.error('Failed to load featured mess', error);
        const grid = document.getElementById('featured-grid');
        if (grid) grid.innerHTML = getFallbackMessCards();
    }
}

async function loadAllMess() {
    try {
        const grid = document.getElementById('all-mess-grid');
        if (!grid) return;
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading...</div>';

        const messes = await api.get('/vendors/public/list');
        grid.innerHTML = messes.map(v => createMessCard(v)).join('');
    } catch (error) {
        console.error('Failed to load all mess', error);
        const grid = document.getElementById('all-mess-grid');
        if (grid) grid.innerHTML = getFallbackMessCards();
    }
}

function createMessCard(v) {
    const image = v.image || 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=500';
    return `
        <div class="glass-card mess-card" onclick="viewMessDetails(${v.id})">
            <img src="${image}" alt="${v.messName}">
            <div class="mess-info">
                <h3>${v.messName}</h3>
                <p>${v.description || 'Quality meals provided daily.'}</p>
                <div class="mess-footer">
                    <span class="rating">★ 4.5</span>
                    <button class="btn btn-primary" style="padding: 5px 15px; font-size: 12px;">Details</button>
                </div>
            </div>
        </div>
    `;
}

function getFallbackMessCards() {
    const fallbackMesses = [
        {
            id: 1,
            messName: 'Healthy Bites Mess',
            description: 'Balanced student meals with fresh tiffin-style comfort food.',
            image: 'assets/hero.png'
        },
        {
            id: 2,
            messName: 'Royal Tiffin',
            description: 'Premium homestyle lunch and dinner plans for busy weekdays.',
            image: 'assets/bg.png'
        },
        {
            id: 3,
            messName: 'Campus Curry Co.',
            description: 'North Indian, South Indian, and light meal subscriptions.',
            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=700'
        }
    ];

    return fallbackMesses.map(v => `
        <div class="glass-card mess-card">
            <img src="${v.image}" alt="${v.messName}">
            <div class="mess-info">
                <h3>${v.messName}</h3>
                <p>${v.description}</p>
                <div class="mess-footer">
                    <span class="rating">★ Demo</span>
                    <button class="btn btn-primary" style="padding: 5px 15px; font-size: 12px;">Preview</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function viewMessDetails(id) {
    if (!auth.isLoggedIn()) { alert('Please login first.'); navigateTo('login'); return; }
    try {
        const m = await api.get(`/vendors/public/${id}`);
        const plans = await api.get(`/vendors/public/${id}/plans`);
        const menu = await api.get(`/vendors/public/${id}/menu`);
        
        navigateTo('mess-detail');
        const detail = document.getElementById('mess-detail-content');
        detail.innerHTML = `
            <div class="glass-card" style="padding: 40px;">
                <h1>${m.messName}</h1>
                <p style="color: var(--text-muted); margin-top: 10px;">${m.address}</p>
                <div style="margin-top: 30px; display: grid; grid-template-columns: 2fr 1fr; gap: 30px;">
                    <div>
                        <h3>Description</h3>
                        <p>${m.description || 'No description.'}</p>
                        <h3 style="margin-top: 30px;">Today's Menu</h3>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${menu.map(item => `<div class="glass-card" style="padding: 10px; font-size: 13px;"><b>${item.menuDay}:</b> ${item.breakfast} | ${item.lunch} | ${item.dinner}</div>`).join('')}
                        </div>
                    </div>
                    <div>
                        <h3>Subscription Plans</h3>
                        ${plans.map(p => `
                            <div class="glass-card" style="padding: 15px; margin-top: 10px;">
                                <h4>${p.name}</h4>
                                <p style="font-weight: 700;">INR ${p.price}</p>
                                <button class="btn btn-primary" onclick="subscribe(${p.id})" title="Subscribe to this plan" style="width: 100%; margin-top: 10px;">Join Now</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
        const grid = document.getElementById('c-available-plans');
        if (grid) {
            grid.innerHTML = `
                <div class="glass-card mess-card">
                    <img src="assets/hero.png" alt="Healthy Bites Mess">
                    <div class="mess-info">
                        <h3>Healthy Bites Mess</h3>
                        <p>Monthly Special - INR 3000</p>
                        <button class="btn btn-primary" style="margin-top: 10px;">Preview Plan</button>
                    </div>
                </div>
                <div class="glass-card mess-card">
                    <img src="assets/bg.png" alt="Royal Tiffin">
                    <div class="mess-info">
                        <h3>Royal Tiffin</h3>
                        <p>Home Style Plan - INR 2800</p>
                        <button class="btn btn-primary" style="margin-top: 10px;">Preview Plan</button>
                    </div>
                </div>
                <div class="glass-card mess-card">
                    <img src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&q=80&w=700" alt="Campus Curry Co.">
                    <div class="mess-info">
                        <h3>Campus Curry Co.</h3>
                        <p>Student Saver - INR 2400</p>
                        <button class="btn btn-primary" style="margin-top: 10px;">Preview Plan</button>
                    </div>
                </div>
            `;
        }
    }
}

// --- Customer Logic ---

async function loadCustomerData() {
    const user = auth.getUser();
    try {
        const subs = await api.get(`/subscriptions/customer/${user.id}`);
        document.getElementById('user-display-name').textContent = user.name;
        document.getElementById('stat-active-subs').textContent = subs.filter(s => s.status === 'ACTIVE').length;
        document.getElementById('stat-total-spent').textContent = 'INR ' + subs.reduce((sum, s) => sum + s.plan.price, 0);
        
        const subList = document.getElementById('subscription-list');
        subList.innerHTML = subs.map(s => `
            <div class="glass-card" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                <div><b>${s.plan.vendor.messName}</b> - ${s.plan.name}</div>
                <div class="badge ${s.status}">${s.status}</div>
            </div>
        `).join('') || '<p>No active plans.</p>';
    } catch (error) { console.error(error); }
}

async function loadAvailablePlansForCustomer() {
    try {
        const vendors = await api.get('/vendors/public/list');
        const grid = document.getElementById('c-available-plans');
        grid.innerHTML = '';
        for (const v of vendors) {
            const plans = await api.get(`/vendors/public/${v.id}/plans`);
            plans.forEach(p => {
                grid.innerHTML += `
                    <div class="glass-card" style="padding: 15px; text-align: center;">
                        <h4>${v.messName}</h4>
                        <p>${p.name} - INR ${p.price}</p>
                        <button onclick="subscribe(${p.id})" class="btn btn-primary" title="Subscribe to this plan" style="margin-top: 10px;">Join</button>
                    </div>
                `;
            });
        }
    } catch (error) { console.error(error); }
}

async function subscribe(planId) {
    const user = auth.getUser();
    if (!user) {
        alert('Please login to subscribe.');
        navigateTo('login');
        return;
    }

    try {
        // 1. Create order on backend
        const orderData = await api.post(`/payments/create-order?planId=${planId}&customerId=${user.id}`, {});
        
        // 2. Configure Razorpay options
        const options = {
            "key": orderData.key,
            "amount": orderData.amount,
            "currency": "INR",
            "name": "MessConnect",
            "description": "Subscription Payment",
            "order_id": orderData.orderId,
            "handler": async function (response) {
                // 3. Verify payment on backend
                try {
                    await api.post(`/payments/verify-payment?customerId=${user.id}&planId=${planId}`, {
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                    });
                    alert('Payment successful! Subscription activated.');
                    navigateTo('customer-dashboard');
                } catch (error) {
                    alert('Payment verification failed: ' + error.message);
                }
            },
            "prefill": {
                "name": user.name,
                "email": user.email,
                "contact": user.phone || ""
            },
            "theme": {
                "color": "#ff4d4d"
            }
        };

        // 3. Open Razorpay Checkout
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
            alert('Payment failed: ' + response.error.description);
        });
        rzp.open();

    } catch (error) {
        alert('Failed to initiate payment: ' + error.message);
    }
}


// --- Vendor Logic ---

async function loadVendorData() {
    const user = auth.getUser();
    try {
        const vendor = await api.get(`/vendors/public/${user.id}`);
        document.getElementById('vendor-display-name').textContent = vendor.messName;
        
        const subs = await api.get(`/subscriptions/vendor/${user.id}`);

        document.getElementById('v-stat-subs').textContent = subs.length;
        document.getElementById('v-stat-rev').textContent = 'INR ' + subs.reduce((sum, s) => sum + s.plan.price, 0);
        
        const tbody = document.getElementById('v-recent-subs');
        tbody.innerHTML = subs.map(s => `
            <tr>
                <td style="padding: 10px;">${s.customer.name}</td>
                <td style="padding: 10px;">${s.plan.name}</td>
                <td style="padding: 10px;">INR ${s.plan.price}</td>
                <td style="padding: 10px;">${new Date(s.startDate).toLocaleDateString()}</td>
                <td style="padding: 10px;"><span class="badge ${s.status}">${s.status}</span></td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No subscribers found yet.</td></tr>';
    } catch (error) { console.error(error); }
}

async function loadVendorMenu() {
    const user = auth.getUser();
    const menu = await api.get(`/vendors/public/${user.id}/menu`);
    const list = document.getElementById('v-menu-list');
    list.innerHTML = menu.map(m => `
        <div class="glass-card" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div><b>${m.menuDay}:</b> ${m.breakfast} | ${m.lunch} | ${m.dinner}</div>
            <div style="display: flex; gap: 10px;">
                <button onclick="editMenu(${m.id})" class="btn btn-outline" style="padding: 5px 10px; border-color: rgba(255,255,255,0.1);"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="deleteMenu(${m.id})" class="btn btn-outline" title="Delete menu item" style="padding: 5px 10px; color: #fecaca; border-color: rgba(239, 68, 68, 0.45);"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `).join('') || '<p>No menu items.</p>';
}

async function loadVendorPlans() {
    const user = auth.getUser();
    const plans = await api.get(`/vendors/public/${user.id}/plans`);
    const list = document.getElementById('v-plan-list');
    list.innerHTML = plans.map(p => `
        <div class="glass-card" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div><b>${p.name}</b> - INR ${p.price} (${p.duration} days)</div>
            <div style="display: flex; gap: 10px;">
                <button onclick="viewPlanDetails(${p.id})" class="btn btn-outline" style="padding: 5px 10px; border-color: rgba(255,255,255,0.1);" title="See active subscribers for this plan"><i class="fas fa-users"></i> Details</button>
                <button onclick="editPlan(${p.id})" class="btn btn-outline" style="padding: 5px 10px; border-color: rgba(255,255,255,0.1);"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="deletePlan(${p.id})" class="btn btn-outline" title="Delete plan" style="padding: 5px 10px; color: #fecaca; border-color: rgba(239, 68, 68, 0.45);"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `).join('') || '<p>No plans.</p>';
}

async function loadVendorAttendance() {
    const user = auth.getUser();
    try {
        const subs = await api.get(`/subscriptions/vendor/${user.id}`);
        const tbody = document.getElementById('v-attendance-list');
        
        if (!subs || subs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No active subscribers to track.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        for (const s of subs) {
            let historyHtml = '<div style="font-size: 11px; color: #999;">Loading history...</div>';
            
            // Build the initial row
            const rowId = `att-row-${s.id}`;
            tbody.innerHTML += `
                <tr id="${rowId}" style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px;">
                        <div style="font-weight: 600;">${s.customer.name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${s.customer.email}</div>
                    </td>
                    <td style="padding: 15px;">${s.plan.name}</td>
                    <td style="padding: 15px;" id="att-calendar-cell-${s.id}">
                        <div>${new Date(s.endDate).toLocaleDateString()}</div>
                        ${historyHtml}
                    </td>
                    <td style="padding: 15px;">
                        <div style="display: flex; gap: 5px;">
                            <button onclick="markAttendance(${s.id}, 'TAKEN')" class="btn btn-primary" title="Mark meal as taken" style="padding: 6px 10px; font-size: 11px;">Present</button>
                            <button onclick="markAttendance(${s.id}, 'MISSED')" class="btn btn-outline" title="Mark missed and extend subscription by one day" style="padding: 6px 10px; font-size: 11px; color: #fecaca; border-color: rgba(239, 68, 68, 0.6);">Absent</button>
                        </div>
                    </td>
                </tr>
            `;

            // Fetch history asynchronously to not block the UI if one fails
            fetchAttendanceForStudent(s.id);
        }
    } catch (error) {
        console.error('Attendance Load Error:', error);
    }
}

async function fetchAttendanceForStudent(subId) {
    try {
        const attendance = await api.get(`/vendors/attendance/${subId}`);
        const historyHtml = generateAttendanceCalendar(attendance);
        const cell = document.getElementById(`att-calendar-cell-${subId}`);
        if (cell) {
            const dateStr = cell.querySelector('div').textContent;
            cell.innerHTML = `<div>${dateStr}</div>${historyHtml}`;
        }
    } catch (e) {
        console.error('Failed to load history for ' + subId, e);
        const cell = document.getElementById(`att-calendar-cell-${subId}`);
        if (cell) cell.innerHTML = `<div>${cell.querySelector('div').textContent}</div><div style="font-size: 10px; color: var(--danger);">History unavailable</div>`;
    }
}

function generateAttendanceCalendar(history) {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    let html = '<div class="attendance-calendar">';
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // Handle potential array or string date formats from Java
        const record = history.find(h => {
            let hDate = h.date;
            if (Array.isArray(hDate)) {
                hDate = `${hDate[0]}-${String(hDate[1]).padStart(2, '0')}-${String(hDate[2]).padStart(2, '0')}`;
            }
            return hDate === dateStr;
        });

        let statusClass = '';
        if (record) {
            statusClass = record.status === 'TAKEN' ? 'taken' : 'missed';
        }
        if (i === today.getDate()) statusClass += ' today';
        
        html += `<div class="calendar-day ${statusClass}" title="${dateStr}">${i}</div>`;
    }
    html += '</div>';
    return html;
}

async function markAttendance(subId, status) {
    try {
        await api.post(`/vendors/attendance/mark?subscriptionId=${subId}&status=${status}`, {});
        alert(status === 'MISSED' ? 'Marked Absent. Plan extended by 1 day!' : 'Attendance marked!');
        loadVendorAttendance();
    } catch (error) { alert(error.message); }
}

// --- Admin Logic ---

async function loadAdminData() {
    try {
        const stats = await api.get('/admin/stats');
        document.getElementById('a-stat-vendors').innerText = stats.totalVendors;
        document.getElementById('a-stat-customers').innerText = stats.totalCustomers;
        document.getElementById('a-stat-pending').innerText = stats.pendingVendors;

        const pending = await api.get('/admin/vendors/pending');
        const list = document.getElementById('pending-vendors-list');
        list.innerHTML = pending.map(v => `
            <div class="glass-card" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between;">
                <div><b>${v.messName}</b> (${v.ownerName})</div>
                <div>
                    <button onclick="approveVendor(${v.id})" class="btn btn-primary">Approve</button>
                    <button onclick="rejectVendor(${v.id})" class="btn btn-outline" title="Reject vendor" style="color: #fecaca; border-color: rgba(239, 68, 68, 0.45);">Reject</button>
                </div>
            </div>
        `).join('') || '<p>No pending vendors.</p>';
    } catch (error) { console.error(error); }
}

async function approveVendor(id) {
    await api.put(`/admin/vendors/${id}/approve`, {});
    loadAdminData();
}

async function rejectVendor(id) {
    await api.put(`/admin/vendors/${id}/reject`, {});
    loadAdminData();
}

async function loadAllVendors() {
    try {
        const vendors = await api.get('/admin/vendors/all');
        const tbody = document.getElementById('a-all-vendors-list');
        tbody.innerHTML = vendors.map(v => `
            <tr>
                <td style="padding: 10px;">${v.messName}</td>
                <td style="padding: 10px;">${v.ownerName}</td>
                <td style="padding: 10px;"><span class="badge ${v.status}">${v.status}</span></td>
                <td style="padding: 10px;">${new Date(v.createdAt).toLocaleDateString()}</td>
                <td style="padding: 10px;">
                    <button onclick="openEditVendorModal(${v.id})" class="btn btn-primary" title="Edit vendor" style="padding: 5px 10px;">Edit</button>
                    <button onclick="deleteVendor(${v.id})" class="btn btn-outline" title="Delete vendor" style="padding: 5px 10px; color: #fecaca; border-color: rgba(239, 68, 68, 0.45);">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (error) { console.error(error); }
}

async function loadAllUsers() {
    try {
        const data = await api.get('/admin/users/all');
        const list = document.getElementById('a-user-list');
        
        let html = '<h4>Customers</h4><table style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead><tr style="text-align: left; border-bottom: 1px solid #eee;"><th style="padding: 10px;">Name</th><th style="padding: 10px;">Email</th><th style="padding: 10px;">Action</th></tr></thead><tbody>';
        html += data.customers.map(c => `
            <tr>
                <td style="padding: 10px;">${c.name}</td>
                <td style="padding: 10px;">${c.email}</td>
                <td style="padding: 10px;">
                    <button onclick="openEditCustomerModal(${c.id})" class="btn btn-primary" title="Edit customer" style="padding: 5px 10px;">Edit</button>
                    <button onclick="deleteCustomer(${c.id})" class="btn btn-outline" title="Delete customer" style="padding: 5px 10px; color: #fecaca; border-color: rgba(239, 68, 68, 0.45);">Delete</button>
                </td>
            </tr>
        `).join('');
        html += '</tbody></table>';

        html += '<h4 style="margin-top: 30px;">Administrators</h4><ul>';
        html += data.admins.map(a => `<li>${a.email}</li>`).join('');
        html += '</ul>';

        list.innerHTML = html;
    } catch (error) { console.error(error); }
}

async function loadAdminSettings() {
    const user = auth.getUser();
    document.getElementById('as-email').value = user.email;
    document.getElementById('admin-settings-form').onsubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/admin/profile/${user.id}`, { email: document.getElementById('as-email').value });
            alert('Settings updated!');
        } catch (error) { alert(error.message); }
    };
}

// --- Modals ---

function openEditVendorModal(id) {
    api.get(`/vendors/public/${id}`).then(v => {
        document.getElementById('ev-id').value = v.id;
        document.getElementById('ev-mess-name').value = v.messName;
        document.getElementById('ev-owner-name').value = v.ownerName;
        document.getElementById('ev-email').value = v.email;
        document.getElementById('ev-phone').value = v.phone;
        document.getElementById('ev-address').value = v.address;
        document.getElementById('edit-vendor-modal').style.display = 'flex';
    });
}

function bindAdminModalForms() {
    const editVendorForm = document.getElementById('edit-vendor-form');
    if (editVendorForm) {
        editVendorForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('ev-id').value;
            const data = {
                messName: document.getElementById('ev-mess-name').value,
                ownerName: document.getElementById('ev-owner-name').value,
                email: document.getElementById('ev-email').value,
                phone: document.getElementById('ev-phone').value,
                address: document.getElementById('ev-address').value
            };
            try {
                await api.put(`/admin/vendors/${id}`, data);
                alert('Vendor updated!');
                closeModal('edit-vendor-modal');
                loadAllVendors();
            } catch (error) { alert(error.message); }
        };
    }

    const editCustomerForm = document.getElementById('edit-customer-form');
    if (editCustomerForm) {
        editCustomerForm.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('ec-id').value;
            const data = {
                name: document.getElementById('ec-name').value,
                email: document.getElementById('ec-email').value,
                phone: document.getElementById('ec-phone').value,
                address: document.getElementById('ec-address').value
            };
            try {
                await api.put(`/admin/customers/${id}`, data);
                alert('Customer updated!');
                closeModal('edit-customer-modal');
                loadAllUsers();
            } catch (error) { alert(error.message); }
        };
    }
}

function openEditCustomerModal(id) {
    api.get(`/customers/${id}`).then(c => {
        document.getElementById('ec-id').value = c.id;
        document.getElementById('ec-name').value = c.name;
        document.getElementById('ec-email').value = c.email;
        document.getElementById('ec-phone').value = c.phone;
        document.getElementById('ec-address').value = c.address;
        document.getElementById('edit-customer-modal').style.display = 'flex';
    });
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

async function deleteVendor(id) {
    if (confirm('Delete vendor?')) {
        await api.delete(`/admin/vendors/${id}`);
        loadAllVendors();
    }
}

async function deleteCustomer(id) {
    if (confirm('Delete customer?')) {
        await api.delete(`/admin/customers/${id}`);
        loadAllUsers();
    }
}

// --- Common Logic ---

async function handleLogin(e) {
    e.preventDefault();
    try {
        const user = await auth.login(document.getElementById('login-email').value, document.getElementById('login-password').value);
        updateNav();
        if (user.role === 'ADMIN') navigateTo('admin-dashboard');
        else if (user.role === 'VENDOR') navigateTo('vendor-dashboard');
        else navigateTo('home');
    } catch (error) { alert(error.message); }
}

async function handleRegister(e) {
    e.preventDefault();
    const role = document.getElementById('reg-role').value;
    const userData = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        phone: document.getElementById('reg-phone').value,
        address: document.getElementById('reg-address').value,
        role: role
    };
    if (role === 'VENDOR') {
        userData.messName = document.getElementById('reg-mess-name').value;
        userData.description = document.getElementById('reg-description').value;
    }
    try {
        await auth.register(userData);
        alert('Success! Please login.');
        navigateTo('login');
    } catch (error) { alert(error.message); }
}

function logout() { auth.logout(); updateNav(); navigateTo('home'); }

function toggleVendorFields() {
    document.getElementById('vendor-fields').style.display = document.getElementById('reg-role').value === 'VENDOR' ? 'block' : 'none';
}

async function loadCustomerProfile() {
    const user = auth.getUser();
    if (!user) return;
    try {
        const customer = await api.get(`/customers/${user.id}`);
        document.getElementById('cp-name').value = customer.name || user.name || '';
        document.getElementById('cp-phone').value = customer.phone || '';
        document.getElementById('cp-address').value = customer.address || '';
        if (customer.profileImage) {
            document.getElementById('cp-image-base64').value = customer.profileImage;
            document.getElementById('cp-image-preview').innerHTML = `<img src="${customer.profileImage}" alt="Profile preview" style="max-width: 120px; border-radius: 12px; border: 1px solid var(--glass-border);">`;
        }
        document.getElementById('customer-profile-form').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('cp-name').value,
                phone: document.getElementById('cp-phone').value,
                address: document.getElementById('cp-address').value,
                profileImage: document.getElementById('cp-image-base64').value
            };
            await api.put(`/customers/${user.id}`, data);
            alert('Profile updated!');
        };
    } catch (error) {
        console.error(error);
    }
}

function previewCustomerImage(input) {
    previewImage(input, 'cp-image-base64', 'cp-image-preview');
}

function previewVendorImage(input) {
    previewImage(input, 'vs-image-base64', 'vs-image-preview');
}

function previewImage(input, hiddenId, previewId) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById(hiddenId).value = reader.result;
        document.getElementById(previewId).innerHTML = `<img src="${reader.result}" alt="Image preview" style="max-width: 140px; border-radius: 12px; border: 1px solid var(--glass-border);">`;
    };
    reader.readAsDataURL(file);
}

// Vendor Helpers
function showAddMenuModal() {
    const day = prompt("Day:");
    const b = prompt("Breakfast:");
    const l = prompt("Lunch:");
    const d = prompt("Dinner:");
    if (day) api.post(`/vendors/${auth.getUser().id}/menu`, { menuDay: day, breakfast: b, lunch: l, dinner: d }).then(() => loadVendorMenu());
}

function showAddPlanModal() {
    const n = prompt("Plan Name:");
    const p = prompt("Price:");
    const d = prompt("Duration:");
    const m = prompt("Meals:");
    if (n) api.post(`/vendors/${auth.getUser().id}/plans`, { name: n, price: p, duration: d, mealsPerDay: m }).then(() => loadVendorPlans());
}

function editMenu(id) {
    const user = auth.getUser();
    api.get(`/vendors/public/${user.id}/menu`).then(menu => {
        const item = menu.find(m => m.id === id);
        if (!item) return;
        
        const day = prompt("Day:", item.menuDay);
        const b = prompt("Breakfast:", item.breakfast);
        const l = prompt("Lunch:", item.lunch);
        const d = prompt("Dinner:", item.dinner);
        
        if (day) {
            api.post(`/vendors/${user.id}/menu`, { id: id, menuDay: day, breakfast: b, lunch: l, dinner: d })
               .then(() => loadVendorMenu());
        }
    });
}

function editPlan(id) {
    const user = auth.getUser();
    api.get(`/vendors/public/${user.id}/plans`).then(plans => {
        const item = plans.find(p => p.id === id);
        if (!item) return;

        const n = prompt("Plan Name:", item.name);
        const p = prompt("Price:", item.price);
        const d = prompt("Duration (days):", item.duration);
        const m = prompt("Meals per day:", item.mealsPerDay);

        if (n) {
            api.post(`/vendors/${user.id}/plans`, { id: id, name: n, price: p, duration: d, mealsPerDay: m })
               .then(() => loadVendorPlans());
        }
    });
}

async function viewPlanDetails(id) {
    const user = auth.getUser();
    try {
        const subs = await api.get(`/subscriptions/vendor/${user.id}`);
        const planSubs = subs.filter(s => s.plan.id === id);
        
        let message = `Subscribers for this plan (${planSubs.length}):\n\n`;
        if (planSubs.length === 0) {
            message += "No active subscribers for this plan.";
        } else {
            planSubs.forEach((s, i) => {
                message += `${i+1}. ${s.customer.name} (${s.customer.email}) - Ends: ${new Date(s.endDate).toLocaleDateString()}\n`;
            });
        }
        alert(message);
    } catch (e) { console.error(e); }
}

function deleteMenu(id) { if(confirm('Delete this menu item?')) api.delete(`/vendors/menu/${id}`).then(() => loadVendorMenu()); }
function deletePlan(id) { if(confirm('Delete this plan?')) api.delete(`/vendors/plans/${id}`).then(() => loadVendorPlans()); }

async function loadVendorSettings() {
    const user = auth.getUser();
    const v = await api.get(`/vendors/public/${user.id}`);
    document.getElementById('vs-mess-name').value = v.messName;
    document.getElementById('vs-owner-name').value = v.ownerName;
    document.getElementById('vs-description').value = v.description;
    document.getElementById('vs-phone').value = v.phone;
    document.getElementById('vs-address').value = v.address;
    if (v.image) {
        document.getElementById('vs-image-base64').value = v.image;
        document.getElementById('vs-image-preview').innerHTML = `<img src="${v.image}" alt="Mess preview" style="max-width: 140px; border-radius: 12px; border: 1px solid var(--glass-border);">`;
    }
    document.getElementById('vendor-settings-form').onsubmit = (e) => {
        e.preventDefault();
        const data = {
            messName: document.getElementById('vs-mess-name').value,
            ownerName: document.getElementById('vs-owner-name').value,
            description: document.getElementById('vs-description').value,
            phone: document.getElementById('vs-phone').value,
            address: document.getElementById('vs-address').value,
            image: document.getElementById('vs-image-base64').value
        };
        api.put(`/vendors/${user.id}`, data).then(() => { alert('Updated!'); loadVendorData(); });
    };
}
