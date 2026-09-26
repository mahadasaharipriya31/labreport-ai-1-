# 🧪 LabReport AI — Pathology Lab Report Generator

A web-based application that automates pathology lab report generation using analyser output in CSV format. The system processes laboratory test results, compares them with configured reference ranges, flags abnormal values, and generates patient reports.

## 🚀 Features

* **CSV Upload:** Import laboratory analyser output in CSV format.
* **Reference Range Comparison:** Compare test results against configured reference ranges.
* **Abnormal Result Detection:** Identify results that are above or below the configured range.
* **Critical Result Alerts:** Highlight results that cross configured critical thresholds.
* **Unit Conversion:** Support compatible laboratory measurement units.
* **Patient Reports:** Generate clear, structured pathology reports.
* **Diet Plan Generator:** Provide general meal-plan suggestions based on user preferences.

## 🛠️ Technologies Used

* Frontend: JavaScript, HTML, CSS
* Backend: Python
* Data Processing: CSV
* Package Management: npm

## 📁 Project Structure

```text
labreport-ai/
├── backend/
│   ├── main.py
│   ├── csv_processor.py
│   ├── reference_engine.py
│   ├── unit_converter.py
│   ├── report_generator.py
│   ├── database.py
│   └── diet_engine.py
├── public/
├── src/
├── index.html
├── package.json
├── README.md
└── .gitignore
```

## ⚙️ How to Run the Project

### Prerequisites

* Python installed
* Node.js and npm installed
* Git (optional, for cloning the repository)

### 1. Clone the repository

```bash
git clone https://github.com/mahadasaharipriya31/labreport-ai-1-.git
cd labreport-ai-1-
```

### 2. Start the Python backend

Run this command from the project root:

```bash
py -m backend.main
```

The backend API runs on port 8000.

### 3. Start the frontend

Open a second terminal in the project root and run:

```bash
npm install
npm run dev
```

Open the local URL displayed in the terminal.

## 📊 Input Dataset

The application accepts laboratory analyser results in CSV format.

The CSV may contain fields such as:

* Patient ID
* Patient Name
* Age
* Sex
* Test Name
* Result
* Unit
* Analyzer
* Date

Use synthetic sample data for testing and demonstrations.

## 🔮 Future Enhancements

* Support for additional laboratory tests and analysers
* Improved reference range management
* Enhanced report visualisation
* Additional dietary preference options
* More comprehensive validation and testing

## ⚠️ Disclaimer

This project is intended for educational and demonstration purposes. It does not replace professional medical advice, diagnosis, or treatment. Reference ranges and critical thresholds must be validated by qualified healthcare professionals before clinical use.

## 👩‍💻 Author

**Haripriya Mahadasa**

GitHub: [mahadasaharipriya31](https://github.com/mahadasaharipriya31)
