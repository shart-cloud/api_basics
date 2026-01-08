# API Basics - Quick Reference Cheat Sheet

## Setup

```bash
# Start the development server
npm run dev

# Server runs at
https://api-basics.sharted.workers.dev
```

## Authentication Flow

```
1. Register → 2. Login → 3. Get tokens → 4. Use access token → 5. Refresh when expired
```

## HTTP Status Codes

| Code | Meaning | When You See It |
|------|---------|-----------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid/missing data in request |
| 401 | Unauthorized | Missing/invalid/expired token |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Something broke server-side |

## HTTP Methods

| Method | Purpose | Idempotent? | Has Body? |
|--------|---------|-------------|-----------|
| GET | Read/retrieve | ✅ Yes | ❌ No |
| POST | Create | ❌ No | ✅ Yes |
| PUT | Update | ✅ Yes | ✅ Yes |
| DELETE | Delete | ✅ Yes | ❌ No |

## Essential curl Commands

### 1. Register New Account

```bash
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123",
    "name": "Student Name"
  }'
```

### 2. Login (Get Tokens)

```bash
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "SecurePass123"
  }'
```

**Save your tokens:**
```bash
export ACCESS_TOKEN="your_access_token_here"
export REFRESH_TOKEN="your_refresh_token_here"
```

### 3. Get Your Profile

```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4. Update Profile

```bash
curl -X PUT https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Name",
    "bio": "My bio text",
    "preferences": {"theme": "dark"}
  }'
```

### 5. List All Todos

```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 6. Create Todo

```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Todo",
    "description": "Optional description"
  }'
```

### 7. Get Specific Todo

```bash
# First list todos to get the UUID: curl https://api-basics.sharted.workers.dev/todos ...
# Then use the actual UUID:
curl https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 8. Update Todo

```bash
# Use your actual todo UUID from GET /todos
curl -X PUT https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "completed": true
  }'
```

### 9. Delete Todo

```bash
# Use your actual todo UUID
curl -X DELETE https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 10. Refresh Access Token

```bash
curl -X POST https://api-basics.sharted.workers.dev/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

### 11. Logout (Revoke Token)

```bash
curl -X POST https://api-basics.sharted.workers.dev/revoke \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

## Content Negotiation

### Get Plain Text (curl default)
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Get JSON
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "User-Agent: MyApp/1.0"
```

### Get HTML (browser-like)
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "User-Agent: Mozilla/5.0"
```

## Debugging Commands

### View Full Request/Response
```bash
curl -v https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Include Response Headers
```bash
curl -i https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Show Only HTTP Status Code
```bash
curl -s -o /dev/null -w "%{http_code}" https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Pretty Print JSON Response
```bash
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "User-Agent: MyApp/1.0" | python -m json.tool
```

## OAuth 2.0 Token Types

| Token Type | Lifetime | Purpose | Storage |
|------------|----------|---------|---------|
| Access Token | 1 hour | Access API resources | Client memory/temp |
| Refresh Token | 30 days | Get new access tokens | Secure storage |

## JWT Token Structure

```
eyJhbGc...  .  eyJ1c2Vy...  .  d9yk35SY...
   │             │              │
 Header        Payload       Signature
```

**Decode at:** https://jwt.io

## Common Mistakes & Solutions

### ❌ Missing Authorization Header
```bash
curl https://api-basics.sharted.workers.dev/profile
```
**Error:** `ERROR: Unauthorized`

**Fix:** Add the header
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### ❌ Wrong Authorization Format
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: $ACCESS_TOKEN"
```
**Error:** `ERROR: Unauthorized`

**Fix:** Include "Bearer " prefix
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### ❌ Missing Content-Type
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"title":"Test"}'
```
**Result:** May not parse JSON correctly

**Fix:** Always include Content-Type for JSON
```bash
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```

### ❌ Token Expired
```bash
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer <expired_token>"
```
**Error:** `ERROR: Unauthorized - Invalid or expired access token`

**Fix:** Refresh your token
```bash
curl -X POST https://api-basics.sharted.workers.dev/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"
```

### ❌ Invalid Todo ID Format
```bash
curl https://api-basics.sharted.workers.dev/todos/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```
**Error:** `ERROR: Bad Request - Invalid todo ID format`

