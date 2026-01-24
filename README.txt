# AllerTracker

A web application for tracking food allergies. Log your meals and symptoms to identify potential allergens through statistical analysis.

## Highlights

- **Smart Input**: AI-powered meal parsing automatically extracts ingredients
- **Confidence Scoring**: Statistical analysis ranks foods by allergy risk
- **Interactive Heatmap**: GitHub-style activity visualization
- **AI Chat Assistant**: Ask questions about your allergy data
- **Pure Vanilla JS**: No framework dependencies, lightweight and fast

## Features

- **Meal Logging**: Record what you eat with timestamps
- **Symptom Tracking**: Link symptoms to specific meals
- **Risk Analysis**: Calculate confidence scores based on food-symptom correlations
- **Activity Heatmap**: Visual calendar showing tracking patterns and risk levels
- **Reports**: Generate summaries of high-risk foods with timeline
- **AI Assistant**: Chat interface to query your allergy history
- **Allergen Management**: Maintain a list of confirmed allergens
- **Cross-Reactivity Prediction**: AI predictions for related allergens

## Tech Stack

**Frontend**: HTML, CSS, JavaScript (Vanilla)

**Backend**: Python, FastAPI

## Project Structure
```
AllerTracker/
├── README.md
├── .gitignore
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── main.js
│       ├── navigation.js
│       ├── state.js
│       ├── utils.js
│       ├── components/
│       │   ├── chat.js
│       │   ├── heatmap.js
│       │   ├── modal.js
│       │   └── prediction.js
│       └── pages/
│           ├── home.js
│           ├── records.js
│           └── analysis.js
└── backend/
    ├── main.py
    ├── requirements.txt
    └── (other backend files)
```

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/AllerTracker.git
cd AllerTracker
```

### 2. Start the backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend will run on `http://127.0.0.1:8000`

### 3. Open the frontend
```bash
cd frontend
python -m http.server 8080
```

Then visit `http://localhost:8080`

## Usage

1. **Add Meal**: Click "Add Meal" button to log what you ate
   - Use Smart Input for AI-powered ingredient extraction
   - Or manually enter food items

2. **Track Symptoms**: Click "Add Symptoms" to record allergic reactions

3. **View Analysis**: 
   - Check Activity Heatmap for visual patterns
   - Review Food Confidence scores
   - Generate detailed reports

4. **Chat with AI**: Ask questions about your allergy data in the AI Assistant page

5. **Manage Allergens**: Add medically confirmed allergens in Known Allergens page

## Configuration

Edit `frontend/js/config.js` to set your API URL:
```javascript
const CONFIG = {
    API_URL: 'http://127.0.0.1:8000'  // Change to your deployed backend URL
};
```

## Deployment

### Frontend
Deploy to Vercel or Netlify:
1. Push code to GitHub
2. Connect your repository
3. Set build settings to deploy from `frontend/` directory
4. Deploy

### Backend
Deploy to Render or Railway:
1. Connect your GitHub repository
2. Set root directory to `backend/`
3. Configure start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Deploy

**Important**: Update `CONFIG.API_URL` in `frontend/js/config.js` with your deployed backend URL.

## Medical Disclaimer

⚠️ This application is for informational purposes only and is NOT a substitute for professional medical advice. The AI predictions and confidence scores are based on statistical correlations and should not be used as medical diagnoses. Always consult with a qualified allergist or healthcare provider for proper diagnosis and treatment.

## License

MIT

## Author

Yiming - MS Computer Science student at Northeastern University

Developed as a final project for CS5001: Intensive Foundations of Computer Science