# 🔐 DRIV - Digital Rights Inheritance Vault

<div align="center">

**Secure your digital legacy. Ensure your assets are transferred safely after your passing.**

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.1-green.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)

</div>

---

## 🚀 Project Overview

**DRIV (Digital Rights Inheritance Vault)** is a privacy-focused, full-stack application designed to securely manage and transfer digital assets after death. Built with modern technologies and designed for **local execution**, DRIV ensures your digital legacy is protected with military-grade encryption and multi-party verification.

### 🎯 Key Problems Solved

- **Digital Asset Loss**: Prevents billions of dollars in digital assets from becoming inaccessible
- **Legacy Planning**: Automates posthumous instructions (messages, account deletions, transfers)
- **Multi-Party Security**: Implements death verification with multi-signature threshold
- **Subscription Management**: Auto-cancels recurring payments after verification
- **Privacy First**: All data encrypted with AES-256

---

## ✨ Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| **User Authentication** | Secure JWT-based registration & login with bcrypt | ✅ Implemented |
| **Encrypted Vault Management** | Create multiple vaults with AES-256 encryption | ✅ Implemented |
| **Digital Asset Mapper** | Categorize assets (financial, social, crypto, documents) | ✅ Implemented |
| **Legacy Instructions** | Define time-locked posthumous actions | ✅ Implemented |
| **Trusted Parties** | Assign heirs, verifiers, and executors | ✅ Implemented |
| **Death Verification** | Multi-signature verification system | ✅ Implemented |
| **Notifications** | Email/SMS alerts (mock service) | ✅ **MOCKED** |
| **Subscription Auto-Cancel** | OAuth integration (mock service) | ✅ **MOCKED** |
| **AI Analysis** | Hugging Face Transformers (mock service) | ✅ **MOCKED** |
| **Analytics Dashboard** | Visualize vault completion and assets | ✅ Implemented |

---

## 🧠 Tech Stack

### Backend
- **Framework**: FastAPI 0.110.1
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT (python-jose) + bcrypt
- **Encryption**: AES-256 (cryptography library)
- **Task Queue**: Celery + Redis (for time-locked actions)
- **AI Integration**: Hugging Face Transformers (local inference)

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS + Custom Neon Theme
- **UI Components**: Shadcn UI (Radix UI)
- **Font**: Space Mono (Monaco-style monospace)
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Infrastructure
- **Database**: MongoDB
- **Cache**: Redis
- **Container**: Docker support ready

---

## 🗂️ Folder Structure

```
/app/
├── backend/
│   ├── server.py                 # Main FastAPI application
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js               # Main React component
│   │   ├── App.css              # Global neon theme styles
│   │   ├── components/
│   │   │   ├── Navbar.js        # Navigation component
│   │   │   └── ui/              # Shadcn UI components
│   │   └── pages/
│   │       ├── LandingPage.js   # Landing & auth
│   │       ├── Dashboard.js     # Main dashboard
│   │       ├── VaultPage.js     # Vault management
│   │       ├── AssetsPage.js    # Asset management
│   │       ├── LegacyPage.js    # Legacy instructions
│   │       ├── TrustedPartiesPage.js
│   │       ├── VerificationPage.js
│   │       ├── SubscriptionsPage.js
│   │       └── AnalyticsPage.js
│   ├── package.json
│   └── .env
└── README.md
```

---

## 🛠️ Setup Instructions

### Currently Running on Emergent Platform

The application is already deployed and running on the Emergent platform. Access it via the provided URL.

### Access Points

- **Frontend**: Access via your Emergent preview URL
- **Backend API**: `{BACKEND_URL}/api`
- **API Docs**: `{BACKEND_URL}/docs`

### Mock Services

⚠️ **Important**: The following services are currently **MOCKED** for demonstration:

1. **Email Notifications**: Logged to backend console instead of sending real emails
   - To enable real emails: Add SMTP credentials to `.env` and update email service in `server.py`

