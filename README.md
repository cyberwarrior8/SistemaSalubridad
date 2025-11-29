# Sistema Salubridad

A web platform for registration, evaluation, and validation of samples (water, food, and beverages) with PDF report generation.

## Project Overview

Sistema Salubridad is a system designed to manage health and hygiene data efficiently. It provides a comprehensive solution for tracking and managing sample data, including water, food, and beverage samples, with features for evaluation workflows and PDF report generation.

**Tech Stack:**
- **Backend:** Node.js + Express + SQL Server (mssql), JWT authentication, EJS templates + Puppeteer for PDF generation, PDF storage in database
- **Frontend:** React + Vite
- **Database:** SQL Server with stored procedures and auxiliary triggers

## Language Composition

| Language   | Percentage |
|------------|------------|
| JavaScript | 63.1%      |
| TSQL       | 29.8%      |
| CSS        | 3.6%       |
| EJS        | 3.3%       |
| HTML       | 0.2%       |

## Features

- **Sample Registration:** Register applicants with unique ID (11-digit cedula), samples, and parameters
- **Sample Assignment:** Assign samples to evaluators and record test results
- **PDF Report Generation:** Generate PDF reports (HTML render with EJS → PDF with Puppeteer, fallback to PDFKit), stored as VARBINARY in `InformeArchivo` table
- **Secure PDF Access:** Protected PDF download/viewing via authenticated endpoint
- **Automatic Sample Codes:** Sample codes generated automatically by type and date: `AG|AL|BE-yyyymmdd-####`

*Additional features and functionalities can be added here as the project evolves.*

## Setup Instructions

### Prerequisites

- Node.js 18+
- SQL Server 2019+ (or Azure SQL)
- PowerShell (Windows) or Bash (Linux/macOS)

### Repository Structure

```
backend/        Express API and business logic
frontend/       React application (Vite)
*.sql           Database scripts (creation, updates, seeds)
```

### Database Configuration

1. **Create database and initial objects:**
   - Execute `SistemaSalubridad-BD.sql` on your SQL Server instance to create base tables and initial stored procedures.

2. **Apply updates:**
   - Execute `DB-update.sql` for:
     - `InformeArchivo` table for PDFs (VARBINARY)
     - Soft-delete `Muestra.eliminada` + indexes
     - Triggers and sample status history
     - `sp_RegistrarMuestra` procedure with automatic `codigo_unico` generation
     - `sp_RegistrarSolicitante` procedure with `@cedula` (11 digits) and validation

3. **Users/roles and parameters (optional):**
   - Use `backend/src/seed/seed.js` to seed roles/users and base parameters.

### Environment Variables (Backend)

Create `backend/.env` from `.env.example` with:

```env
PORT=4000
# MSSQL connection string (adjust instance/credentials)
DB_SERVER=localhost\\MSSQLSERVER
DB_DATABASE=SistemaSalubridad
DB_USER=sa
DB_PASSWORD=YourSecurePassword
DB_ENCRYPT=false
# Allowed CORS origins (comma-separated)
CORS_ORIGIN=http://localhost:5173
# JWT
JWT_SECRET=your_secure_key
JWT_EXPIRES_IN=8h
```

### Running the Application

**Backend:**
```bash
cd backend
npm install
npm run dev
```
API available at `http://localhost:4000`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Application available at `http://localhost:5173` (Vite).

## Contributions

Contributions are welcome! Here's how you can contribute to this project:

1. **Fork the repository**
   ```bash
   git clone https://github.com/cyberwarrior8/SistemaSalubridad.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "Add your descriptive commit message"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch and submit

### Contribution Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Test your changes before submitting
- Update documentation if needed

## License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for more details.

---

*For questions or support, please open an issue in the repository.*
