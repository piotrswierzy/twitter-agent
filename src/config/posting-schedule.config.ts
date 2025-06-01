export interface PostingScheduleConfig {
  // Time windows for posting (in 24h format)
  activeHours: {
    start: number; // 0-23
    end: number;   // 0-23
  };
  
  // Minimum and maximum delay between posts (in minutes)
  delayBetweenPosts: {
    min: number;
    max: number;
  };
  
  // Maximum posts per hour
  maxPostsPerHour: number;
  
  // Maximum posts per day
  maxPostsPerDay: number;
  
  // Time zones to consider (for global audience)
  timeZones: string[];
}

export const postingScheduleConfig: PostingScheduleConfig = {
  activeHours: {
    start: 7,  // 8 AM
    end: 24,   // 12 PM
  },
  delayBetweenPosts: {
    min: 15,   // Minimum 15 minutes between posts
    max: 120,  // Maximum 2 hours between posts
  },
  maxPostsPerHour: 4,
  maxPostsPerDay: 20,
  timeZones: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'],
}; 