2. **OAuth Integration**: Simulated OAuth flow for subscription auto-cancellation
   - To enable real OAuth: Add Google/Microsoft OAuth credentials to `.env`

3. **AI Analysis**: Mock responses from Hugging Face Transformers
   - To enable real AI: The infrastructure is ready, just need to load actual models

---

## 🔐 Security & Encryption

### AES-256 Encryption

All sensitive data is encrypted using AES-256. Update the `ENCRYPTION_KEY` in `.env` for production.

### Authentication Flow

1. **Registration**: Password hashed with bcrypt (cost factor 12)
2. **Login**: JWT token issued with 7-day expiration
3. **Authorization**: Bearer token validated on every request

### Multi-Signature Verification

- Requires **2/3 threshold** of verifiers to approve death verification
- Vault unlocks only after threshold is met

---

## 🎨 Frontend Design Philosophy

### Monaco Monospace Aesthetic

- **Font**: Space Mono for hacker/coder vibe
- **Colors**:
  - Primary Cyan: #06b6d4
  - Success Green: #10b981
  - Dark Background: #0a0a0f, #1a1a2e
- **Effects**: Neon glow, glass morphism, floating animations
- **Theme**: Futuristic dark theme with neon accents

---

## 🐳 Docker Setup (For Local Development)

To run this project locally with Docker, you'll need to create Docker configuration files:

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: driv-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:alpine
    container_name: driv-redis
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
    container_name: driv-backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=driv_database
      - CELERY_BROKER_URL=redis://redis:6379/0
    depends_on:
      - mongodb
      - redis

  frontend:
    build:
      context: ./frontend
    container_name: driv-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Quick Start Commands

```bash
# Build and start all services
docker-compose up --build -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

---

## 📈 Future Enhancements

### Next Steps

- [ ] **Blockchain Integration**: Store asset hashes on Ethereum/Polygon
- [ ] **Real SMTP**: SendGrid/Mailgun integration
- [ ] **Real OAuth**: Google/Microsoft integration
- [ ] **2FA**: Two-factor authentication
- [ ] **Mobile App**: React Native version

### Advanced Features

- [ ] **Smart Contracts**: Automated asset transfer
- [ ] **Biometric Auth**: Fingerprint/Face ID
- [ ] **Cloud Backup**: AWS S3/Google Cloud
- [ ] **Legal Integration**: Will/estate planning services

---

## 🤝 Contribution Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📬 Contact & Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Email**: support@driv.example.com

---

## 🧩 Troubleshooting

### Backend Not Starting

```bash
# Check backend logs
tail -n 100 /var/log/supervisor/backend.err.log

# Restart backend
sudo supervisorctl restart backend
```

### Frontend Not Loading

```bash
# Check frontend logs
tail -n 100 /var/log/supervisor/frontend.err.log

# Restart frontend
sudo supervisorctl restart frontend
```

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb
```

---

## 🎯 Quick Reference

### Environment Variables

| Variable | Description | Location |
|----------|-------------|----------|
| `MONGO_URL` | MongoDB connection string | backend/.env |
| `JWT_SECRET_KEY` | JWT signing secret | backend/.env |
| `ENCRYPTION_KEY` | AES-256 key | backend/.env |
| `REACT_APP_BACKEND_URL` | Backend API URL | frontend/.env |

### Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | User login |
| `/api/vaults` | GET/POST | Manage vaults |
| `/api/assets` | GET/POST | Manage assets |
| `/api/legacy-instructions` | GET/POST | Legacy instructions |
| `/api/trusted-parties` | GET/POST | Trusted parties |
| `/api/death-verifications` | GET/POST | Death verification |
| `/api/analytics/dashboard` | GET | Dashboard stats |

---

<div align="center">

**Built with ❤️ for securing digital legacies**

*Protecting your digital life, one vault at a time.*

</div>