**Fix:** Use the UUID, not a number
```bash
# First get the UUID from GET /todos
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Then use the actual UUID
curl https://api-basics.sharted.workers.dev/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Environment Variables Quick Setup

```bash
# After login, export tokens for easy reuse
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIs..."
export REFRESH_TOKEN="204f76998800fff8a530..."

# Now you can use $ACCESS_TOKEN in all commands
curl https://api-basics.sharted.workers.dev/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Quick Test Sequence

```bash
# 1. Register
curl -X POST https://api-basics.sharted.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass12345","name":"Test"}'

# 2. Login and save tokens
curl -X POST https://api-basics.sharted.workers.dev/token \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass12345"}' > tokens.json

# 3. Extract and export tokens (manual step - copy from tokens.json)
export ACCESS_TOKEN="<your_access_token>"

# 4. Create a todo
curl -X POST https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test todo"}'

# 5. List todos
curl https://api-basics.sharted.workers.dev/todos \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 6. Update todo (use UUID from step 5 output)
curl -X PUT https://api-basics.sharted.workers.dev/todos/YOUR_TODO_UUID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# 7. Delete todo (use same UUID)
curl -X DELETE https://api-basics.sharted.workers.dev/todos/YOUR_TODO_UUID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## REST API Principles

1. **Resource-based URLs** - Use nouns, not verbs
   - ✅ `GET /todos`
   - ❌ `GET /getTodos`

2. **HTTP methods = actions**
   - Don't put actions in URLs
   - Let the method define the action

3. **Stateless**
   - Every request is independent
   - No session state on server
   - Auth token with every request

4. **Use standard status codes**
   - 2xx = Success
   - 4xx = Client error
   - 5xx = Server error

5. **Consistent naming**
   - Plural nouns for collections: `/todos`
   - ID for specific resource: `/todos/a0ba571e-28f5-4a63-8d9c-3535ae80ba23`
   - Use UUIDs, not sequential integers, for security

## Security Best Practices

- ✅ Always use HTTPS in production
- ✅ Store tokens securely
- ✅ Never commit tokens to git
- ✅ Use environment variables
- ✅ Refresh tokens before expiry
- ✅ Revoke tokens on logout
- ✅ Use UUIDs for exposed IDs (prevents enumeration)
- ❌ Don't share tokens between users
- ❌ Don't put tokens in URLs
- ❌ Don't store passwords anywhere
- ❌ Don't log sensitive data
- ❌ Don't use sequential integers for user/resource IDs

## When Things Go Wrong

1. **Check the error message** - It usually tells you what's wrong
2. **Use `-v` flag** - See full request/response
3. **Verify token not expired** - Refresh if needed
4. **Check Content-Type header** - Required for JSON
5. **Confirm endpoint exists** - Check API docs
6. **Validate JSON syntax** - Use a JSON validator
7. **Try verbose mode** - `curl -v ...`
8. **Check authorization format** - Must be "Bearer <token>"

## Helpful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias api='curl https://api-basics.sharted.workers.dev'
alias api-register='curl -X POST https://api-basics.sharted.workers.dev/register -H "Content-Type: application/json"'
alias api-login='curl -X POST https://api-basics.sharted.workers.dev/token -H "Content-Type: application/json"'
alias api-profile='curl https://api-basics.sharted.workers.dev/profile -H "Authorization: Bearer $ACCESS_TOKEN"'
alias api-todos='curl https://api-basics.sharted.workers.dev/todos -H "Authorization: Bearer $ACCESS_TOKEN"'
```

Then use:
```bash
api-profile
api-todos
```

---

**Print this page and keep it handy while working through the course!**
