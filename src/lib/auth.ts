import { PieceAuth } from '@activepieces/pieces-framework';
export const pieceAuth = PieceAuth.SecretText({
  displayName: 'Ace Data Cloud API key',
  description: 'Register or sign in at [Applications](https://platform.acedata.cloud/console/applications?utm_source=activepieces&utm_medium=referral&utm_campaign=evergreen). On the General Application card, click the copy button beside API KEY. For a dedicated key, use Manage Keys → Create. Check service access and Allowed APIs. If the application balance is low, click Top Up on its card. Paste only the key, without Bearer.',
  required: true,
});
