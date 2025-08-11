# Theft Detection Camera Streaming System

A comprehensive theft detection application built with **Spring Boot**, **Angular**, and **MySQL** that provides real-time camera streaming, video recording, and screenshot capture functionality.

## 🚀 Features

### Core Functionality
- **Real-time Camera Streaming**: Live camera feed accessible from web interface
- **Video Recording**: Record videos directly from camera stream
- **Screenshot Capture**: Take instant screenshots from the camera feed
- **Cross-Device Communication**: Camera stream from mobile device viewable on web interface
- **File Storage**: Secure storage and management of videos and screenshots
- **Session Management**: Track and manage camera streaming sessions

### Technical Features
- **WebSocket Communication**: Real-time bidirectional communication
- **Responsive Design**: Mobile-first responsive web interface
- **File Upload/Download**: Efficient file handling with progress tracking
- **Database Integration**: MySQL database for persistent storage
- **RESTful API**: Complete REST API for all operations
- **Security**: CORS configuration and secure file handling

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket/HTTP    ┌─────────────────┐    JPA/Hibernate    ┌─────────────┐
│                 │ ◄─────────────────► │                 │ ◄─────────────────► │             │
│  Angular Client │                     │  Spring Boot    │                     │   MySQL     │
│                 │                     │   Backend       │                     │  Database   │
└─────────────────┘                     └─────────────────┘                     └─────────────┘
```

### Backend (Spring Boot)
- **Entities**: CameraSession, VideoRecord, Screenshot
- **Controllers**: REST API endpoints for camera operations
- **WebSocket**: Real-time camera frame streaming
- **Services**: Business logic for camera and file management
- **Configuration**: CORS, Security, WebSocket setup

### Frontend (Angular)
- **Components**: Camera, Dashboard, Media Library
- **Services**: Camera service with WebSocket integration
- **Responsive UI**: Bootstrap-based modern interface

## 📋 Prerequisites

### Development Environment
- **Java 17+**
- **Node.js 18+**
- **MySQL 8.0+**
- **Maven 3.6+**
- **Angular CLI 17+**

### Database Setup
1. Install MySQL and create database:
```sql
CREATE DATABASE theft_detection_db;
```

2. Update database credentials in `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/theft_detection_db
    username: your_username
    password: your_password
```

## 🛠️ Installation & Setup

### 1. Backend Setup (Spring Boot)

```bash
# Clone repository
git clone <repository-url>
cd camera-streaming-app

# Install dependencies and run
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 2. Frontend Setup (Angular)

```bash
# Navigate to frontend directory
cd angular-frontend

# Install dependencies
npm install

# Start development server (now with HTTPS by default)
npm start
```

The frontend will start on `https://localhost:4200`.

> **Note on SSL**: The first time you run `npm start`, a self-signed SSL certificate will be automatically generated for you. This is essential for accessing the camera on mobile devices, which requires a secure (HTTPS) connection.

### 3. Create Upload Directories

```bash
mkdir -p /workspace/uploads/videos
mkdir -p /workspace/uploads/screenshots
```

## 🎯 Usage Guide

### 1. Starting Camera Stream

1. Navigate to the **Camera** page
2. Enter a unique **Device ID** (or use the auto-generated one)
3. Click **"Start Camera"** button
4. Grant camera permissions when prompted
5. Your camera feed will appear in the interface

### 2. Recording Videos

1. Start the camera stream
2. Click **"Start Recording"** button
3. Recording time will be displayed
4. Click **"Stop Recording"** to save the video
5. Video will be automatically uploaded and appear in recent captures

### 3. Taking Screenshots

1. Start the camera stream
2. Click **"Take Screenshot"** button
3. Screenshot will be captured and uploaded automatically
4. Image will appear in recent captures

### 4. Viewing Media

1. Navigate to **Media Library** page
2. Browse videos and screenshots in separate tabs
3. Filter by device using the dropdown
4. Download or view media files
5. Click on screenshots for full-size preview

### 5. Dashboard Overview

- View active camera sessions
- Monitor system statistics
- Check connection status
- Quick access to all features

## 🌐 API Endpoints

### Camera Operations
```
POST   /api/camera/start-session     - Start new camera session
POST   /api/camera/end-session       - End camera session
POST   /api/camera/upload-video      - Upload recorded video
POST   /api/camera/upload-screenshot - Upload screenshot
GET    /api/camera/active-sessions   - Get active sessions
GET    /api/camera/videos            - Get all videos
GET    /api/camera/screenshots       - Get all screenshots
GET    /api/camera/session/{id}      - Get session details
GET    /api/camera/download/video/{filename}    - Download video
GET    /api/camera/download/screenshot/{filename} - Download screenshot
```

