# Table Annotation Tool

A web application for annotating and correcting OCR errors in table structures extracted from images. This tool is designed to work with a table2html model that converts table images to HTML structures.

## Features

- Upload table images for processing
- View and edit table cells with incorrect OCR text
- Automatically save corrections as annotations
- Export annotations for later use
- Visual indicators for corrected cells
- Modern, responsive UI with Material Design

## Technology Stack

- React.js for UI components
- Material-UI for styling and UI components
- Axios for API communication
- React Dropzone for file uploads
- React Toastify for notifications

## Project Structure

```
table-annotation-app/
├── public/             # Static files
├── src/                # Source code
│   ├── components/     # React components
│   │   ├── ImageUploader.js
│   │   └── TableEditor.js
│   ├── services/       # API services
│   │   └── ApiService.js
│   ├── styles/         # CSS styles
│   │   └── index.css
│   ├── App.js          # Main app component
│   └── index.js        # Entry point
└── package.json        # Dependencies
```

## Getting Started

### Prerequisites

- Node.js (version 14.x or higher)
- NPM or Yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd table-annotation-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure API endpoint:
   - Edit `src/services/ApiService.js` to set your actual API endpoint for the table2html model

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Integrating with Your table2html Model

The application is designed to work with any table2html model API. To integrate with your specific model:

1. Update the `API_BASE_URL` in `src/services/ApiService.js` to point to your model's API endpoint.
2. Ensure your API accepts table images and returns HTML table structure.
3. Uncomment the API call in `App.js` and remove the mock data.

## Annotation Data Format

Annotations are saved in the following JSON format:

```json
{
  "timestamp": "2023-09-25T12:34:56.789Z",
  "tableId": "table-1",
  "corrections": [
    {
      "original": "Incorrect OCR Text",
      "corrected": "Correct Text",
      "timestamp": "2023-09-25T12:34:56.789Z"
    }
  ]
}
```

## Extending the Application

You can extend this application by:

1. Adding user authentication
2. Implementing a database to store annotations
3. Adding batch processing for multiple tables
4. Creating a gallery of previously annotated tables
5. Implementing advanced table structure editing capabilities

## License

[MIT License](LICENSE)

## Acknowledgements

- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [React Dropzone](https://react-dropzone.js.org/)
- [React Toastify](https://fkhadra.github.io/react-toastify/) 