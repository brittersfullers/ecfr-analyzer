# eCFR Analyzer

A web application for analyzing and visualizing data from the Electronic Code of Federal Regulations (eCFR). The application provides insights and visualizations of regulatory data, making it easier to understand and analyze federal regulations.

## Features

- Interactive data visualization using Chart.js
- Real-time data analysis
- Modern React-based user interface
- AWS S3 integration for data storage
- RESTful API backend

## Tech Stack

### Frontend
- React 18
- Chart.js for data visualization
- React Testing Library for testing
- Create React App for development environment

### Backend
- Node.js
- Express.js
- AWS SDK for S3 integration
- CORS for cross-origin resource sharing
- dotenv for environment variable management

## Prerequisites

- Node.js 18.x
- npm (comes with Node.js)
- AWS account with S3 access
- Environment variables configured (see Setup section)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/BRITTERSFULLERS/ecfr-analyzer.git
cd ecfr-analyzer
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     AWS_ACCESS_KEY_ID=your_access_key_here
     AWS_SECRET_ACCESS_KEY=your_secret_key_here
     AWS_REGION=us-east-1  # or your preferred region
     S3_BUCKET_NAME=your-bucket-name
     ```

⚠️ **Security Note**: Don't commit your `.env` file or share your AWS credentials. These should be kept private and only used in your local development environment. For production, use environment variables in your hosting platform (e.g., Heroku).

## Development

### Running the Application

1. Start the backend server:
```bash
npm start
```

2. In a new terminal, start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

### Building for Production

To build the application for production:
```bash
npm run build
```

## Deployment

The application is configured for deployment on Heroku with the following setup:
- Frontend is built and served as static files
- Backend runs as a Node.js server
- AWS S3 is used for data storage

### Heroku Deployment

1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Configure the environment variables in Heroku dashboard:
   - Go to Settings > Config Vars
   - Add the same environment variables as in your `.env` file
   - Don't commit these values to version control

3. Push to Heroku:
```bash
git push heroku main
```

## Testing

Run the test suite:
```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the repository or contact the maintainers. (brittany@notably.ai)