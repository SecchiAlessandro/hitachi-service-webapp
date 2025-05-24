# Hitachi Service Department Web Application

A comprehensive service management web application designed specifically for Hitachi service departments. This full-stack application provides task management, authentication, email notifications, knowledge base, and AI chatbot functionality with modern Material-UI design and Hitachi branding.

![Hitachi Logo](https://www.hitachi.com/rev/assets/images/common/header-logo.svg)

## 🚀 Features

### Core Functionality
- **Task Management**: Create, assign, update, and track maintenance tasks
- **User Authentication**: Secure JWT-based authentication system
- **Email Notifications**: Automated email reminders for upcoming tasks
- **Profile Management**: Customizable user profiles with customer site information
- **Dashboard Analytics**: Real-time statistics and task completion metrics

### Advanced Features
- **Knowledge Base**: Searchable database of equipment information and procedures
- **AI Chatbot**: Intelligent assistant for technical support and guidance
- **Responsive Design**: Mobile-friendly interface with modern Material-UI components
- **Automatic Reminders**: Email notifications for tasks due within 7 days
- **Equipment Tracking**: Comprehensive equipment type and location management

### UI/UX Features
- **Hitachi Branding**: Professional corporate design with Hitachi colors and typography
- **Dark/Light Theme**: Customizable interface themes
- **Real-time Updates**: Live dashboard statistics and notifications
- **Intuitive Navigation**: Clean, professional sidebar navigation
- **Responsive Grid**: Adaptive layouts for all screen sizes

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Material-UI (MUI) 5** - Professional UI component library
- **React Router 6** - Client-side routing
- **Axios** - HTTP client for API communication
- **Date-fns** - Date manipulation and formatting
- **React Hot Toast** - Elegant notifications

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **SQLite with better-sqlite3** - Lightweight database solution
- **JWT** - JSON Web Token authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email sending functionality
- **node-cron** - Scheduled task execution

### Development Tools
- **Concurrently** - Run multiple npm scripts simultaneously
- **Nodemon** - Development server with auto-restart
- **ESLint** - Code linting and formatting

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/SecchiAlessandro/hitachi-service-webapp.git
   cd hitachi-service-webapp
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=development
   
   # JWT Secret (generate a strong random string)
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # Email Configuration (Gmail SMTP)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   
   # Database
   DB_PATH=./database/hitachi_service.db
   ```

4. **Initialize the database**
   ```bash
   cd backend
   npm run init-db
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 🚀 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the production server**
   ```bash
   cd backend
   npm start
   ```

### Environment Variables for Production

Ensure all environment variables are properly configured for production:
- Use a strong JWT secret
- Configure proper email credentials
- Set NODE_ENV=production
- Use secure database path

## 📁 Project Structure

```
hitachi-service-webapp/
├── backend/                 # Backend API server
│   ├── database/           # SQLite database files
│   ├── middleware/         # Express middleware
│   ├── routes/            # API route handlers
│   ├── scripts/           # Database initialization scripts
│   ├── services/          # Business logic services
│   └── server.js          # Main server file
├── frontend/               # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Main application pages
│   │   ├── theme/         # Material-UI theme configuration
│   │   └── App.js         # Main React application
├── package.json           # Root package configuration
└── README.md              # Project documentation
```

## 🔧 Configuration

### Email Setup (Gmail)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password
   - Use this password in the EMAIL_PASS environment variable

### Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `tasks` - Service tasks and maintenance items
- `knowledge_base` - Equipment information and procedures
- `email_notifications` - Email notification logs

## 🎯 Usage

### Default Admin Account
- **Email**: admin@hitachi.com
- **Password**: admin123

### Creating Tasks
1. Navigate to the Tasks page
2. Click "New Task" button
3. Fill in task details (title, description, priority, due date, equipment, location)
4. Assign to a user and save

### Email Notifications
- Automatic emails are sent for tasks due within 7 days
- Email reminders are sent every 30 minutes (in development mode)
- Manual email testing available via `/api/email/test` endpoint

### Chatbot Usage
- Access the chatbot via the chat icon in the bottom right
- Ask questions about equipment, procedures, or general technical support
- The chatbot uses the knowledge base to provide relevant answers

## 🔒 Security Features

- JWT-based authentication with secure token expiration
- Password hashing using bcrypt
- Protected API routes with middleware authentication
- Input validation and sanitization
- Rate limiting on authentication endpoints

## 📧 Email System

The application includes a comprehensive email notification system:
- **Automatic Reminders**: Tasks due within 7 days trigger email notifications
- **Scheduled Checks**: Server checks for upcoming tasks every 30 minutes
- **Duplicate Prevention**: Email logs prevent sending duplicate reminders
- **Gmail Integration**: Uses Gmail SMTP with app password authentication

## 🎨 Theming and Branding

The application features professional Hitachi branding:
- Corporate red color scheme (#d32f2f)
- Professional typography with Roboto font
- Consistent spacing and component styling
- Responsive design for all devices
- Customizable customer names in sidebar

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the knowledge base within the application
- Use the built-in chatbot for technical assistance

## 🙏 Acknowledgments

- **Hitachi** for the professional branding and corporate identity
- **Material-UI** team for the excellent React component library
- **Node.js** and **Express.js** communities for robust backend tools
- **SQLite** for the lightweight and efficient database solution

---

**Built with ❤️ for Hitachi Service Departments** 