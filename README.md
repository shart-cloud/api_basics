# API Basics - Educational REST API

A complete REST API built with Cloudflare Workers, HonoJS, and D1 database for teaching HTTP fundamentals, OAuth2 authentication, and API design.

## Features

- **OAuth2 Password Grant Flow**: Complete implementation with access tokens (1 hour) and refresh tokens (30 days)
- **Content Negotiation**: Automatically adapts responses based on client type
  - `curl` → Clean plaintext/ASCII output
  - Browsers → Simple HTML tables and forms
  - API clients → JSON responses
- **Full CRUD Operations**: Practice all HTTP verbs (GET, POST, PUT, DELETE)
- **User Profiles**: Manage user data with nested JSON preferences
- **Todo Management**: Complete todo list API for hands-on practice

## Tech Stack

- **Cloudflare Workers**: Serverless execution environment
- **HonoJS**: Fast, lightweight web framework
- **D1 Database**: SQLite-based serverless database
- **JWT**: JSON Web Tokens for authentication
- **Drizzle ORM**: Type-safe database queries

## Getting Started

### Option 1: Dev Container (Recommended for Students)

The easiest way to get started! No need to install Node.js, Go, or Terraform locally.

**Prerequisites:**
- Docker Desktop
- VS Code with Dev Containers extension

**Quick Start:**
1. Open this folder in VS Code
2. Click "Reopen in Container" when prompted
3. Wait for setup (~5-10 minutes first time)
4. Run `npm run dev`

See [DEV_CONTAINER_QUICKSTART.md](./DEV_CONTAINER_QUICKSTART.md) for details.

### Option 2: Local Installation

**Prerequisites:**
- Node.js 18+
- npm or yarn
- (Optional) Go 1.21+ for Terraform provider development
- (Optional) Terraform 1.7+ for testing providers

**Installation:**

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate:local

# Start development server
npm run dev
```

The API will be available at `https://api-basics.sharted.workers.dev`

## API Endpoints

### Authentication Endpoints

#### POST /register
Create a new user account.

**Request:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securepass123",
    "name": "Student Name"
  }'
```

**Response:**
```
SUCCESS: User registered successfully

userId: 1
email: student@example.com
name: Student Name
```

#### POST /token
Login and receive access + refresh tokens (OAuth2 password grant).

**Request:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securepass123"
  }'
```

**Response:**
```
SUCCESS: Operation completed

token_type: Bearer
access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
refresh_token: 204f76998800fff8a530b1f3794b93439995c92d...
expires_in: 3600
```

#### POST /refresh
Get a new access token using your refresh token.

**Request:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
```

#### POST /revoke
Logout by revoking your refresh token.

**Request:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "your_refresh_token_here"
  }'
```

### Profile Endpoints (Authentication Required)

All profile and todo endpoints require the `Authorization` header:
```
Authorization: Bearer <your_access_token>
```

#### GET /profile
Get your user profile.

**Request:**
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```
id: 1
email: student@example.com
name: Student Name
bio:
preferences: {}
createdAt: "2026-01-08T17:40:39.000Z"
updatedAt: "2026-01-08T17:40:39.000Z"
```

#### PUT /profile
Update your profile information.

**Request:**
```bash
curl -X PUT https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "bio": "I am learning REST APIs!",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }'
```

### Todo Endpoints (Authentication Required)

#### GET /todos
List all your todos.

**Request:**
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (curl):**
```
Found 2 item(s):

[1] id=1 userId=1 title=Learn REST APIs description=Complete the course completed=false ...
[2] id=2 userId=1 title=Build an API description=Create my own API completed=false ...
```

**Response (JSON client):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Learn REST APIs",
    "description": "Complete the course",
    "completed": false,
    "createdAt": "2026-01-08T17:41:11.000Z",
    "updatedAt": "2026-01-08T17:41:11.000Z"
  }
]
```

#### POST /todos
Create a new todo.

**Request:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn HTTP verbs",
    "description": "Understand GET, POST, PUT, DELETE"
  }'
```

#### GET /todos/:id
Get a specific todo by ID.

**Request:**
```bash
# Replace with your actual todo UUID from GET /todos
curl https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### PUT /todos/:id
Update a todo.

**Request:**
```bash
# Use your actual todo UUID
curl -X PUT https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

You can update any combination of: `title`, `description`, `completed`

**Note:** Todo IDs are UUIDs. You must get the exact UUID from `GET /todos` before updating.

#### DELETE /todos/:id
Delete a todo.

