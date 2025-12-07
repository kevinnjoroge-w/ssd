# InsureMe - USSD Dashboard (Frontend)

A modern React + Vite + Tailwind CSS v4 frontend for visualizing the USSD insurance backend data.

## Features

- **Dashboard**: Real-time metrics showing users, plans, and payments
- **Charts**: Payment trends visualization with Chart.js
- **Icons**: Beautiful icons from React Icons (Fi set)
- **Styling**: Tailwind CSS v4 with custom theme colors
- **Responsive**: Mobile-friendly grid layout

## Quick start

1. Open a terminal in `frontend/`:

```powershell
cd "e:\insurance ussd\frontend"
```

2. Install dependencies:

```powershell
npm install
```

3. Start dev server:

```powershell
npm run dev
```

4. Open the URL printed by Vite (usually `http://localhost:5173`) — the dashboard will fetch data from the backend at `http://localhost:3000` by default.

## Configure API base URL

Set `VITE_API_BASE_URL` to point to your backend:

```powershell
$env:VITE_API_BASE_URL = 'http://localhost:3000'; npm run dev
```

Or on one line (Windows PowerShell):

```powershell
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

## Build for production

```powershell
npm run build
npm run preview
```

## Tech Stack

- **React 18**: Component-based UI
- **Vite 5**: Fast build tool
- **Tailwind CSS v4**: Utility-first styling
- **Chart.js + react-chartjs-2**: Payment trend visualization
- **React Icons**: Beautiful SVG icons
- **Axios**: HTTP client for API calls

## Notes

- The frontend expects backend endpoints like `/api/ussd/plans`, `/api/payments/history`, and optionally `/api/users`.
- If the backend is not running, the dashboard will show an error message but remain functional.
- Tailwind CSS is configured in `tailwind.config.js` with custom colors (primary, secondary, accent).

