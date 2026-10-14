# FreshPulse — Store Operations Intelligence

FreshPulse is a simple, modern, professional web application designed for retail store operations managers. It tracks store performance, detects inventory shortages and wastage surges, and organizes operational decisions into actionable tasks.

---

## 🚀 Key Sections

The application is streamlined into three essential sections:

1. **Dashboard**
   - High-level network metrics: Total Sales, Transactions, Footfall, Stock Levels, Wastage, and Delayed Deliveries.
   - Immediate operational alert cards:
     - **Stock Shortages**: Highlights stores with low buffer (<0.35x coverage) or zero stock.
     - **Wastage Alerts**: Highlights stores with elevated spoilage (>6%).
     - **Delayed Deliveries**: Highlights shipments behind schedule.
   - Clean, readable graphs: Store Sales vs. Footfall, and Inventory Coverage vs. Wastage Rate.
   - Interactive Stores Overview table with quick search, filtering, and one-click navigation to store details.

2. **Store Details**
   - Detailed performance analysis for individual stores.
   - **Confirmed Facts vs. Possible Explanations**: Distinguishes verified numbers from hypothetical causes to verify.
   - Key operational indicators: Sales, Average Basket Size, Conversion Rate, Available Stock, Days of Stock Remaining, Wastage Percentage, Staffing, and Delivery Status.
   - Practical recommendations with direct action approval controls.

3. **Tasks and Actions**
   - Centralized task queue for operational interventions.
   - Status transitions: **Pending** → **Approved** → **Completed** (or **Rejected**).
   - Filter by status and store.
   - User action updates persist in your browser session automatically.

---

## 📥 Data Entry & Management

FreshPulse provides three simple ways to load store data:

1. **Manual Entry**: Simple, user-friendly form with inline validation and non-negative number support (valid zeros are preserved).
   - **Save Store**: Saves the store record into local storage without triggering analysis automatically, displays confirmation, and refreshes the saved store list.
   - **Analyze Store**: Validates input, displays "Analyzing store data...", calls `analyzeAll(input)`, and loads the dashboard.
   - **Reset**: Clears form fields and error indicators.
2. **CSV Upload**: Drag-and-drop CSV file upload with instant column detection, error checking, and a downloadable clean CSV template (headers only).
3. **Load Demo Data**: Optional illustrative sample dataset (clearly labeled "Synthetic demonstration data") to explore the interface, with one-click reset.

---

## 💾 Local Storage Architecture

Saved stores are managed via `src/store/storeStore.ts`:
- `getSavedStores()`
- `saveStore(store)`
- `updateStore(store)`
- `deleteStore(storeId)`

*Note on Local Storage:* Data is stored locally in the current browser and device session. It does not provide cross-device synchronization or centralized database persistence.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4 (Clean modern SaaS aesthetic, responsive layouts)
- **Visualizations:** Recharts
- **CSV Engine:** Papa Parse
- **Routing & State:** React Router, React Context API, LocalStorage persistence
- **Icons:** Lucide React
- **Testing:** Vitest

---

## 💻 Setup & Running Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 3. Run Unit Tests
```bash
npm run test
```

### 4. Build for Production
```bash
npm run build
```

---

## 📄 License
Apache-2.0
