# ☕ Artisan Brew — F&B Management System

<div align="center">
  <img src="/public/favicon.svg" alt="Artisan Brew Logo" width="120" height="120" style="border-radius: 20%;" onerror="this.src='https://raw.githubusercontent.com/lucide-react/lucide/main/icons/coffee.svg'" />
  <p><em>Integrated Inventory, Production Planning, and POS System for Modern F&B Businesses</em></p>
</div>

---

## 📖 Description
**Artisan Brew** is a comprehensive, enterprise-grade F&B operations system designed for cafes, coffee shops, and restaurants. In the fast-paced F&B industry, keeping track of warehouse inventory, kitchen production targets, and cashier sales often happens in silos. This leads to ingredient wastage, stock discrepancies, and untracked margins. 

Artisan Brew solves these problems by providing an integrated frontend platform that connects:
*   **Inventory Control:** Track raw materials, ingredients, and packaging levels in real-time with precise batch and expiration monitoring.
*   **Production Planning:** Let kitchen and management create daily production schedules, assign targeted item targets, and set localized, time-bound discounts.
*   **Point of Sale (POS):** Give cashiers a lightning-fast checkout interface that automatically displays active discounts, enforces production constraints, and updates stock metrics instantly.

---

## 🗂️ Table of Contents
1.  [Key Features](#-key-features)
2.  [Technology Stack](#-technology-stack)
3.  [Installation](#-installation)
4.  [Usage Guide](#-usage-guide)
5.  [Project Structure](#-project-structure)
6.  [Git Workflow & Contribution](#-git-workflow--contribution)
7.  [License](#-license)

---

## ✨ Key Features

### 1. Admin Portal (`/admin`)
*   **Interactive Dashboard:** Visualize sales trends with hourly continuous charts (Revenue vs. Cups Sold metrics), real-time pending incident counters, and placeholders for AI-powered insights.
*   **Inventory & Batch Manager:** Manage raw materials (ingredients and packaging) with detailed logging of unit batches, cost histories, and automatic conversion values (e.g., grams to kilograms).
*   **Recipe Creator:** Establish precise ingredient formulas for F&B items to automatically deduct raw material stock upon transactions.
*   **Production Planning & Drafts:** Schedule daily production workflows, set target limits for items, and formulate custom discounts.
*   **Incident Reports:** Clean, 2-column wide layout forms to record stock damage, waste, or late reports directly linked to production runs.

### 2. Cashier Portal (`/kasir`)
*   **Responsive POS Counter:** Real-time cart system featuring simple quantity adjustments, custom order handling, and automatic calculation of discounted prices.
*   **Smart Invoice Receipts:** Review transactional history, access receipts, and monitor active sales statistics.
*   **Shift Overview:** View detailed cash registers and sales metrics for cashier shift closings.

---

## 🛠️ Technology Stack
*   **Framework:** React 19.2 (Vite-powered HMR)
*   **Styling:** Tailwind CSS v4 & custom modern components
*   **Design System:** shadcn/ui (Tailwind-native components)
*   **Routing:** React Router v7
*   **State Management:** Zustand (Global State) & React Context (Authentication)
*   **Charts:** Recharts (React Area & Line charts)
*   **API Client:** Axios (Custom endpoints)
*   **Form Validation:** React Hook Form & Zod
*   **Real-time Features:** Socket.io-client

---

## ⚙️ Installation

Follow these steps to set up the project on your local machine:

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18.x or newer recommended)
*   [npm](https://www.npmjs.com/) or another preferred package manager

### Steps
1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/505-kada-team/505-capstone-frontend.git
    cd 505-capstone-frontend
    ```

2.  **Install Dependencies:**
    Use npm to download package dependencies:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Copy the example configuration to create your local environment file:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in the necessary keys:
    *   `VITE_API_URL`: The URL of your running backend services (e.g., `http://localhost:3000`).
    *   `VITE_SOCKET_URL`: Socket server endpoint (defaults to `http://localhost:3000`).
    *   `VITE_DEFAULT_AUTH_ROLE`: Local development bypass role (`admin` or `cashier`).

---

## 🚀 Usage Guide

Use the following commands inside the project directory to develop and build the application:

### Run Development Server
Start the local server with hot module replacement (HMR):
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Build Production Bundle
Build and optimize the code for production deployment:
```bash
npm run build
```
The optimized files will be output to the `/dist` directory.

### Run Code Linter
Run ESLint to check for code quality and syntax standards:
```bash
npm run lint
```

### Preview Production Build
Locally preview the production build output:
```bash
npm run preview
```

---

## 📂 Project Structure
```
src/
├── layouts/          # Admin and Cashier layouts
├── components/
│   ├── ui/           # Automatically generated shadcn/ui components
│   └── shared/       # Shared UI components (DataTable, Pagination, PageHeader, etc.)
├── pages/
│   ├── admin/        # Pages for admin roles (Dashboard, Recipes, Plans, etc.)
│   └── cashier/      # Pages for cashier roles (POS, Invoice, Overview, etc.)
├── services/         # API Endpoint mapping (Axios base instance)
├── hooks/            # Custom React hooks (Pagination, sorting, and API bindings)
├── context/          # Authentication states
├── stores/           # Zustand stores for state management
└── lib/              # Utility configurations and MockData datasets
```

---

## 🤝 Git Workflow & Contribution

To contribute to this codebase, please follow the guidelines specified in [GIT_GUIDELINE.md](file:///e:/capstone/docs/GIT_GUIDELINE.md) and [CONVENTIONS_v3.md](file:///e:/capstone/docs/CONVENTIONS_v3.md):

*   **Branch Naming Convention:**
    *   Features: `feature/your-feature-name`
    *   Fixes: `fix/your-fix-name`
    *   Refactoring: `refactor/clean-up-name`
*   **Merge Policy:** Always pull the latest `develop` changes and rebase your branch before submitting a Pull Request (PR) to prevent conflicts.
*   **Code Conventions:** UI language must be in **English**. Maintain standard JSX structures and linting conventions.

---

## 📄 License
This project is licensed under the terms of the team agreement of **505 Kada Team** and is for internal and academic evaluation purposes only. All rights reserved.
