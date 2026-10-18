import { PieceAuth } from '@activepieces/pieces-framework';
export const pieceAuth = PieceAuth.SecretText({
  displayName: 'Ace Data Cloud API key',
  description: 'Register or sign in at [Applications](https://platform.acedata.cloud/console/applications?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=nano_banana_activepieces_connection_api_key). Initialize General Application if needed, then copy the key or choose Manage Keys → Create. Check service access, balance and Allowed APIs. Paste only the key, without Bearer.',
  required: true,
});
