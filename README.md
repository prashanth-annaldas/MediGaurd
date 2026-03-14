<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/activity.svg" width="100" alt="MediGuard Logo">
  
  # 🏥 MediGuard AI
  **Next-Generation Intelligent Hospital Management System**

  [![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react)](https://zustand-demo.pmnd.rs/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
</div>

---

## 🌟 Overview

Welcome to **MediGuard AI**! MediGuard is a cutting-edge, ML-powered hospital administration system designed to simplify operations, predict resource shortages, and securely manage different hospital roles dynamically.

Whether you're a doctor checking on a patient's QR-coded bed, an administrator reviewing capacity forecasts, or a staff member managing admissions—MediGuard brings everything you need into one beautiful, reactive dashboard.

---

## 🚀 Key Features

- **🔐 True Multi-Role Sessions (Tab-Isolated)**  
  Log into the Admin dashboard in one tab, and the Doctor dashboard in another. Our architecture completely isolates your sessions using browser `sessionStorage`, so your roles never bleed into each other.
- **🏷️ Smart QR Bed Management**  
  Scan a bed's QR code to instantly admit, discharge, or view detailed patient medical histories right from your device.
- **🤖 Gemini AI & Predictive Analytics**  
  Stay ahead of the curve. MediGuard actively learns your hospital's utilization trends and warns you *before* an Oxygen or ICU bed shortage actually occurs.
- **📊 Real-time Interactive Dashboards**  
  Rich visual charts (powered by Recharts) provide live looks into capacity limits, daily forecasts, and active emergency alerts.
- **🛡️ Multi-Tier Access Control**  
  Strict routing policies specifically tailored for `Admin`, `Doctor`, `Staff`, and `User` (Patient) views.

---

## 🏗️ Architecture Stack

### Backend (`/backend`)
* **Framework:** FastAPI (Python 3.10+) ⚡
* **Database:** PostgreSQL (with SQLAlchemy ORM)
* **Auth:** JWT token-based authentication + Firebase Admin
* **AI & Data:** Google Generative AI, Pandas, Scikit-Learn

### Frontend (`/frontend`)
* **Framework:** React 18 + Vite
* **State Management:** Zustand
* **Styling & UI:** TailwindCSS, Framer Motion, Lucide React
* **Data Visualization:** Recharts, Leaflet (Maps)
* **Utilities:** HTML5-QRCode (for bed scanning)

---

## 🏁 Getting Started

### 1️⃣ Clone and Prepare
Clone the repository and open your terminal.

### 2️⃣ Start the Backend
Navigate to the `backend` folder and set up your virtual environment.

```bash
cd backend
python -m venv "d:\Dev\Virtuals\MediGaurd"

# Activate the virtual environment
# On Windows:
d:\Dev\Virtuals\MediGaurd\Scripts\activate
# On Mac/Linux:
source d:\Dev\Virtuals\MediGaurd/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*The backend API will run at `http://localhost:8000`*

### 3️⃣ Start the Frontend
Open a new terminal window, navigate to the `frontend` directory.

```bash
cd frontend

# Install Node modules
npm install

# Start the Vite development server
npm run dev
```
*The React app will launch at `http://localhost:5173`*

---

## 🔑 Accounts & Testing

To fully experience the platform, try opening multiple tabs and logging into different roles simultaneously. Here's how you should navigate:

| Role | Access Level | Key Capabilities |
| :--- | :--- | :--- |
| **Admin** | Full Access | Can view all hospital analytics, AI forecasts, and system alerts. |
| **Doctor** | High | Has deep access to patient records, histories, and related beds. |
| **Staff** | Operational | Can handle admissions/discharges via QR codes and manage logistics. |
| **User (Patient)**| Restricted | Can only view their personal appointment times and selected hospital data. |

---

## 🧩 Environment Variables

Make sure to configure your environment files before running the project.

**`backend/.env`**
```env
DATABASE_URL=postgresql://user:password@localhost/medguard
SECRET_KEY=your_super_secret_jwt_key
GOOGLE_API_KEY=your_gemini_api_key
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:8000
```

---

<div align="center">
  <b>Built with ❤️ to organize modern healthcare.</b>
</div>