### WebSocket Endpoints
```
/ws                              - WebSocket connection endpoint
/app/camera/frame/{sessionId}    - Send camera frames
/topic/camera/{sessionId}        - Subscribe to camera frames
/topic/sessions                  - Session notifications
```

## 📱 Using Your iPhone as a Camera

The application is designed to stream video from your phone's camera to the web interface. Here’s how to set it up:

### Step 1: Start the Server
On your computer, run `npm start` in the `angular-frontend` directory. The console will display the local IP address you can use to connect from your phone, for example:

```
  To access from your phone, browse to: https://192.168.1.107:4200
```

### Step 2: Connect from Your iPhone
1.  Open Safari on your iPhone and navigate to the `https://<YOUR_IP_ADDRESS>:4200` address shown in your terminal.
2.  You will see a warning about an "untrusted certificate". This is expected. Click **"Show Details"** and then **"visit this website"** to proceed.
3.  The application will load. Press the **"Start Camera"** button and grant the necessary camera permissions.

### Step 3: View the Stream on Your Desktop
1.  Once the camera is active on your phone, a **Session ID** will be displayed at the top of the screen.
2.  On your desktop browser (at `https://localhost:4200`), find the **"View-only session"** card.
3.  Enter the **Session ID** from your phone into the input field and click **"Join"**.

You should now see your iPhone's camera stream in the desktop web interface.

## 🔧 Configuration

### Backend Configuration (`application.yml`)
```yaml
server:
  port: 8080
  servlet:
    multipart:
      max-file-size: 100MB

file:
  upload-dir: /workspace/uploads/

websocket:
  endpoint: /ws
  allowed-origins: "http://localhost:4200"
```

### Frontend Configuration
- API URL: `http://localhost:8080`
- WebSocket URL: `http://localhost:8080/ws`
- File size limits: 100MB for videos

## 🛡️ Security Features

- **CORS Configuration**: Controlled cross-origin requests
- **File Validation**: File type and size validation
- **Session Management**: Secure session tracking
- **Input Sanitization**: Protection against malicious inputs

## 📊 Database Schema

### CameraSession Table
```sql
CREATE TABLE camera_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(255),
    start_time DATETIME,
    end_time DATETIME,
    is_active BOOLEAN,
    ip_address VARCHAR(255),
    user_agent TEXT
);
```

### VideoRecord Table
```sql
CREATE TABLE video_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT,
    duration INTEGER,
    recorded_at DATETIME,
    device_id VARCHAR(255),
    session_id VARCHAR(255),
    mime_type VARCHAR(255)
);
```

### Screenshot Table
```sql
CREATE TABLE screenshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT,
    captured_at DATETIME,
    device_id VARCHAR(255),
    session_id VARCHAR(255),
    mime_type VARCHAR(255),
    width INTEGER,
    height INTEGER
);
```

## 🚀 Deployment

### Production Deployment

1. **Build Backend**:
```bash
mvn clean package -Pproduction
```

2. **Build Frontend**:
```bash
cd angular-frontend
npm run build --prod
```

3. **Configure Database**: Update production database credentials

4. **Deploy**: Use Docker, AWS, or your preferred hosting platform

### Docker Support (Optional)
```dockerfile
# Backend Dockerfile
FROM openjdk:17-jdk-slim
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## 🔍 Troubleshooting

### Common Issues

1. **Camera Permission Denied**
   - Ensure HTTPS in production
   - Check browser camera permissions
   - Verify camera is not in use by other applications

2. **WebSocket Connection Failed**
   - Check backend is running on port 8080
   - Verify CORS configuration
   - Ensure no firewall blocking WebSocket connections

3. **File Upload Errors**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure sufficient disk space

4. **Database Connection Issues**
   - Verify MySQL is running
   - Check database credentials
   - Ensure database exists

## 📈 Performance Considerations

- **Video Compression**: Uses WebM format for optimal size
- **Frame Rate**: Streams at 10 FPS for balanced performance
- **File Storage**: Automatic cleanup of old files (implement as needed)
- **Database Indexing**: Optimized queries for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💡 Future Enhancements

- **Motion Detection**: AI-powered theft detection
- **Push Notifications**: Real-time alerts
- **Multi-Camera Support**: Multiple camera streams
- **Cloud Storage**: Integration with AWS S3/Google Cloud
- **User Authentication**: Multi-user support with roles
- **Mobile App**: Native mobile applications

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting section

---

**Built with ❤️ using Spring Boot, Angular, and MySQL**