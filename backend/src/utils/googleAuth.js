const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const verifyGoogleToken = async (idToken) => {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      // For development/testing bypass if no client ID is set
      console.warn("GOOGLE_CLIENT_ID not set. Bypassing true verification.");
      return {
        email: "test@example.com",
        name: "Test User",
        sub: "google-id-123",
        picture: "https://via.placeholder.com/150"
      };
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    
    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification failed:', error.message);
    throw new Error('Invalid Google Token');
  }
};

module.exports = {
  verifyGoogleToken,
};
