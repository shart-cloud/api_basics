import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { Env } from './types';
import { users, refreshTokens, todos } from './db/schema';
import { hashPassword, verifyPassword, generateAccessToken, generateRefreshToken, generateUUID, isValidUUID } from './lib/auth';
import { formatResponse } from './lib/formatters';
import { requireAuth } from './middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// ============================================================================
// Auth Endpoints
// ============================================================================

// POST /register - Create a new user account
app.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Missing required fields: email, password, name',
      }, 400);
    }

    // Basic email validation
    if (!email.includes('@')) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Invalid email format',
      }, 400);
    }

    // Password strength check
    if (password.length < 8) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Password must be at least 8 characters long',
      }, 400);
    }

    const db = drizzle(c.env.DB);

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();

    if (existingUser) {
      return formatResponse(c, {
        error: 'Conflict',
        message: 'User with this email already exists',
      }, 409);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const userId = generateUUID();

    const result = await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      name,
      bio: '',
      preferences: '{}',
    }).returning();

    const user = result[0];

    return formatResponse(c, {
      success: true,
      message: 'User registered successfully',
      userId: user.id,
      email: user.email,
      name: user.name,
    }, 201);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to register user',
    }, 500);
  }
});

// POST /token - Login and get access + refresh tokens (OAuth2 password grant)
app.post('/token', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Missing required fields: email, password',
      }, 400);
    }

    const db = drizzle(c.env.DB);

    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      return formatResponse(c, {
        error: 'Unauthorized',
        message: 'Invalid email or password',
      }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return formatResponse(c, {
        error: 'Unauthorized',
        message: 'Invalid email or password',
      }, 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      c.env.JWT_SECRET,
      parseInt(c.env.JWT_ACCESS_EXPIRY)
    );

    const refreshToken = generateRefreshToken();
    const refreshExpirySeconds = parseInt(c.env.JWT_REFRESH_EXPIRY);
    const expiresAt = new Date(Date.now() + refreshExpirySeconds * 1000);

    // Store refresh token
    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });

    return formatResponse(c, {
      success: true,
      token_type: 'Bearer',
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: parseInt(c.env.JWT_ACCESS_EXPIRY),
    }, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to authenticate',
    }, 500);
  }
});

// POST /refresh - Get new access token using refresh token
app.post('/refresh', async (c) => {
  try {
    const body = await c.req.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Missing required field: refresh_token',
      }, 400);
    }

    const db = drizzle(c.env.DB);

    // Find refresh token
    const tokenRecord = await db
      .select({
        token: refreshTokens,
        user: users,
      })
      .from(refreshTokens)
      .innerJoin(users, eq(refreshTokens.userId, users.id))
      .where(eq(refreshTokens.token, refresh_token))
      .get();

    if (!tokenRecord) {
      return formatResponse(c, {
        error: 'Unauthorized',
        message: 'Invalid refresh token',
      }, 401);
    }

    // Check if token is expired
    if (new Date(tokenRecord.token.expiresAt) < new Date()) {
      // Delete expired token
      await db.delete(refreshTokens).where(eq(refreshTokens.token, refresh_token));

      return formatResponse(c, {
        error: 'Unauthorized',
        message: 'Refresh token has expired',
      }, 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(
      tokenRecord.user.id,
      tokenRecord.user.email,
      c.env.JWT_SECRET,
      parseInt(c.env.JWT_ACCESS_EXPIRY)
    );

    return formatResponse(c, {
      success: true,
      token_type: 'Bearer',
      access_token: accessToken,
      expires_in: parseInt(c.env.JWT_ACCESS_EXPIRY),
    }, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to refresh token',
    }, 500);
  }
});

// POST /revoke - Logout by revoking refresh token
app.post('/revoke', async (c) => {
  try {
    const body = await c.req.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Missing required field: refresh_token',
      }, 400);
    }

    const db = drizzle(c.env.DB);

    // Delete the refresh token
    const result = await db.delete(refreshTokens).where(eq(refreshTokens.token, refresh_token)).returning();

    if (result.length === 0) {
      return formatResponse(c, {
        error: 'Not Found',
        message: 'Refresh token not found',
      }, 404);
    }

    return formatResponse(c, {
      success: true,
      message: 'Token revoked successfully',
    }, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to revoke token',
    }, 500);
  }
});

