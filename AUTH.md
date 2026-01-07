# Client Authentication API

REST API for authenticating external clients (mobile apps, desktop apps, CLI tools, third-party integrations).

## Base URL

```
/api/v1/auth
```

## Authentication

After login/register, you'll receive a `token`. Include it in subsequent requests:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Register

Create a new account with email and password.

```
POST /api/v1/auth/register
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | Password (min 6 characters) |
| `name` | string | Yes | User's display name |

**Example Request**

```bash
curl -X POST https://your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

**Success Response (201)**

```json
{
  "token": "session-token-string",
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "Student",
    "image": null,
    "emailVerified": false
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-01-14T00:00:00.000Z",
    "activeOrganizationId": null
  },
  "isNewUser": true
}
```

---

### Login

Authenticate with email and password.

```
POST /api/v1/auth/login
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password |

**Example Request**

```bash
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Success Response (200)**

```json
{
  "token": "session-token-string",
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "Student",
    "image": null,
    "emailVerified": true
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-01-14T00:00:00.000Z",
    "activeOrganizationId": "org-uuid"
  }
}
```

---

### Google OAuth

Authenticate using Google Sign-In. The client app should use Google Sign-In SDK to get an `idToken`, then send it to this endpoint.

```
POST /api/v1/auth/login/google
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `idToken` | string | Yes | ID token from Google Sign-In SDK |

**Example Request**

```bash
curl -X POST https://your-domain.com/api/v1/auth/login/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Success Response (200)**

```json
{
  "token": "session-token-string",
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "Student",
    "image": "https://lh3.googleusercontent.com/...",
    "emailVerified": true
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-01-14T00:00:00.000Z",
    "activeOrganizationId": null
  },
  "isNewUser": false
}
```

**Flutter Implementation**

```dart
import 'package:google_sign_in/google_sign_in.dart';

final GoogleSignIn _googleSignIn = GoogleSignIn();

Future<void> signInWithGoogle() async {
  final GoogleSignInAccount? account = await _googleSignIn.signIn();
  final GoogleSignInAuthentication auth = await account!.authentication;

  final response = await http.post(
    Uri.parse('$baseUrl/api/v1/auth/login/google'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'idToken': auth.idToken}),
  );
}
```

---

### GitHub OAuth

Authenticate using GitHub OAuth. The client app should initiate the OAuth flow and get an authorization `code`, then send it to this endpoint.

```
POST /api/v1/auth/login/github
```

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Authorization code from GitHub OAuth callback |

**GitHub OAuth Flow**

1. Open GitHub authorization URL in browser/webview:
   ```
   https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=user:email
   ```

2. User authorizes your app

3. GitHub redirects to your callback URL with a `code` parameter

4. Send the `code` to this endpoint

**Example Request**

```bash
curl -X POST https://your-domain.com/api/v1/auth/login/github \
  -H "Content-Type: application/json" \
  -d '{
    "code": "abc123def456"
  }'
```

**Success Response (200)**

```json
{
  "token": "session-token-string",
  "user": {
    "id": "user-uuid",
    "name": "johndoe",
    "email": "user@example.com",
    "role": "Student",
    "image": "https://avatars.githubusercontent.com/...",
    "emailVerified": true
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-01-14T00:00:00.000Z",
    "activeOrganizationId": null
  },
  "isNewUser": true
}
```

---

### Get Session

Get the current authenticated user's session, profile, and organizations.

```
GET /api/v1/auth/session
```

**Headers**

```
Authorization: Bearer <token>
```

**Example Request**

```bash
curl https://your-domain.com/api/v1/auth/session \
  -H "Authorization: Bearer your-session-token"
```

**Success Response (200)**

```json
{
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "Student",
    "image": null,
    "emailVerified": true
  },
  "session": {
    "id": "session-uuid",
    "expiresAt": "2025-01-14T00:00:00.000Z",
    "activeOrganizationId": "org-uuid"
  },
  "organizations": [
    {
      "id": "org-uuid",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "logo": null,
      "role": "Student"
    }
  ],
  "activeOrganization": {
    "id": "org-uuid",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "logo": null,
    "role": "Student"
  }
}
```

