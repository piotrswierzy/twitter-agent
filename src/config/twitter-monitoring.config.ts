import * as fs from 'fs';
import * as path from 'path';

/**
 * Configuration for Twitter monitoring settings
 */
export interface TwitterMonitoringConfig {
  /** List of Twitter usernames to monitor */
  users: string[];
  /** List of hashtags to monitor */
  hashtags: string[];
  /** List of queries to monitor */
  queries: string[];
  /** Settings for tweet fetching */
  fetchSettings: {
    /** Maximum number of tweets to fetch per user/hashtag */
    maxResults: number;
    /** Sort order for fetched tweets */
    sortOrder: 'recency' | 'relevancy';
  };
}

/**
 * Loads the Twitter monitoring configuration from the JSON file.
 * @returns The Twitter monitoring configuration
 * @throws Error if the configuration file cannot be read or parsed
 */
export function loadTwitterMonitoringConfig(): TwitterMonitoringConfig {
  try {
    const configPath = path.join(__dirname, 'twitter-monitoring.json');
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile) as TwitterMonitoringConfig;
  } catch (error) {
    throw new Error(`Failed to load Twitter monitoring configuration: ${error.message}`);
  }
}

/**
 * Configuration for Twitter monitoring settings.
 * This includes the list of users and hashtags to monitor,
 * as well as other Twitter-related settings.
 */
export const twitterMonitoringConfig: TwitterMonitoringConfig = loadTwitterMonitoringConfig(); 