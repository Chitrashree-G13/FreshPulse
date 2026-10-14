# FreshPulse — Store Operations Intelligence

**Turning store data into daily decisions.**

FreshPulse is a modern retail operations intelligence dashboard designed to help store managers identify operational risks, understand store performance, and prioritize actions using data-driven insights.

The application processes store-level operational data to highlight potential problems such as inventory shortages, rising wastage, sales underperformance, and operational delays. It combines risk scoring, evidence-based analysis, and actionable recommendations in a unified interface.

## 🚀 Key Features

### 1. Store Intelligence Dashboard
- View store performance and operational indicators.
- Identify high-priority stores using risk and priority scores.
- Highlight potential inventory, wastage, sales, and operational issues.
- Review supporting evidence behind identified problems.
- Navigate between store-level insights and operational tasks.

### 2. Store Data Analysis
- Analyze store data through the application's analysis workflow.
- Validate inputs before processing.
- Generate priority scores and identify potential operational risks.
- Present the main problem, supporting evidence, and recommended actions.
- Help operations teams decide which issues need attention first.

### 3. Risk Scoring and Prioritization
- Evaluate operational indicators using a scoring engine.
- Rank stores according to identified risks and operational priorities.
- Provide structured results to support decision-making.
- Separate observed data from possible explanations that require verification.

### 4. Recommendations and Investigation
- Generate practical recommendations for identified operational issues.
- Investigate possible causes of store-level problems.
- Explore hypotheses to support further investigation.
- Provide a structured workflow from identifying an issue to taking action.

### 5. Simulation and Stock Transfer
- Explore operational scenarios using the simulation engine.
- Evaluate potential stock transfer options between stores.
- Support decision-making with recommendations and operational impact previews where available.

### 6. Tasks and Actions
- Organize operational interventions into a centralized workflow.
- Track action status and review pending tasks.
- Support operational follow-up through the application interface.

### 7. Supabase Integration
- Includes a Supabase client and service layer for database connectivity.
- Supports integration with the configured Supabase project.
- Database functionality depends on valid environment variables, table schemas, and access policies.

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript
- **Development Server and Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Routing:** React Router
- **State Management:** React Context API
- **Data Processing:** TypeScript-based scoring, risk, and recommendation engines
- **Database Integration:** Supabase
- **CSV Processing:** Papa Parse
- **Icons:** Lucide React
- **Testing:** Vitest

## 📂 Project Structure

```text
freshpulse/
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── pages/
│   ├── context/
│   ├── engine/
│   │   ├── hypothesisEngine.ts
│   │   ├── investigationEngine.ts
│   │   ├── metrics.ts
│   │   ├── pipeline.ts
│   │   ├── recommendationEngine.ts
│   │   ├── riskEngine.ts
│   │   ├── scoringEngine.ts
│   │   ├── simulatorEngine.ts
│   │   ├── transferEngine.ts
│   │   └── validator.ts
│   ├── services/
│   │   └── supabaseService.ts
│   ├── store/
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── supabase.ts
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── freshpulse_technical_report.txt
└── vite.config.ts
```

## 💻 Getting Started

### Prerequisites

Install the following before running the application:

- Node.js
- npm
- Git (optional, for version control)

### 1. Open the Project Folder

In Windows PowerShell, navigate to the project directory:

```powershell
cd "C:\Users\Lemovo\Downloads\freshpulse (3)"
```

### 2. Install Dependencies

Run this command if you are setting up the project for the first time or dependencies are missing:

```powershell
cmd /c npm install
```

### 3. Start the Development Server

Run the same command used to launch FreshPulse locally:

```powershell
cmd /c npm run dev
```

Vite will display the local development URL. In the current configuration, it is:

**http://localhost:3000/**

Open the URL in your browser to use the application.

To stop the server, press `Ctrl + C` in the terminal and confirm if prompted.

### 4. Run Tests

```powershell
cmd /c npm run test
```

### 5. Build for Production

```powershell
cmd /c npm run build
```

If the build succeeds, Vite generates the production output in the `dist/` directory.

## 🔐 Environment Configuration

If Supabase is required, configure the environment variables in a local `.env.local` file using the variable names expected by the application.

Use `.env.example` as a reference and replace the placeholder values with your own project configuration.

**Security notes:**
- Never commit `.env` or `.env.local` files.
- Never publish private API keys, service-role keys, or database credentials.
- Ensure database tables and Row Level Security policies are configured appropriately before enabling public access.

The application can only use the Supabase features supported by the current configuration and implementation.

## 🧪 Testing and Validation

FreshPulse includes an engine test suite and a structured data-processing architecture. Run the test command above to validate the configured tests.

For reliable results, test the application with valid store data and verify that generated scores, evidence, recommendations, and action states match the implemented logic.

## 🎯 Project Objective

FreshPulse aims to make retail operations more proactive by transforming store-level data into understandable priorities and practical next steps.

Instead of requiring managers to inspect multiple operational indicators separately, the application brings risk identification, supporting evidence, investigation, and recommendations into one workflow.