---

### Logout

Invalidate the current session.

```
POST /api/v1/auth/logout
```

**Headers**

```
Authorization: Bearer <token>
```

**Example Request**

```bash
curl -X POST https://your-domain.com/api/v1/auth/logout \
  -H "Authorization: Bearer your-session-token"
```

**Success Response (200)**

```json
{
  "success": true
}
```

---

## Response Data Types

### User Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique user identifier (UUID) |
| `name` | string | User's display name |
| `email` | string | User's email address |
| `role` | string | User's global role: `Admin`, `PM`, or `Student` |
| `image` | string \| null | Profile image URL |
| `emailVerified` | boolean | Whether email is verified |

### Session Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique session identifier (UUID) |
| `expiresAt` | string | ISO 8601 timestamp when session expires |
| `activeOrganizationId` | string \| null | Currently active organization ID |

### Organization Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique organization identifier (UUID) |
| `name` | string | Organization name |
| `slug` | string | URL-friendly organization identifier |
| `logo` | string \| null | Organization logo URL |
| `role` | string | User's role in this org: `Admin`, `PM`, or `Student` |

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body or parameters |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `INVALID_TOKEN` | 401 | Malformed or invalid token |
| `TOKEN_EXPIRED` | 401 | Session token has expired |
| `UNAUTHORIZED` | 401 | No authentication provided |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `OAUTH_ERROR` | 400 | OAuth provider error |
| `INTERNAL_ERROR` | 500 | Server error |

### Example Error Responses

**Invalid Credentials (401)**
```json
{
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

**Validation Error (400)**
```json
{
  "error": "Missing required fields",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "email is required",
    "password": "password is required"
  }
}
```

**Email Already Exists (409)**
```json
{
  "error": "Email already registered",
  "code": "EMAIL_EXISTS"
}
```

---

## Client Integration Examples

### JavaScript / TypeScript

```typescript
const API_BASE = 'https://your-domain.com/api/v1/auth';

// Login
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
}

// Authenticated request
async function getSession() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/session`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
}
```

### Flutter / Dart

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const String baseUrl = 'https://your-domain.com/api/v1/auth';
  final storage = FlutterSecureStorage();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['error']);
    }

    final data = jsonDecode(response.body);
    await storage.write(key: 'token', value: data['token']);
    return data;
  }

  Future<Map<String, dynamic>> getSession() async {
    final token = await storage.read(key: 'token');
    final response = await http.get(
      Uri.parse('$baseUrl/session'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }

  Future<void> logout() async {
    final token = await storage.read(key: 'token');
    await http.post(
      Uri.parse('$baseUrl/logout'),
      headers: {'Authorization': 'Bearer $token'},
    );
    await storage.delete(key: 'token');
  }
}
```

### Python

```python
import requests

class AuthClient:
    def __init__(self, base_url: str):
        self.base_url = f"{base_url}/api/v1/auth"
        self.token = None

    def login(self, email: str, password: str) -> dict:
        response = requests.post(
            f"{self.base_url}/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["token"]
        return data

    def get_session(self) -> dict:
        response = requests.get(
            f"{self.base_url}/session",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        response.raise_for_status()
        return response.json()

    def logout(self):
        requests.post(
            f"{self.base_url}/logout",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        self.token = None
```

---

## Session Management

### Token Lifetime

- Sessions expire after **7 days** of inactivity
- The `expiresAt` field in the session object indicates when the token will expire
- Make a request to `/api/v1/auth/session` to check if your token is still valid

### Token Storage

Store tokens securely:
- **Mobile apps**: Use secure storage (iOS Keychain, Android Keystore)
- **Web apps**: Use `httpOnly` cookies or secure localStorage
- **Desktop apps**: Use OS credential manager

### Handling Expired Tokens

When a token expires, you'll receive:

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

Redirect the user to login again to obtain a new token.
