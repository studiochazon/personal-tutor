# 🔐 Google Identity Services Authentication Setup

This guide will help you set up Google Identity Services (GIS) authentication for your Personal Tutor AI application.

## 🚀 Quick Setup

1. **Run the setup script:**
   ```bash
   ./setup-auth.sh
   ```

2. **Start the development server:**
   ```bash
   cd client
   npm run dev
   ```

3. **Test the authentication:**
   - Visit `http://localhost:5173/auth/login`
   - Click the Google Sign-In button
   - Complete the authentication flow

## 📋 Manual Setup (if needed)

### 1. Database Migration

Run the authentication schema update:

```sql
-- Run this SQL file to update your database
mysql -u root -p your-database-name < database/schema-update-auth.sql
```

This adds the following fields to the `users` table:
- `google_id` - Google's unique user identifier
- `avatar_url` - User's Google profile picture
- `email_verified` - Whether the email is verified
- `given_name` - User's first name
- `family_name` - User's last name
- `last_login` - Timestamp of last login

### 2. Environment Configuration

Create a `.env` file in the `client` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-database-password
DB_NAME=personal_tutor_ai
DB_PORT=3306

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Identity Services
GOOGLE_CLIENT_ID=98375891181-n3p0te6cavre6972u795scah5gabctse.apps.googleusercontent.com

# Application Configuration
BASE_URL=http://localhost:5173
```

### 3. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the Google Identity Services API
4. Go to "APIs & Services" → "Credentials"
5. Create an OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)

## 🔧 Features Implemented

### ✅ Authentication System
- **Google Identity Services Integration**: Modern GIS implementation
- **JWT Token Management**: Secure token-based authentication
- **User Profile Management**: Complete user profile with Google data
- **Session Persistence**: Automatic login from localStorage
- **One Tap Sign-In**: Automatic Google sign-in prompt

### ✅ User Interface
- **Login Page**: Clean, modern login interface with Google Sign-In
- **Profile Page**: User profile management and account information
- **Navigation Updates**: Dynamic navigation based on authentication state
- **User Menu**: Dropdown menu with profile and logout options

### ✅ Backend API
- **Google Authentication Endpoint**: `/api/auth/google`
- **Token Verification**: `/api/auth/verify`
- **User Management**: Database functions for Google users
- **Error Handling**: Comprehensive error handling and validation

### ✅ Security Features
- **JWT Token Security**: Secure token generation and verification
- **Google Token Validation**: Server-side Google token verification
- **Session Management**: Proper session handling and cleanup
- **Protected Routes**: Authentication-based route protection

## 🎯 Usage

### For Users
1. Visit the login page
2. Click "Sign in with Google"
3. Complete Google authentication
4. Access protected features (course creation, progress tracking)

### For Developers
1. **Check Authentication Status:**
   ```typescript
   import { isAuthenticated, getAuthToken } from '$lib/auth';
   
   if (isAuthenticated()) {
     const token = getAuthToken();
     // Use token for API requests
   }
   ```

2. **Protected API Endpoints:**
   ```typescript
   // Add Authorization header to requests
   const response = await fetch('/api/protected-endpoint', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   });
   ```

3. **User Information:**
   ```typescript
   import { authStore } from '$lib/auth';
   
   authStore.subscribe(state => {
     if (state.user) {
       console.log('User:', state.user.name);
       console.log('Email:', state.user.email);
     }
   });
   ```

## 🔒 Security Considerations

### Production Deployment
1. **Change JWT Secret**: Use a strong, unique JWT secret
2. **HTTPS Only**: Ensure all production traffic uses HTTPS
3. **Domain Configuration**: Update Google OAuth with production domain
4. **Environment Variables**: Use proper environment variable management
5. **Token Expiration**: Consider shorter token expiration times

### Google OAuth Security
1. **Authorized Origins**: Only include your actual domains
2. **Client Secret**: Keep your client secret secure (not needed for GIS)
3. **Token Verification**: Always verify Google tokens server-side
4. **Error Handling**: Implement proper error handling for failed auth

## 🐛 Troubleshooting

### Common Issues

1. **Google Sign-In Button Not Appearing**
   - Check if Google Identity Services script is loading
   - Verify Google Client ID is correct
   - Check browser console for errors

2. **Authentication Fails**
   - Verify Google OAuth configuration
   - Check database connection
   - Review server logs for errors

3. **Token Verification Issues**
   - Ensure JWT_SECRET is set correctly
   - Check token expiration
   - Verify token format

4. **Database Connection Issues**
   - Verify database credentials
   - Check if database migration ran successfully
   - Ensure MySQL is running

### Debug Mode
Enable debug logging by adding to your `.env`:
```env
DEBUG=true
```

## 📚 Additional Resources

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [SvelteKit Authentication Guide](https://kit.svelte.dev/docs/authentication)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

## 🤝 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the browser console and server logs
3. Verify all configuration steps were completed
4. Test with a fresh browser session

---

**Note**: This implementation uses Google Identity Services (GIS), which is the modern, recommended approach for Google authentication. The older Google+ Sign-In library is deprecated and should not be used for new implementations. 