// ============================================================================
// Profile Endpoints (Auth Required)
// ============================================================================

// GET /profile - Get current user's profile
app.get('/profile', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const db = drizzle(c.env.DB);

    const user = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      bio: users.bio,
      preferences: users.preferences,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, userId)).get();

    if (!user) {
      return formatResponse(c, {
        error: 'Not Found',
        message: 'User not found',
      }, 404);
    }

    // Parse preferences JSON
    const profile = {
      ...user,
      preferences: JSON.parse(user.preferences),
    };

    return formatResponse(c, profile, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to get profile',
    }, 500);
  }
});

// PUT /profile - Update current user's profile
app.put('/profile', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();
    const { name, bio, preferences } = body;

    const db = drizzle(c.env.DB);

    // Build update object
    const updates: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updates.name = name;
    }

    if (bio !== undefined) {
      updates.bio = bio;
    }

    if (preferences !== undefined) {
      // Validate it's an object
      if (typeof preferences !== 'object') {
        return formatResponse(c, {
          error: 'Bad Request',
          message: 'preferences must be an object',
        }, 400);
      }
      updates.preferences = JSON.stringify(preferences);
    }

    const result = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    const user = result[0];

    return formatResponse(c, {
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        preferences: JSON.parse(user.preferences),
      },
    }, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to update profile',
    }, 500);
  }
});

// ============================================================================
// Todo Endpoints (Auth Required)
// ============================================================================

// GET /todos - List all todos for current user
app.get('/todos', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const db = drizzle(c.env.DB);

    const userTodos = await db.select().from(todos).where(eq(todos.userId, userId)).all();

    return formatResponse(c, userTodos, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to get todos',
    }, 500);
  }
});

// POST /todos - Create a new todo
app.post('/todos', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();
    const { title, description } = body;

    if (!title) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Missing required field: title',
      }, 400);
    }

    const db = drizzle(c.env.DB);

    const todoId = generateUUID();

    const result = await db.insert(todos).values({
      id: todoId,
      userId,
      title,
      description: description || '',
      completed: false,
    }).returning();

    const todo = result[0];

    return formatResponse(c, {
      success: true,
      message: 'Todo created successfully',
      todo,
    }, 201);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to create todo',
    }, 500);
  }
});

// GET /todos/:id - Get a specific todo
app.get('/todos/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const todoId = c.req.param('id');

    if (!isValidUUID(todoId)) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Invalid todo ID format',
      }, 400);
    }

    const db = drizzle(c.env.DB);

    const todo = await db.select().from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .get();

    if (!todo) {
      return formatResponse(c, {
        error: 'Not Found',
        message: 'Todo not found',
      }, 404);
    }

    return formatResponse(c, todo, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to get todo',
    }, 500);
  }
});

// PUT /todos/:id - Update a todo
app.put('/todos/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const todoId = c.req.param('id');

    if (!isValidUUID(todoId)) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Invalid todo ID format',
      }, 400);
    }

    const body = await c.req.json();
    const { title, description, completed } = body;

    const db = drizzle(c.env.DB);

    // Check if todo exists and belongs to user
    const existingTodo = await db.select().from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .get();

    if (!existingTodo) {
      return formatResponse(c, {
        error: 'Not Found',
        message: 'Todo not found',
      }, 404);
    }

    // Build update object
    const updates: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updates.title = title;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    if (completed !== undefined) {
      updates.completed = Boolean(completed);
    }

    const result = await db.update(todos)
      .set(updates)
      .where(eq(todos.id, todoId))
      .returning();

    const todo = result[0];

    return formatResponse(c, {
      success: true,
      message: 'Todo updated successfully',
      todo,
    }, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to update todo',
    }, 500);
  }
});

