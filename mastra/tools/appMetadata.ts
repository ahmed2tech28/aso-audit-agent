import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const appMetadataTool = createTool({
  id: 'app-metadata',
  description: 'Extracts the App ID and storefront from an App Store or Google Play Store URL.',
  inputSchema: z.object({
    appUrl: z.string().url('Invalid URL format. Please provide a valid HTTP/HTTPS URL.'),
  }),
  outputSchema: z.object({
    appId: z.string(),
    storefront: z.string().optional(),
    originalUrl: z.string(),
  }),
  execute: async (input) => {
    const { appUrl } = input;
    
    let urlObj: URL;
    try {
      urlObj = new URL(appUrl);
    } catch {
      throw new Error(`Invalid URL: ${appUrl}`);
    }

    const hostname = urlObj.hostname.toLowerCase();
    
    // Apple App Store extraction
    if (hostname === 'apps.apple.com') {
      const appleRegex = /\/([a-z]{2})\/app\/(?:[^\/]+\/)?id(\d+)/i;
      const match = urlObj.pathname.match(appleRegex);
      
      if (!match) {
        throw new Error(
          'Could not extract App ID and storefront from Apple App Store URL. Ensure it follows the format: https://apps.apple.com/<storefront>/app/.../id<appid>'
        );
      }
      
      return {
        appId: match[2],
        storefront: match[1].toLowerCase(),
        originalUrl: appUrl,
      };
    }
    
    // Google Play Store extraction
    if (hostname === 'play.google.com') {
      if (!urlObj.pathname.startsWith('/store/apps/details')) {
        throw new Error('Could not extract App ID from Google Play URL. Ensure it points to /store/apps/details.');
      }
      
      const appId = urlObj.searchParams.get('id');
      if (!appId) {
        throw new Error('Google Play URL is missing the "id" query parameter.');
      }
      
      const storefront = urlObj.searchParams.get('gl') || undefined;
      
      return {
        appId,
        storefront: storefront?.toLowerCase(),
        originalUrl: appUrl,
      };
    }

    throw new Error('Unsupported URL. Only apps.apple.com and play.google.com are supported.');
  },
});
