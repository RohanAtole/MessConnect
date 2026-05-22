# MessConnect - The "Zomato" for Mess Services

![MessConnect Banner](assets/thumbnail.png)

MessConnect is a comprehensive, enterprise-grade Mess Management System designed to bridge the gap between mess vendors and customers. It streamlines mess operations, subscription management, and payment processing, providing a modern experience similar to top-tier food-tech platforms.

## 🚀 Features

### 👤 User Roles
- **Admin:** System-wide oversight, vendor approval/onboarding, and overall platform management.
- **Vendor:** Dashboard for managing menus, subscription plans, tracking customer attendance, and viewing revenue analytics.
- **Customer:** Discover messes, subscribe to meal plans, track daily attendance, make secure payments, and manage profile.

### 🛠️ Core Functionality
- **Subscription Management:** Flexible plans (Monthly, Weekly) with automated tracking.
- **Secure Payments:** Integrated with **Razorpay** for seamless transactions and invoice generation.
- **Attendance Tracking:** Visual calendar-based meal attendance tracking for customers.
- **Vendor Analytics:** Data-driven insights for vendors to monitor their business growth.
- **Security:** Robust JWT-based authentication and Role-Based Access Control (RBAC).
- **Responsive Design:** A premium, modern UI built with high-quality aesthetics, gradients, and micro-animations.

## 💻 Tech Stack

- **Backend:** 
  - Java 17
  - Spring Boot 3.2.3
  - Spring Security (JWT)
  - Spring Data JPA
- **Frontend:**
  - Modern HTML5 & CSS3 (Custom Design System)
  - Vanilla JavaScript (Asynchronous Fetch API)
- **Database:**
  - H2 (In-memory for development)
  - MySQL (Ready for production)
- **Integration:**
  - Razorpay Payment Gateway SDK
- **Build Tool:**
  - Maven

## 📂 Project Structure

```text
messconnect/
├── src/main/java/com/messconnect/
│   ├── controller/      # REST API Endpoints
│   ├── entity/          # JPA Entities (Database Models)
│   ├── repository/      # Data Access Layer
│   ├── service/         # Business Logic
│   ├── security/        # JWT & Security Configuration
│   └── dto/             # Data Transfer Objects
├── src/main/resources/
│   ├── static/          # Frontend (HTML, CSS, JS)
│   │   ├── css/         # Global Styles
│   │   ├── js/          # API & App Logic
│   │   ├── views/       # Dashboard Views
│   │   └── assets/      # Images & Icons
│   └── application.properties # Configuration
└── pom.xml              # Maven Dependencies
```

## 🛠️ Setup & Installation

### Prerequisites
- JDK 17 or higher
- Maven 3.6+
- MySQL (Optional, H2 is used by default)

### Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/messconnect.git
   cd messconnect
   ```

2. **Configure Database (Optional):**
   By default, the project uses H2. To use MySQL, update `src/main/resources/application.properties` with your credentials.

3. **Configure Razorpay:**
   Update the Razorpay API keys in `application.properties`:
   ```properties
   razorpay.key.id=your_key_id
   razorpay.key.secret=your_key_secret
   ```

4. **Build and Run:**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

5. **Access the App:**
   Open your browser and navigate to `http://localhost:8080`

## 🎨 UI Preview

*A sneak peek into the premium dashboard designs:*

- **Dark Mode Aesthetic:** Sleek, modern interface using deep purples and vibrant accents.
- **Interactive Dashboards:** Real-time data visualization and smooth transitions.
- **Responsive Layout:** Optimized for all screen sizes.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with Rohan Atole by the MessConnect Team.