// DELETE /todos/:id - Delete a todo
app.delete('/todos/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const todoId = c.req.param('id');

    if (!isValidUUID(todoId)) {
      return formatResponse(c, {
        error: 'Bad Request',
        message: 'Invalid todo ID format',
      }, 400);
    }

    const db = drizzle(c.env.DB);

    // Check if todo exists and belongs to user
    const existingTodo = await db.select().from(todos)
      .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
      .get();

    if (!existingTodo) {
      return formatResponse(c, {
        error: 'Not Found',
        message: 'Todo not found',
      }, 404);
    }

    await db.delete(todos).where(eq(todos.id, todoId));

    return formatResponse(c, {
      success: true,
      message: 'Todo deleted successfully',
    }, 200);
  } catch (error: any) {
    return formatResponse(c, {
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete todo',
    }, 500);
  }
});

// ============================================================================
// Root Endpoint - API Documentation
// ============================================================================

app.get('/', (c) => {
  const userAgent = c.req.header('user-agent') || '';
  const accept = c.req.header('accept') || '';

  // Return JSON structure for API clients
  if (accept.includes('application/json')) {
    return c.json({
      name: "API Basics - Educational REST API",
      version: "1.0.0",
      description: "A complete REST API for teaching HTTP fundamentals, OAuth2 authentication, and API design",
      baseUrl: "https://api-basics.sharted.workers.dev",
      endpoints: {
        authentication: [
          { method: "POST", path: "/register", description: "Create a new account" },
          { method: "POST", path: "/token", description: "Login and get tokens (OAuth2 password grant)" },
          { method: "POST", path: "/refresh", description: "Get new access token using refresh token" },
          { method: "POST", path: "/revoke", description: "Logout by revoking refresh token" }
        ],
        profile: [
          { method: "GET", path: "/profile", description: "Get your profile", requiresAuth: true },
          { method: "PUT", path: "/profile", description: "Update your profile", requiresAuth: true }
        ],
        todos: [
          { method: "GET", path: "/todos", description: "List all your todos", requiresAuth: true },
          { method: "POST", path: "/todos", description: "Create a new todo", requiresAuth: true },
          { method: "GET", path: "/todos/:id", description: "Get a specific todo", requiresAuth: true },
          { method: "PUT", path: "/todos/:id", description: "Update a todo", requiresAuth: true },
          { method: "DELETE", path: "/todos/:id", description: "Delete a todo", requiresAuth: true }
        ]
      },
      authentication: {
        type: "Bearer",
        header: "Authorization: Bearer <access_token>",
        tokenExpiry: {
          accessToken: "1 hour (3600 seconds)",
          refreshToken: "30 days (2592000 seconds)"
        }
      },
      contentNegotiation: {
        "curl": "Returns plain text",
        "browser": "Returns HTML",
        "api-clients": "Returns JSON"
      }
    }, 200);
  }

  const docs = `
API Basics - Educational REST API
==================================

Available Endpoints:

Authentication:
  POST   /register          Create a new account
  POST   /token             Login and get tokens (OAuth2 password grant)
  POST   /refresh           Get new access token using refresh token
  POST   /revoke            Logout by revoking refresh token

Profile (requires authentication):
  GET    /profile           Get your profile
  PUT    /profile           Update your profile

Todos (requires authentication):
  GET    /todos             List all your todos
  POST   /todos             Create a new todo
  GET    /todos/:id         Get a specific todo
  PUT    /todos/:id         Update a todo
  DELETE /todos/:id         Delete a todo

Authentication:
  All protected endpoints require an access token in the Authorization header:
  Authorization: Bearer <access_token>

Token Expiry:
  - Access tokens expire in 1 hour
  - Refresh tokens expire in 30 days

Content Types:
  - curl: Returns plain text
  - Browser: Returns HTML
  - Other clients: Returns JSON

Example Usage:
  # Register
  curl -X POST https://api-basics.sharted.workers.dev/register \\
    -H "Content-Type: application/json" \\
    -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

  # Login
  curl -X POST https://api-basics.sharted.workers.dev/token \\
    -H "Content-Type: application/json" \\
    -d '{"email":"user@example.com","password":"password123"}'

  # Get profile (with token)
  curl https://api-basics.sharted.workers.dev/profile \\
    -H "Authorization: Bearer <your_access_token>"
`;

  return formatResponse(c, docs, 200);
});

export default app;