**Request:**
```bash
# Use your actual todo UUID
curl -X DELETE https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Educational Concepts Covered

### HTTP Methods
- **GET**: Retrieve resources (idempotent, safe)
- **POST**: Create new resources
- **PUT**: Update existing resources (idempotent)
- **DELETE**: Remove resources (idempotent)

### HTTP Headers
- `Content-Type`: Specifies request body format (application/json)
- `Authorization`: Bearer token authentication
- `User-Agent`: Client identification (triggers different response formats)

### HTTP Status Codes
- **200 OK**: Successful request
- **201 Created**: Resource successfully created
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server-side error

### Authentication & Security
- **OAuth2 Password Grant**: Username/password → tokens
- **JWT Access Tokens**: Short-lived (1 hour), stateless authentication
- **Refresh Tokens**: Long-lived (30 days), stored in database
- **Bearer Token Authorization**: Standard HTTP authentication scheme
- **Password Hashing**: bcrypt for secure password storage
- **Token Expiration**: Automatic timeout and refresh flow

### REST Principles
- **Resource-based URLs**: `/todos`, `/profile`
- **HTTP verbs for actions**: Not `/getTodos`, use `GET /todos`
- **Stateless**: Each request contains all needed information
- **Standard status codes**: Semantic meaning
- **JSON responses**: Standard data format

## Content Negotiation Examples

### curl (plaintext output)
```bash
curl https://api-basics.sharted.workers.dev/todos -H "Authorization: Bearer TOKEN"
# Returns easy-to-read ASCII text
```

### Browser (HTML tables)
Open `https://api-basics.sharted.workers.dev/todos` in a browser with Authorization header
- Returns formatted HTML with tables

### API Client (JSON)
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer TOKEN" \
  -H "User-Agent: PostmanRuntime/7.0"
# Returns structured JSON
```

## Database Schema

### users
- `id`: **UUID** (text primary key) - Prevents enumeration attacks
- `email`: Unique email address
- `password`: bcrypt hashed password
- `name`: User's display name
- `bio`: Optional biography text
- `preferences`: JSON object for user settings
- `createdAt`, `updatedAt`: Timestamps

### refresh_tokens
- `id`: Auto-incrementing primary key (internal only, not exposed)
- `token`: Unique refresh token string
- `userId`: **UUID** foreign key to users
- `expiresAt`: Token expiration timestamp
- `createdAt`: Token creation timestamp

### todos
- `id`: **UUID** (text primary key) - Prevents information leakage
- `userId`: **UUID** foreign key to users
- `title`: Todo title (required)
- `description`: Todo description (optional)
- `completed`: Boolean completion status
- `createdAt`, `updatedAt`: Timestamps

**Why UUIDs?**
- User IDs and Todo IDs are UUIDs to prevent enumeration attacks
- Attackers can't guess valid IDs or determine total user/todo count
- Only internal IDs (like refresh_tokens.id) use integers since they're never exposed

## Development Commands

```bash
# Start development server
npm run dev

# Generate new migrations after schema changes
npm run db:generate

# Apply migrations to local database
npm run db:migrate:local

# Apply migrations to production database
npm run db:migrate

# Deploy to Cloudflare Workers
npm run deploy
```

## Environment Variables

Set these in `wrangler.toml` for local development:

```toml
[vars]
JWT_SECRET = "your-secret-key-here"
JWT_ACCESS_EXPIRY = "3600"        # 1 hour in seconds
JWT_REFRESH_EXPIRY = "2592000"    # 30 days in seconds
```

For production, use `wrangler secret put` to set sensitive values.

## Project Structure

```
api-basics/
├── src/
│   ├── db/
│   │   └── schema.ts           # Database schema definitions
│   ├── lib/
│   │   ├── auth.ts             # JWT and password utilities
│   │   └── formatters.ts       # Response format handlers
│   ├── middleware/
│   │   └── auth.ts             # Authentication middleware
│   ├── types.ts                # TypeScript type definitions
│   └── index.ts                # Main application entry point
├── drizzle/                    # Database migrations
├── wrangler.toml               # Cloudflare Workers configuration
├── drizzle.config.ts           # Drizzle ORM configuration
└── package.json
```

## Teaching Tips

### Lesson 1: Basic HTTP
- Start with GET / to see documentation
- Register a user with POST /register
- Understand request body, headers, status codes

### Lesson 2: Authentication
- Login with POST /token
- Examine JWT structure (use jwt.io)
- Practice using Authorization header
- Try requests without token (401 errors)

### Lesson 3: CRUD Operations
- GET /todos (list/read)
- POST /todos (create)
- PUT /todos/:id (update)
- DELETE /todos/:id (delete)

### Lesson 4: OAuth2 Token Flow
- Access token expiration
- Using refresh tokens
- Token revocation (logout)
- Security best practices

### Lesson 5: Content Negotiation
- Compare curl vs browser responses
- Understand User-Agent header
- Test with different clients

## Common Student Mistakes

1. **Forgetting Content-Type header**: Always set `Content-Type: application/json` for POST/PUT
2. **Incorrect Authorization format**: Must be `Bearer <token>`, not just the token
3. **Using expired tokens**: Access tokens expire in 1 hour
4. **Not URL-encoding**: Special characters in URLs need encoding
5. **Mixing up IDs**: Using another user's todo ID (returns 404)

## Security Considerations

- Passwords are hashed with bcrypt (never stored plain text)
- JWTs are signed and verified
- Refresh tokens are stored server-side for revocation
- Each user can only access their own resources
- SQL injection prevented by parameterized queries
- CORS not enabled by default (add if needed)

## Next Steps

After completing this course, students can:
- Build their own REST APIs
- Understand OAuth2 and JWT authentication
- Design RESTful URL structures
- Handle errors appropriately
- Test APIs with curl and Postman
- Deploy serverless APIs to production

## License

MIT - Free for educational use
