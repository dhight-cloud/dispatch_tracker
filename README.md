# Dispatch Tracker

> **Field Operations & Resource Orchestration Platform**  
> A full-stack web application designed to bridge the communication gap between office dispatchers and field technicians, eliminating scheduling friction, double-bookings, and lost work orders.

---

## 📋 Executive Summary & Business Impact

In field service operations, reliance on phone calls, text chains, and manual spreadsheets leads to miscommunications, missed service level agreements (SLAs), and high operational overhead. 

**Dispatch Tracker** solves these real-world operational challenges by providing a centralized, role-based platform that streamlines ticket management, automates technician account creation, and maintains complete audit accountability:

* **Eliminates Lost Tickets:** Every service request follows a clear, trackable state transition from `unassigned` through `resolved`.
* **Automates Onboarding:** Creating a field technician profile automatically provisions a secure, linked user account with default credentials.
* **Guarantees Data Accountability:** Transaction-safe database updates ensure that ticket reassignments and status changes automatically generate immutable audit log entries.
* **Tailored User Experiences:** Dispatchers get high-density queue control, while field technicians get a focused, mobile-friendly view restricted to their assigned work.

---

## 🛠️ Technology Overview

The platform is built using an industry-standard, battle-tested tech stack chosen for performance, security, and long-term maintainability:

* **Frontend:** React, Vite, Tailwind CSS, Axios, Lucide Icons
* **Backend:** Node.js, Express.js, Express-Validator, JSON Web Tokens (JWT), Bcrypt
* **Database:** MySQL / MariaDB (Relational schema enforcing foreign key integrity across users, technicians, tickets, and audit logs)

---

## 🔑 Key Features

* **Role-Based Access Control (RBAC):** Distinct permission tiers for Admins, Dispatchers, and Field Technicians enforced at both API routes and UI components.
* **Automated User Provisioning:** Single-modal technician creation that generates both operational records and hashed authentication credentials simultaneously.
* **Dynamic Queue Filtering:** Real-time filtering by status (`unassigned`, `dispatched`, `en_route`, `on_site`, `resolved`) and priority (`emergency`, `high`, `normal`).
* **Audit Logging:** Database transactions (`BEGIN`, `COMMIT`, `ROLLBACK`) protect against orphaned updates and log all status and technician assignment changes.

---

## 🔑 Test Credentials for Evaluators

Evaluators and hiring managers can test the platform using the seeded test accounts and role-based credentials below:

* **Admin / Dispatcher Account:**
  * **Email:** `admin@logistics.com`
  * **Password:** `LogisticsPass123!`

* **Technician Auto-Provisioning:**
  * When a Dispatcher provisions a new technician account through the console, the user account is automatically initialized with the temporary password: **`LogisticsPass123!`**

---

## 🚀 Getting Started & Local Installation

Follow these steps to run the **Dispatch Tracker** application locally on your machine.

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MySQL](https://www.mysql.com/) or [XAMPP](https://www.apachefriends.org/) (Apache + MariaDB/MySQL)
* [Git](https://git-scm.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/dispatch-tracker.git
cd dispatch-tracker
```

---

### 2. Database Setup

1. Open your MySQL client (phpMyAdmin, MySQL Workbench, or terminal).
2. Create a new database named `dispatch_tracker`:
   ```sql
   CREATE DATABASE dispatch_tracker;
   ```
3. Import the database schema from the project root:
   ```bash
   mysql -u root -p dispatch_tracker < database/schema.sql
   ```

---

### 3. Backend Setup

1. Navigate to the backend folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=dispatch_tracker
   JWT_SECRET=your_jwt_secret_key
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend API will run on `http://localhost:5000`.*

---

### 4. Frontend Setup

1. Open a new terminal window, navigate to the frontend folder, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.