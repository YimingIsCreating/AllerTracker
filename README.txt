# AllerTracker

A web application for tracking food allergies. Log your meals and symptoms to identify potential allergens.

## Highlights

- **Smart Input**: AI-powered meal parsing automatically extracts ingredients
- **Confidence Scoring**: Statistical analysis ranks foods by risk level
- **Interactive Heatmap**: GitHub-style activity visualization
- **AI Chat Assistant**: Ask questions about your allergy patterns
- **No Framework**: Pure vanilla JavaScript, lightweight and fast

## Features

- **Meal Logging**: Record what you eat with timestamps
- **Symptom Tracking**: Link symptoms to specific meals
- **Risk Analysis**: Statistical analysis shows which foods correlate with symptoms
- **Activity Heatmap**: Visual calendar showing your tracking patterns
- **Reports**: Generate summaries of high-risk foods and recommendations
- **AI Assistant**: Chat interface to ask questions about your data
- **Allergen Management**: Keep a list of confirmed allergens

## Tech Stack

**Frontend**: HTML, CSS, JavaScript

**Backend**: Python, FastAPI

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/allertracker.git
cd allertracker
```

### 2. Start the backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Open the frontend

Open `index.html` in your browser, or start a local server:
```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`

## Usage

1. Click "Add Meal" to log what you ate
2. Click "Add Symptoms" if you had a reaction
3. Check Analysis page for food risk scores
4. Manage all records in Records page

## Project Structure
```
AllerTracker/
├── index.html          # Main page
├── css/
│   └── styles.css      # Styles
├── js/
│   ├── config.js       # API configuration
│   ├── main.js         # Entry point
│   └── ...             # Other modules
└── backend/            # Python backend
```

## Configuration

Edit `js/config.js` to set your API URL:
```javascript
const CONFIG = {
    API_URL: 'http://127.0.0.1:8000'
};
```

## Deployment

Deploy frontend to Vercel or Netlify. Deploy backend to Render or Railway.

Remember to update the API URL in `config.js` after deployment.

## Disclaimer

This app is for reference only and cannot replace medical diagnosis. Consult a doctor if you suspect food allergies.

## License

MIT

## Author

Yiming