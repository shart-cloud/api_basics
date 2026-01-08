# API Basics: A Complete Course
## From HTTP Fundamentals to OAuth 2.0

**Course Duration:** 8-12 hours
**Difficulty:** Beginner to Intermediate
**Prerequisites:** Basic command line knowledge, text editor

---

## Table of Contents

1. [Module 1: API and HTTP Fundamentals](#module-1-api-and-http-fundamentals)
2. [Module 2: Making Your First API Requests](#module-2-making-your-first-api-requests)
3. [Module 3: HTTP Methods and CRUD Operations](#module-3-http-methods-and-crud-operations)
4. [Module 4: Understanding Headers and Status Codes](#module-4-understanding-headers-and-status-codes)
5. [Module 5: Authentication Basics](#module-5-authentication-basics)
6. [Module 6: OAuth 2.0 Deep Dive](#module-6-oauth-20-deep-dive)
7. [Module 7: Token Lifecycle Management](#module-7-token-lifecycle-management)
8. [Module 8: Real-World API Patterns](#module-8-real-world-api-patterns)
9. [Final Project](#final-project)

---

## Module 1: API and HTTP Fundamentals

### Learning Objectives
By the end of this module, you will:
- Understand what an API is and why it matters
- Know the basics of HTTP protocol
- Understand client-server architecture
- Learn about URLs and endpoints

### 1.1 What is an API?

**API (Application Programming Interface)** is a way for different software applications to communicate with each other.

**Real-world analogy:** Think of a restaurant:
- **You (Client)** want food but don't know how to cook it
- **Menu (API Documentation)** tells you what's available
- **Waiter (API)** takes your order and brings back food
- **Kitchen (Server)** prepares the food

**In our course:**
- **Client:** Your terminal running curl commands
- **API:** The API Basics service running on https://api-basics.sharted.workers.dev
- **Server:** Cloudflare Workers with D1 database

### 1.2 HTTP Protocol Basics

**HTTP (HyperText Transfer Protocol)** is the foundation of data communication on the web.

**Key Concepts:**

1. **Request/Response Cycle**
   - Client sends a REQUEST to server
   - Server processes the request
   - Server sends a RESPONSE back to client

2. **HTTP Request Components**
   - **Method/Verb:** What action to perform (GET, POST, PUT, DELETE)
   - **URL/Endpoint:** Where to send the request
   - **Headers:** Metadata about the request
   - **Body:** Data sent with the request (optional)

3. **HTTP Response Components**
   - **Status Code:** Did it work? (200, 404, 500, etc.)
   - **Headers:** Metadata about the response
   - **Body:** The actual data returned

### 1.3 Understanding URLs and Endpoints

**URL Structure:**
```
https://api-basics.sharted.workers.dev/todos/1
└─┬─┘ └─────┬──────┘ └─┬──┘└┬┘
  │         │          │   │
Protocol   Host      Path  ID
```

**Endpoints** are specific paths on an API that perform different functions:
- `/register` - Create an account
- `/token` - Login
- `/profile` - Get user info
- `/todos` - Manage todos

### 1.4 Exercise: Your First API Call

Let's make your first API request to see the documentation:

```bash
curl https://api-basics.sharted.workers.dev/
```

**Expected Output:**
```
API Basics - Educational REST API
==================================

Available Endpoints:
...
```

**What just happened?**
1. curl sent an HTTP GET request to the root endpoint `/`
2. The server received the request
3. The server returned the documentation as plain text
4. You saw the response in your terminal

**Question to ponder:** Why did we get plain text and not HTML or JSON?

---

## Module 2: Making Your First API Requests

### Learning Objectives
- Use curl to make API requests
- Understand GET requests
- Read and interpret API responses
- Debug common issues

### 2.1 Introduction to curl

**curl** is a command-line tool for making HTTP requests. It's used by developers worldwide to test APIs.

**Basic curl syntax:**
```bash
curl [options] <url>
```

**Common curl options:**
- `-X POST` - Specify HTTP method (default is GET)
- `-H "Header: Value"` - Add a header
- `-d '{"key":"value"}'` - Send data in request body
- `-v` - Verbose mode (shows request/response details)
- `-i` - Include response headers in output

### 2.2 Understanding GET Requests

**GET** requests retrieve data from the server. They should not modify anything.

**Characteristics:**
- Safe: Doesn't change server state
- Idempotent: Same request = same result
- Cacheable: Can be cached by browsers/proxies
- Data sent in URL (query parameters)

### 2.3 Exercise: Exploring the API

Try these GET requests:

**1. Get the API documentation:**
```bash
curl https://api-basics.sharted.workers.dev/
```

**2. Try to access your profile (this will fail - that's expected!):**
```bash
curl https://api-basics.sharted.workers.dev/profile
```

**Expected Output:**
```
ERROR: Unauthorized

Missing or invalid Authorization header. Expected: Authorization: Bearer <token>
```

**Why did it fail?** The `/profile` endpoint requires authentication. We'll learn about this in Module 5.

**3. Try accessing todos (also will fail):**
```bash
curl https://api-basics.sharted.workers.dev/todos
```

### 2.4 Understanding Error Messages

Notice the error message is helpful:
- It tells you WHAT went wrong: "Unauthorized"
- It tells you WHY: "Missing or invalid Authorization header"
- It tells you HOW to fix it: "Expected: Authorization: Bearer <token>"

Good APIs provide clear error messages. Bad APIs just say "Error 401".

### 2.5 Exercise: Using Verbose Mode

Let's see what's really happening behind the scenes:

```bash
curl -v https://api-basics.sharted.workers.dev/
```

**You'll see:**
- Request headers curl sends automatically
- HTTP version used (HTTP/1.1)
- Status code in the response (200 OK)
- Response headers from the server
- The actual response body

**Key observations:**
1. curl automatically sends headers like `User-Agent: curl/...`
2. The server returns `Content-Type: text/plain`
3. Status code `200` means success

---

## Module 3: HTTP Methods and CRUD Operations

### Learning Objectives
- Understand the four main HTTP methods
- Learn CRUD operations (Create, Read, Update, Delete)
- Know when to use each method
- Understand idempotency

### 3.1 The Four Main HTTP Methods

| HTTP Method | CRUD Operation | Purpose | Idempotent? |
|-------------|----------------|---------|-------------|
| GET | Read | Retrieve data | Yes |
| POST | Create | Create new resource | No |
| PUT | Update | Update existing resource | Yes |
| DELETE | Delete | Remove resource | Yes |

### 3.2 Idempotency Explained

**Idempotent** means making the same request multiple times has the same effect as making it once.

**Examples:**

**GET /profile** (Idempotent ✓)
- Call once: Get profile
- Call 100 times: Still just get profile, nothing changes

**POST /todos** (NOT Idempotent ✗)
- Call once: Create 1 todo
- Call 100 times: Create 100 todos (probably not what you want!)

**PUT /todos/a0ba571e-...** (Idempotent ✓)
- Call once: Update the todo
- Call 100 times: Todo still has same update

**DELETE /todos/a0ba571e-...** (Idempotent ✓)
- Call once: Todo deleted
- Call 100 times: Todo still deleted (might return 404 after first deletion)

### 3.3 RESTful Design Principles

**REST (Representational State Transfer)** is an architectural style for designing APIs.

**Key principles:**

1. **Resource-based URLs**
   - Good: `GET /todos`, `POST /todos`
   - Bad: `GET /getTodos`, `POST /createTodo`

2. **Use HTTP methods for actions**
   - URL identifies the resource
   - Method identifies the action
   - Don't put actions in URLs

3. **Stateless requests**
   - Each request contains all information needed
   - Server doesn't remember previous requests
   - Authentication sent with every request

4. **Standard status codes**
   - 200: Success
   - 201: Created
   - 400: Bad request
   - 401: Unauthorized
   - 404: Not found

### 3.4 Understanding POST Requests

**POST** requests create new resources. They include data in the request body.

**Anatomy of a POST request:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/endpoint \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

**Breaking it down:**
- `-X POST` - Use POST method
- `-H "Content-Type: application/json"` - Tell server we're sending JSON
- `-d '{"key": "value"}'` - The JSON data (request body)

**Important:** Always set `Content-Type: application/json` when sending JSON data!

### 3.5 Exercise: Creating an Account

Let's create your account on the API:

```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "SecurePassword123",
    "name": "Your Name"
  }'
```

**Expected Output:**
```
SUCCESS: User registered successfully

userId: 1
email: your-email@example.com
name: Your Name
```

**What happened?**
1. You sent a POST request to `/register`
2. Server validated the data (email format, password length)
3. Server hashed the password (never stores plain text!)
4. Server created user in database
5. Server returned success with user details

**Try it again - what happens?**

```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "SecurePassword123",
    "name": "Your Name"
  }'
```

**Expected Output:**
```
ERROR: Conflict

User with this email already exists
```

**Status code: 409 Conflict** - Resource already exists. This demonstrates why POST is not idempotent!

### 3.6 Common Mistakes

**❌ Mistake 1: Forgetting Content-Type header**
```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -d '{"email":"test@test.com","password":"pass","name":"Test"}'
```
Result: Server might not parse JSON correctly

**❌ Mistake 2: Using single quotes inside single quotes**
```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{'email':'test@test.com'}'
```
Result: Shell syntax error

**✅ Correct: Use double quotes for JSON, escape if needed**
```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass123","name":"Test"}'
```

---

## Module 4: Understanding Headers and Status Codes

### Learning Objectives
- Understand HTTP headers and their purposes
- Master HTTP status codes
- Learn content negotiation
- Debug API issues using headers

### 4.1 What are HTTP Headers?

**Headers** are key-value pairs that provide metadata about the request or response.

**Common Request Headers:**
- `Content-Type` - Format of the data being sent
- `Authorization` - Authentication credentials
- `User-Agent` - Information about the client
- `Accept` - Format client wants in response

**Common Response Headers:**
- `Content-Type` - Format of the data being returned
- `Content-Length` - Size of the response body
- `Date` - When the response was generated

### 4.2 HTTP Status Codes Deep Dive

Status codes tell you the outcome of your request.

**2xx - Success**
- `200 OK` - Request succeeded
- `201 Created` - Resource successfully created
- `204 No Content` - Success but no data to return

**4xx - Client Errors (You made a mistake)**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Authenticated but not allowed
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource already exists

**5xx - Server Errors (Server has a problem)**
- `500 Internal Server Error` - Server crashed
- `502 Bad Gateway` - Server got invalid response from upstream
- `503 Service Unavailable` - Server temporarily down

### 4.3 Content Negotiation

Our API adapts its response format based on the `User-Agent` header!

**Test 1: curl user agent (plaintext)**
```bash
curl https://api-basics.sharted.workers.dev/
```
Returns: Plain text

**Test 2: Browser user agent (HTML)**
```bash
curl -H "User-Agent: Mozilla/5.0" https://api-basics.sharted.workers.dev/
```
Returns: HTML

**Test 3: API client user agent (JSON)**
```bash
curl -H "User-Agent: PostmanRuntime/7.0" https://api-basics.sharted.workers.dev/
```
Returns: Plain text (still detects curl in actual user agent)

**Better JSON test:**
```bash
curl https://api-basics.sharted.workers.dev/ \
  -H "User-Agent: MyApp/1.0" \
  -H "Accept: application/json"
```

### 4.4 Exercise: Examining Headers

Let's see all headers in a response:

```bash
curl -i https://api-basics.sharted.workers.dev/
```

The `-i` flag includes headers in the output.

**You'll see something like:**
```
HTTP/1.1 200 OK
Content-Type: text/plain;charset=UTF-8
Content-Length: 1556
Date: Wed, 08 Jan 2026 17:00:00 GMT

API Basics - Educational REST API
...
```

**Analysis:**
- `HTTP/1.1` - Protocol version
- `200 OK` - Status code and message
- `Content-Type: text/plain` - Response is plain text
- `Content-Length: 1556` - Response is 1556 bytes
- Blank line separates headers from body

---

## Module 5: Authentication Basics

### Learning Objectives
- Understand why authentication is needed
- Learn about different authentication methods
- Master token-based authentication
- Use Bearer tokens in requests

### 5.1 Why Authentication?

**Problem:** How does the server know who you are?

Without authentication:
- Anyone could read anyone's todos
- Anyone could modify anyone's profile
- No privacy or security

**Authentication** proves you are who you say you are.

### 5.2 Authentication Methods

**1. Basic Auth (Don't use in production)**
- Send username:password with every request
- Encoded in Base64 (not encrypted!)
- Example: `Authorization: Basic dXNlcjpwYXNz`

**2. API Keys**
- Long random string identifies you
- Sent in header or query parameter
- Example: `Authorization: ApiKey abc123...`

**3. Token-Based (What we use)**
- Login once, get a token
- Send token with subsequent requests
- Token expires after some time
- Example: `Authorization: Bearer eyJhbG...`

**Why tokens are better:**
- Don't send password with every request
- Can expire (time-limited access)
- Can be revoked (instant logout)
- Can have limited permissions

### 5.3 Bearer Token Authentication

**Bearer token** means "whoever bears (has) this token has access."

**Format:**
```
Authorization: Bearer <token>
```

**Important notes:**
- There's a space after "Bearer"
- The token itself contains no spaces
- Tokens are usually long strings of random characters

### 5.4 Exercise: Login and Get Your Token

**Step 1: Login**
```bash
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "SecurePassword123"
  }'
```

**Expected Output:**
```
SUCCESS: Operation completed

token_type: Bearer
access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoieW91ci1lbWFpbEBleGFtcGxlLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3Njc4OTQwNDcsImV4cCI6MTc2Nzg5NzY0N30.d9yk35SYLZ5QcQ8k4LKxsJ2-avqskhZtYdEseEW7UZY
refresh_token: 204f76998800fff8a530b1f3794b93439995c92d9adceb64f4e4a93ae9d745fb
expires_in: 3600
```

**Save your tokens!** You'll need them for the next exercises.

**Notice the userId:** It's a UUID like `5b6d8fd7-0c83-4e85-b604-39ee43af55eb`, not a sequential number. This prevents attackers from enumerating users.

**Step 2: Use your access token**

Copy your `access_token` from above and use it:

```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Replace `YOUR_ACCESS_TOKEN_HERE` with your actual token.

**Expected Output:**
```
id: 1
email: your-email@example.com
name: Your Name
bio:
preferences: {}
createdAt: "2026-01-08T17:40:39.000Z"
updatedAt: "2026-01-08T17:40:39.000Z"
```

**Success!** You've authenticated and accessed your profile.

### 5.5 What's in a Token? (JWT Basics)

Your access token is a **JWT (JSON Web Token)**. It has three parts separated by dots:

```
eyJhbGc...  .  eyJ1c2Vy...  .  d9yk35SY...
   │             │              │
 Header        Payload       Signature
```

**Visit jwt.io and paste your token to decode it.**

You'll see something like:
```json
{
  "userId": "5b6d8fd7-0c83-4e85-b604-39ee43af55eb",
  "email": "your-email@example.com",
  "type": "access",
  "iat": 1767894047,
  "exp": 1767897647
}
```

**Important fields:**
- `userId` - Your user ID
- `email` - Your email
- `type` - "access" (not a refresh token)
- `iat` - Issued at timestamp
- `exp` - Expires at timestamp (1 hour from iat)

**Security note:** Anyone can read a JWT, but they can't modify it without invalidating the signature!

### 5.6 Exercise: Test Authorization Failures

**Test 1: No authorization header**
```bash
curl https://api-basics.sharted.workers.dev/profile
```

Expected: `ERROR: Unauthorized`

**Test 2: Wrong token format**
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: WrongFormat"
```

Expected: `ERROR: Unauthorized`

**Test 3: Invalid token**
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer fake-token-123"
```

Expected: `ERROR: Unauthorized - Invalid or expired access token`

---

## Module 6: OAuth 2.0 Deep Dive

### Learning Objectives
- Understand OAuth 2.0 framework
- Learn the password grant flow
- Distinguish between access and refresh tokens
- Understand token security

### 6.1 What is OAuth 2.0?

**OAuth 2.0** is an authorization framework that enables applications to obtain limited access to user accounts.

**Real-world example:**
- You want to use "Sign in with Google" on a website
- You authorize the website to access your Google profile
- Google gives the website a token
- Website uses token to access your info (but not your password!)

**Key concepts:**
- **Resource Owner:** You (the user)
- **Client:** The application wanting access
- **Authorization Server:** Issues tokens (in our case, our API)
- **Resource Server:** Hosts the protected resources (also our API)

### 6.2 OAuth 2.0 Grant Types

OAuth 2.0 has several "flows" (grant types) for different scenarios:

**1. Authorization Code (Most secure - for web apps)**
- User redirected to authorization server
- User logs in and approves
- Server gives authorization code
- Client exchanges code for token

**2. Implicit (Deprecated - was for mobile/JS)**
- Token returned directly in URL
- Less secure, avoid this

**3. Client Credentials (For server-to-server)**
- No user involved
- App authenticates itself
- Gets token for its own access

**4. Password Grant (What we implement)**
- User gives username/password to client
- Client sends credentials to server
- Server returns tokens
- **Only use when you trust the client!**

### 6.3 Why Password Grant for This Course?

**Pros:**
- Simple to understand and test
- Works great with curl
- Good for learning token mechanics
- Appropriate for first-party apps

**Cons:**
- User shares password with client
- Not suitable for third-party apps
- OAuth 2.1 deprecates this flow


### 6.4 Access Tokens vs Refresh Tokens

Our API issues TWO types of tokens:

| Aspect | Access Token | Refresh Token |
|--------|-------------|---------------|
| **Purpose** | Access protected resources | Get new access tokens |
| **Lifetime** | Short (1 hour) | Long (30 days) |
| **Storage** | Stateless (JWT) | Stored in database |
| **Revocable** | No (expires naturally) | Yes (can be deleted) |
| **Used in** | Authorization header | Refresh endpoint |

**Why two tokens?**

**Security trade-off:**
- Short-lived access tokens limit damage if stolen
- Long-lived refresh tokens avoid frequent re-authentication
- If refresh token stolen, can be revoked server-side

### 6.5 Token Flow Diagram

```
┌────────┐                                  ┌────────┐
│ Client │                                  │ Server │
└───┬────┘                                  └───┬────┘
    │                                           │
    │  POST /token                              │
    │  { email, password }                      │
    │──────────────────────────────────────────>│
    │                                           │
    │                              Verify creds │
    │                              Generate JWT │
    │                        Store refresh token│
    │                                           │
    │  200 OK                                   │
    │  { access_token, refresh_token }          │
    │<──────────────────────────────────────────│
    │                                           │
    │  GET /profile                             │
    │  Authorization: Bearer <access_token>     │
    │──────────────────────────────────────────>│
    │                                           │
    │                              Verify JWT   │
    │                              Get user data│
    │                                           │
    │  200 OK                                   │
    │  { id, email, name, ... }                 │
    │<──────────────────────────────────────────│
    │                                           │
    │  [1 hour later, access token expired]     │
    │                                           │
    │  POST /refresh                            │
    │  { refresh_token }                        │
    │──────────────────────────────────────────>│
    │                                           │
    │                    Verify refresh token   │
    │                    Generate new JWT       │
    │                                           │
    │  200 OK                                   │
    │  { access_token }                         │
    │<──────────────────────────────────────────│
```

### 6.6 Exercise: Complete OAuth 2.0 Flow

Let's walk through the complete flow step by step.

**Step 1: Initial Login (Password Grant)**

```bash
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "SecurePassword123"
  }'
```

**Save your response in a file for easy reference:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "SecurePassword123"
  }' > tokens.txt
```

**What you received:**
- `access_token` - Use this for API requests (expires in 1 hour)
- `refresh_token` - Use this to get new access tokens (expires in 30 days)
- `token_type` - Always "Bearer"
- `expires_in` - Seconds until access token expires (3600 = 1 hour)

**Step 2: Use Access Token**

```bash
# Replace YOUR_ACCESS_TOKEN with your actual token
export ACCESS_TOKEN="YOUR_ACCESS_TOKEN"

curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Step 3: Simulate Token Expiry**

In production, your access token expires after 1 hour. Let's test the refresh flow.

**Important:** Save your refresh token:
```bash
export REFRESH_TOKEN="YOUR_REFRESH_TOKEN"
```

**Step 4: Refresh Your Access Token**

```bash
curl -X POST https://api-basics.sharted.workers.dev/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

**You get a new access token!** The refresh token stays the same.

**Step 5: Logout (Revoke Refresh Token)**

```bash
curl -X POST https://api-basics.sharted.workers.dev/revoke \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

**Step 6: Try to Refresh Again (Should Fail)**

```bash
curl -X POST https://api-basics.sharted.workers.dev/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

Expected: `ERROR: Not Found - Refresh token not found`

**This is logout!** Once revoked, the refresh token cannot be used again.

### 6.7 Security Best Practices

**DO:**
- ✅ Store tokens securely (not in code, not in localStorage for XSS risk)
- ✅ Use HTTPS in production (we use HTTP for local dev only)
- ✅ Set appropriate token expiry times
- ✅ Revoke tokens on logout
- ✅ Validate tokens on every request
- ✅ Use refresh tokens to minimize password transmission

**DON'T:**
- ❌ Store passwords anywhere
- ❌ Share tokens between users
- ❌ Put tokens in URLs (can be logged)
- ❌ Store refresh tokens in JWT
- ❌ Make access tokens too long-lived
- ❌ Skip token validation

---

## Module 7: Token Lifecycle Management

### Learning Objectives
- Manage token expiration gracefully
- Implement automatic token refresh
- Handle authentication errors
- Understand token storage

### 7.1 Token Expiration Handling

**The problem:** Your access token expires after 1 hour. How should your app handle this?

**Strategy 1: Reactive (Handle errors)**
```
1. Try to make API request
2. Get 401 Unauthorized error
3. Refresh token
4. Retry original request
```

**Strategy 2: Proactive (Check expiry)**
```
1. Decode JWT to check exp timestamp
2. If expires soon, refresh first
3. Then make API request
```

### 7.2 Exercise: Building a Smart API Client

Let's create a bash script that handles token refresh automatically.

Create a file called `api-client.sh`:

```bash
#!/bin/bash

# Configuration
API_BASE="https://api-basics.sharted.workers.dev"
TOKEN_FILE=".tokens"

# Function: Login
login() {
    echo "Logging in..."
    RESPONSE=$(curl -s -X POST "$API_BASE/token" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$1\",\"password\":\"$2\"}")

    ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)

    echo "ACCESS_TOKEN=$ACCESS_TOKEN" > "$TOKEN_FILE"
    echo "REFRESH_TOKEN=$REFRESH_TOKEN" >> "$TOKEN_FILE"

    echo "Login successful! Tokens saved."
}

# Function: Refresh tokens
refresh() {
    echo "Refreshing access token..."
    source "$TOKEN_FILE"

    RESPONSE=$(curl -s -X POST "$API_BASE/refresh" \
        -H "Content-Type: application/json" \
        -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")

    ACCESS_TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

    # Update only access token, keep refresh token
    sed -i "s/ACCESS_TOKEN=.*/ACCESS_TOKEN=$ACCESS_TOKEN/" "$TOKEN_FILE"

    echo "Token refreshed!"
}

# Function: Make authenticated request
api_get() {
    source "$TOKEN_FILE"

    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE$1" \
        -H "Authorization: Bearer $ACCESS_TOKEN")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" -eq 401 ]; then
        echo "Token expired, refreshing..."
        refresh
        source "$TOKEN_FILE"
        curl -s "$API_BASE$1" \
            -H "Authorization: Bearer $ACCESS_TOKEN"
    else
        echo "$BODY"
    fi
}

# Main script
case "$1" in
    login)
        login "$2" "$3"
        ;;
    get)
        api_get "$2"
        ;;
    refresh)
        refresh
        ;;
    *)
        echo "Usage: $0 {login|get|refresh} [args]"
        echo "  login <email> <password>  - Login and save tokens"
        echo "  get <endpoint>            - Make authenticated GET request"
        echo "  refresh                   - Refresh access token"
        ;;
esac
```

**Make it executable:**
```bash
chmod +x api-client.sh
```

**Use it:**
```bash
# Login
./api-client.sh login your-email@example.com SecurePassword123

# Make requests (auto-refreshes if token expired)
./api-client.sh get /profile
./api-client.sh get /todos

# Manually refresh
./api-client.sh refresh
```

**What this demonstrates:**
- Token storage (in `.tokens` file)
- Automatic refresh on 401 errors
- Reusable authenticated requests

### 7.3 Understanding Token Security Storage

**Where to store tokens:**

**❌ Bad places:**
- In your code (anyone with code has access)
- In URL parameters (logged in server logs)
- In localStorage (vulnerable to XSS attacks)
- In session storage (same XSS risk)

**✅ Good places:**
- HTTP-only cookies (XSS protection, but need CSRF protection)
- Secure encrypted storage (mobile apps)
- Memory only (web apps, but lost on refresh)
- Server-side sessions

**For our course:**
- Environment variables for development
- Files with restricted permissions (.tokens)
- Not committed to git (add to .gitignore)

### 7.4 Exercise: Token Expiry Testing

Let's test what happens with expired tokens.

**In a real scenario:** Wait 1 hour for token to expire (but we're not doing that!)

**For testing:** We can't easily test expiry without waiting, but we can test with invalid tokens:

```bash
# Test 1: Use a totally fake token
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer fake-token-12345"
```

Expected: `ERROR: Unauthorized - Invalid or expired access token`

**Test 2: Modify your real token (invalidate signature)**
```bash
# Take your real token and change one character
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.CHANGED..."
```

Expected: Same error - JWT signature verification fails

**What we learned:**
- Expired tokens are treated same as invalid tokens
- Server verifies signature before trusting token
- Client must refresh when 401 received

---

## Module 8: Real-World API Patterns

### Learning Objectives
- Master CRUD operations
- Update resources with PUT
- Delete resources safely
- Handle partial updates
- Work with nested JSON data

### 8.1 Creating Resources (POST)

Let's create some todos to work with.

**Create Todo #1:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn HTTP Methods",
    "description": "Master GET, POST, PUT, DELETE"
  }'
```

**Create Todo #2:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Understand OAuth 2.0",
    "description": "Learn password grant, refresh tokens"
  }'
```

**Create Todo #3:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build my own API"
  }'
```

Note: Description is optional - server uses empty string as default.

### 8.2 Reading Resources (GET)

**Get all todos:**
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Get specific todo:**
```bash
# Replace with your actual todo ID from the list above
curl https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Note:** Todo IDs are UUIDs, not sequential numbers. You must use the exact ID from your `GET /todos` response.

**Get non-existent todo:**
```bash
curl https://api-basics.sharted.workers.dev/todos/99999999-9999-4999-9999-999999999999 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected: `ERROR: Not Found - Todo not found`

(Even with a valid UUID format, if it doesn't exist, you get 404)

### 8.3 Updating Resources (PUT)

**Mark todo as completed:**
```bash
# First, list your todos to get the ID
curl https://api-basics.sharted.workers.dev/todos -H "Authorization: Bearer $ACCESS_TOKEN"

# Then update using the actual UUID
curl -X PUT https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

**Update title and description:**
```bash
# Use your actual todo UUID
curl -X PUT https://api-basics.sharted.workers.dev/todos/YOUR_TODO_UUID_HERE \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Master OAuth 2.0",
    "description": "Complete understanding of password grant flow"
  }'
```

**Partial updates:**
Our API supports partial updates - you only send fields you want to change:

```bash
# Only update completed status (use your actual UUID)
curl -X PUT https://api-basics.sharted.workers.dev/todos/YOUR_TODO_UUID_HERE \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

**Note about PUT:**
- Traditional REST: PUT should replace entire resource
- Modern APIs: Often allow partial updates (like ours)
- Some APIs use PATCH for partial updates
- Our API: PUT with partial data is fine

### 8.4 Deleting Resources (DELETE)

**Delete a todo:**
```bash
# Use your actual todo UUID
curl -X DELETE https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Try to delete again:**
```bash
# Same UUID - already deleted
curl -X DELETE https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expected: `ERROR: Not Found - Todo not found`

**Why 404 and not 200?**
- First DELETE: 200 OK (resource deleted)
- Second DELETE: 404 Not Found (resource doesn't exist)
- This is actually OK! DELETE is idempotent - same end state

### 8.5 Working with Complex Data

Let's update your profile with nested JSON preferences.

**Update profile with preferences:**
```bash
curl -X PUT https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Master",
    "bio": "I have completed the API Basics course and understand REST, HTTP, and OAuth 2.0!",
    "preferences": {
      "theme": "dark",
      "notifications": {
        "email": true,
        "push": false
      },
      "language": "en",
      "timezone": "America/New_York"
    }
  }'
```

**Get your updated profile:**
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Notice:**
- Nested JSON (preferences contains an object)
- Server stores it as JSON string in database
- Returns it as parsed JSON object
- You can structure data however you need

### 8.6 Resource Ownership and Security

**Important security concept:** You can only access YOUR resources.

**Test this:**

**Create a second user account:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another-user@example.com",
    "password": "SecurePass456",
    "name": "Another User"
  }'
```

**Login as second user:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "another-user@example.com",
    "password": "SecurePass456"
  }'
```

**Try to access first user's todos:**
```bash
# Use second user's token with first user's todo UUID
curl https://api-basics.sharted.workers.dev/todos/FIRST_USER_TODO_UUID \
  -H "Authorization: Bearer SECOND_USER_ACCESS_TOKEN"
```

Expected: `ERROR: Not Found - Todo not found`

**Why?**
- Todo belongs to first user (checked via userId UUID in JWT)
- Second user can't see it
- Server checks userId from token matches todo.userId
- Returns 404 (not 403) to avoid leaking information
- Even if you know the UUID, you can't access another user's data!

**This demonstrates:**
- Authentication (proving who you are)
- Authorization (what you're allowed to access)
- Resource ownership
- Data isolation between users

---

## Module 9: Debugging and Troubleshooting

### Learning Objectives
- Debug common API issues
- Read error messages effectively
- Use verbose mode for debugging
- Validate requests before sending

### 9.1 Common Errors and Solutions

**Error: "Missing or invalid Authorization header"**

**Possible causes:**
1. Forgot `-H "Authorization: Bearer $TOKEN"`
2. Typo in "Bearer" (case-sensitive)
3. Missing space after "Bearer"
4. Token variable not set

**Solution:**
```bash
# Check if token is set
echo $ACCESS_TOKEN

# If empty, login again
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}'
```

**Error: "Invalid or expired access token"**

**Possible causes:**
1. Token actually expired (1 hour old)
2. Token corrupted (copy-paste error)
3. Using refresh token instead of access token
4. Token from different server/environment

**Solution:**
```bash
# Refresh your token
curl -X POST https://api-basics.sharted.workers.dev/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

**Error: "Bad Request - Missing required fields"**

**Possible causes:**
1. Forgot to include required field in JSON
2. Misspelled field name
3. Forgot `-H "Content-Type: application/json"`

**Solution:**
```bash
# Check the API docs for required fields
curl https://api-basics.sharted.workers.dev/

# Make sure you include all required fields
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Required field"}'
```

**Error: "Not Found"**

**Possible causes:**
1. Wrong endpoint URL
2. Resource doesn't exist (wrong ID)
3. Resource belongs to different user
4. Typo in URL

**Solution:**
```bash
# List all your resources first
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Then use correct ID
curl https://api-basics.sharted.workers.dev/todos/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 9.2 Using Verbose Mode

When things go wrong, `-v` is your friend:

```bash
curl -v https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**What to look for:**

1. **Request line:** `GET /profile HTTP/1.1`
   - Verify correct method and path

2. **Request headers:**
   - Check Authorization header present
   - Check Content-Type if sending data

3. **Response status:** `HTTP/1.1 200 OK`
   - First number tells you the outcome

4. **Response headers:**
   - Content-Type tells you format
   - Content-Length tells you size

### 9.3 Testing API Responses

**Test JSON validity:**
```bash
# Pipe response to python's JSON validator
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "User-Agent: PostmanRuntime/7.0" | python -m json.tool
```

**Save response to file:**
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o profile.txt
```

**Show only HTTP status code:**
```bash
curl -s -o /dev/null -w "%{http_code}" https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 9.4 Exercise: Debug This Request

What's wrong with this request?

```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Fix this"}'
```

**Hint:** Run it and read the error message.

**Answer:** Missing Authorization header! Protected endpoint requires authentication.

**Fixed:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Fixed!"}'
```

---

## Final Project: Build Your Own API Client

### Project Overview

Now that you understand APIs, OAuth 2.0, and HTTP, let's build a complete command-line API client!

### Requirements

Build a script that can:
1. Register new users
2. Login and save tokens
3. List todos with nice formatting
4. Create new todos
5. Mark todos as complete
6. Delete todos
7. View profile
8. Update profile
9. Handle token refresh automatically
10. Show helpful error messages

### Starter Template

Create `todo-cli.sh`:

```bash
#!/bin/bash

API_BASE="https://api-basics.sharted.workers.dev"
TOKEN_FILE="$HOME/.api-basics-tokens"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Your code here!

case "$1" in
    register)
        # TODO: Implement registration
        ;;
    login)
        # TODO: Implement login
        ;;
    todos)
        # TODO: Implement list todos
        ;;
    add)
        # TODO: Implement create todo
        ;;
    done)
        # TODO: Implement mark complete
        ;;
    delete)
        # TODO: Implement delete
        ;;
    profile)
        # TODO: Implement view profile
        ;;
    *)
        echo "Usage: $0 {register|login|todos|add|done|delete|profile}"
        ;;
