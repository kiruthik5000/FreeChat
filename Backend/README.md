# 💬 LANChat

A real-time group chat application designed for **Local Area Network (LAN)** communication. Built with **Spring Boot 4** and **MongoDB**, LANChat provides a WhatsApp-like experience for users on the same network — no internet required.

---

## ✨ Features

- **User Authentication** — Sign up & login with college-ID-based unique IDs and BCrypt-encrypted passwords.
- **Group Chat** — Create, join, and delete chat groups with UUID-based group identifiers.
- **Real-time Messaging** — Send and receive messages within groups over WebSocket.
- **Today's Chats Filter** — Toggle between viewing all messages or only today's conversations.
- **Role-based Group Deletion** — Only registered users can delete groups (master authorization).
- **Responsive Frontend** — Modern, glassmorphism-styled UI with dark mode, built with vanilla HTML/CSS/JS.
- **Swagger API Docs** — Auto-generated OpenAPI documentation via SpringDoc.

---

## 🛠️ Tech Stack

| Layer       | Technology                             |
|-------------|----------------------------------------|
| Backend     | Java 17, Spring Boot 4.1               |
| Database    | MongoDB                                |
| Security    | Spring Security, BCrypt                |
| API Docs    | SpringDoc OpenAPI (Swagger UI)         |
| Frontend    | HTML5, CSS3, Vanilla JavaScript        |
| Build Tool  | Maven                                  |
| Utilities   | Lombok                                 |

---

## 📁 Project Structure

```
LANChat/
├── pom.xml
├── src/main/java/com/lanchat/
│   ├── LanChatApplication.java          # Application entry point
│   ├── config/
│   │   ├── AuthService.java             # Sign-up & login logic
│   │   └── SecurityConfig.java          # Spring Security & BCrypt config
│   ├── controller/
│   │   ├── ChatController.java          # Chat REST endpoints
│   │   ├── GroupController.java         # Group REST endpoints
│   │   └── UserController.java          # User auth REST endpoints
│   ├── dto/
│   │   ├── GroupDto.java                # Group creation payload
│   │   ├── LoginDto.java               # Login payload
│   │   └── UserDto.java                # Registration payload
│   ├── entity/
│   │   ├── BaseEntity.java             # Common fields (id, timestamps)
│   │   ├── Chat.java                   # Chat message document
│   │   ├── Group.java                  # Chat group document
│   │   └── User.java                   # User document
│   ├── exception/
│   │   ├── ErrorResponse.java          # Standardized error body
│   │   ├── GlobalExceptionHandler.java # Centralized exception handling
│   │   ├── GroupNotFoundException.java
│   │   ├── InvalidUniqueIdException.java
│   │   └── UserUnauthorizedException.java
│   ├── repository/
│   │   ├── ChatRepository.java
│   │   ├── GroupRepository.java
│   │   └── UserRepository.java
│   └── service/
│       ├── ChatService.java            # Chat business logic
│       ├── GroupService.java           # Group business logic
│       └── UserService.java           # User business logic
├── src/main/resources/
│   ├── application.properties           # App & MongoDB config
│   └── static/
│       ├── index.html                   # Single-page frontend
│       ├── style.css                    # UI styles (dark theme)
│       └── app.js                       # Frontend application logic
```

---

## 🚀 Getting Started

### Prerequisites

- **Java 17+**
- **Maven 3.8+**
- **MongoDB** running on `localhost:27017`

### Setup & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/LANChat.git
   cd LANChat
   ```

2. **Start MongoDB**
   ```bash
   mongod
   ```

3. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```
   On Windows:
   ```bash
   mvnw.cmd spring-boot:run
   ```

4. **Open the app** — navigate to `http://localhost:8080` in your browser.

5. **API Docs** — Swagger UI is available at `http://localhost:8080/swagger-ui.html`.

### Configuration

Edit `src/main/resources/application.properties` to customize:

```properties
spring.application.name=LANChat
spring.mongodb.host=localhost
spring.mongodb.port=27017
spring.mongodb.database=LAN
```

---

## 📡 API Reference

### Users

| Method | Endpoint              | Description         | Request Body          |
|--------|-----------------------|---------------------|-----------------------|
| POST   | `/api/users/create`   | Register a new user | `UserDto`             |
| POST   | `/api/users/login`    | Login               | `LoginDto`            |

> **Note:** Unique ID must start with `727723EUIT` (college register number format).

### Groups

| Method | Endpoint               | Description       | Params / Body          |
|--------|------------------------|-------------------|------------------------|
| GET    | `/api/groups/`         | List all groups   | —                      |
| POST   | `/api/groups/create`   | Create a group    | `GroupDto` (body)      |
| DELETE | `/api/groups/delete`   | Delete a group    | `groupId`, `userId` (query) |

### Chats

| Method | Endpoint             | Description            | Params / Body          |
|--------|----------------------|------------------------|------------------------|
| GET    | `/api/chats/`        | Get today's chats      | `groupId` (query)      |
| GET    | `/api/chats/all`     | Get all chats in group | `groupId` (query)      |
| POST   | `/api/chats/post`    | Send a message         | `Chat` (body)          |

---

## 🗂️ Data Models

### User
```json
{
  "uniqueId": "727723EUIT001",
  "name": "John Doe",
  "password": "<bcrypt-hashed>"
}
```

### Group
```json
{
  "groupId": "<auto-generated-uuid>",
  "groupName": "Study Group"
}
```

### Chat
```json
{
  "name": "John Doe",
  "groupId": "<group-uuid>",
  "message": "Hello everyone!"
}
```

All entities inherit `BaseEntity` which provides `id`, `createdAt`, and `updatedAt` fields with MongoDB auditing.

---

## 🔒 Security

- Passwords are hashed using **BCrypt** before storage.
- All API endpoints are currently **open** (no token-based auth) — suited for trusted LAN environments.
- Group deletion requires the caller's user ID to be a registered user (master check).

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