esac
```

### Success Criteria

- ✅ All 10 requirements implemented
- ✅ Error handling for common issues
- ✅ Automatic token refresh
- ✅ User-friendly output formatting
- ✅ Help text explaining each command

### Bonus Challenges

1. **Add search:** Filter todos by keyword
2. **Add pagination:** Show 10 todos at a time
3. **Add colors:** Green for completed, yellow for pending
4. **Add statistics:** Show completion percentage
5. **Export data:** Save todos to JSON file

---

## Course Summary

### What You've Learned

**HTTP Fundamentals:**
- ✅ Request/Response cycle
- ✅ HTTP methods (GET, POST, PUT, DELETE)
- ✅ HTTP headers and their purposes
- ✅ HTTP status codes
- ✅ Content negotiation

**REST API Design:**
- ✅ RESTful principles
- ✅ Resource-based URLs
- ✅ CRUD operations
- ✅ Idempotency
- ✅ Stateless architecture

**Authentication & Security:**
- ✅ Why authentication is needed
- ✅ Token-based authentication
- ✅ Bearer tokens
- ✅ JWT structure and validation
- ✅ Password hashing

**OAuth 2.0:**
- ✅ OAuth 2.0 framework
- ✅ Grant types and when to use them
- ✅ Password grant flow
- ✅ Access tokens vs refresh tokens
- ✅ Token lifecycle management
- ✅ Token refresh and revocation

**Practical Skills:**
- ✅ Using curl effectively
- ✅ Reading API documentation
- ✅ Debugging API issues
- ✅ Building API clients
- ✅ Handling errors gracefully

### Next Steps

**Continue Learning:**
1. **Study other OAuth 2.0 flows:**
   - Authorization Code with PKCE
   - Client Credentials
   - Device Code

2. **Explore related topics:**
   - OpenID Connect (identity layer on OAuth 2.0)
   - API rate limiting
   - API versioning
   - GraphQL (alternative to REST)
   - WebSockets (real-time communication)

3. **Build your own API:**
   - Use what you've learned
   - Implement authentication
   - Deploy to production
   - Write documentation

4. **Best practices:**
   - API security hardening
   - Performance optimization
   - Monitoring and logging
   - Error handling strategies

### Resources

**Official Documentation:**
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [HTTP Methods RFC 7231](https://tools.ietf.org/html/rfc7231)

**Tools:**
- [jwt.io](https://jwt.io) - Decode JWT tokens
- [Postman](https://www.postman.com) - API testing GUI
- [Insomnia](https://insomnia.rest) - API client
- [curl documentation](https://curl.se/docs/)

**Further Reading:**
- "REST API Design Rulebook" by Mark Masse
- "OAuth 2 in Action" by Justin Richer
- [API Security Best Practices](https://owasp.org/www-project-api-security/)

---

## Quick Reference Card

### Common Commands

**Register:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"pass","name":"Name"}'
```

**Login:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"pass"}'
```

**Get Profile:**
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**List Todos:**
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Create Todo:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My todo","description":"Details"}'
```

**Update Todo:**
```bash
curl -X PUT https://api-basics.sharted.workers.dev/todos/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

**Delete Todo:**
```bash
curl -X DELETE https://api-basics.sharted.workers.dev/todos/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Refresh Token:**
```bash
curl -X POST https://api-basics.sharted.workers.dev/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

### HTTP Status Codes Quick Reference

- **200 OK** - Success
- **201 Created** - Resource created
- **400 Bad Request** - Invalid data
- **401 Unauthorized** - Auth required/failed
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource already exists
- **500 Internal Server Error** - Server error

---

## Congratulations!

You've completed the API Basics course and now understand:
- How APIs work at a fundamental level
- HTTP protocol and RESTful design
- OAuth 2.0 authentication flows
- Token management and security
- How to debug and troubleshoot API issues

You're ready to build, consume, and understand real-world APIs!

**Happy coding!** 🚀
