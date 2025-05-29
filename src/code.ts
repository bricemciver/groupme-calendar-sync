// Types for GroupMe API responses
interface GroupMeEvent {
  event_id: string;
  id: string;
  name?: string;
  description?: string;
  start_at: string;
  end_at?: string;
  location?: {
    name: string;
  };
  going_count?: number;
}

interface GroupMeResponse {
  response?: {
    events?: GroupMeEvent[];
  };
  meta?: {
    errors?: string[];
  };
}

interface EventDetails {
  title: string;
  startTime: Date;
  endTime: Date;
  description: string;
  location: string;
}

const GROUPME_ID_REGEX = /\[GroupMe Event ID: ([^\]]+)\]/;

/**
 * Main function to sync GroupMe events to Google Calendar
 * Run this function manually or set up a trigger
 */
const syncGroupMeCalendar = () => {
  try {
    console.log('Starting GroupMe calendar sync...');

    const properties = PropertiesService.getScriptProperties();
    const groupId = properties.getProperty("GROUPME_GROUP_ID");
    const accessToken = properties.getProperty("GROUPME_ACCESS_TOKEN");
    const calendarId = properties.getProperty("GOOGLE_CALENDAR_ID");
    const syncDaysAhead = parseInt(properties.getProperty("SYNC_DAYS_AHEAD") ?? "30");
    const eventPrefix = properties.getProperty("EVENT_PREFIX") ?? "[GroupMe] ";
    
    if (!groupId || !accessToken || !calendarId) {
      throw new Error('Missing required configuration. Please set GROUPME_GROUP_ID, GROUPME_ACCESS_TOKEN, and GOOGLE_CALENDAR_ID.');
    }
    
    // Get GroupMe events
    const groupMeEvents = getGroupMeEvents(groupId, accessToken);
    console.log(`Found ${groupMeEvents.length} GroupMe events`);
    
    // Get Google Calendar
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      throw new Error('Google Calendar not found. Check your GOOGLE_CALENDAR_ID.');
    }
    
    // Sync events
    syncEvents(groupMeEvents, calendar, syncDaysAhead, eventPrefix);
    
    console.log('GroupMe calendar sync completed successfully!');
    
  } catch (error) {
    console.error('Error syncing GroupMe calendar:', error);
    throw error;
  }
}

/**
 * Fetch events from GroupMe API
 */
const getGroupMeEvents = (groupId: string, accessToken: string) => {
  const url = `https://api.groupme.com/v3/conversations/${groupId}/events/list`;
  
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    headers: {
      'X-Access-Token': accessToken,
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseData: GroupMeResponse = JSON.parse(response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      throw new Error(`GroupMe API error: ${responseData.meta?.errors?.[0] ?? 'Unknown error'}`);
    }
    
    return responseData.response?.events || [];
    
  } catch (error) {
    console.error('Error fetching GroupMe events:', error);
    return [];
  }
}

/**
 * Sync GroupMe events to Google Calendar
 */
const syncEvents = (
  groupMeEvents: GroupMeEvent[], 
  calendar: GoogleAppsScript.Calendar.Calendar, 
  syncDaysAhead: number, 
  eventPrefix: string
) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (syncDaysAhead * 24 * 60 * 60 * 1000));
  
  // Get existing events from Google Calendar
  const existingEvents = calendar.getEvents(now, futureDate);
  const existingGroupMeEvents = existingEvents.filter(event => 
    event.getTitle().startsWith(eventPrefix)
  );
  
  // Track processed events
  const processedEventIds = new Set<string>();
  
  // Process each GroupMe event
  groupMeEvents.forEach(groupMeEvent => {
    try {
      const eventId = groupMeEvent.event_id;
      processedEventIds.add(eventId);
      
      // Parse event details
      const startTime = new Date(groupMeEvent.start_at);
      const endTime = groupMeEvent.end_at ? new Date(groupMeEvent.end_at) : 
                     new Date(startTime.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours
      
      // Skip past events
      if (endTime < now) {
        return;
      }
      
      const title = eventPrefix + (groupMeEvent.name ?? 'Untitled Event');
      const description = buildEventDescription(groupMeEvent);
      const location = groupMeEvent.location?.name ?? '';
      
      // Check if event already exists
      const existingEvent = findExistingEvent(existingGroupMeEvents, eventId);
      
      if (existingEvent) {
        // Update existing event if needed
        updateEventIfNeeded(existingEvent, {
          title,
          startTime,
          endTime,
          description,
          location
        });
      } else {
        // Create new event
        const newEvent = calendar.createEvent(title, startTime, endTime, {
          description: description,
          location: location
        });
        
        // Store GroupMe event ID in event description for tracking
        newEvent.setDescription(description + `\n\n[GroupMe Event ID: ${eventId}]`);
        
        console.log(`Created event: ${title}`);
      }
      
    } catch (error) {
      console.error(`Error processing GroupMe event ${groupMeEvent.id}:`, error);
    }
  });
  
  // Remove events that no longer exist in GroupMe
  cleanupRemovedEvents(existingGroupMeEvents, processedEventIds);
}

/**
 * Build event description from GroupMe event data
 */
const buildEventDescription = (groupMeEvent: GroupMeEvent) => {
  let description = '';
  
  if (groupMeEvent.description) {
    description += groupMeEvent.description + '\n\n';
  }
  
  if (groupMeEvent.location?.name) {
    description += `Location: ${groupMeEvent.location.name}\n`;
  }
  
  if (groupMeEvent.going_count !== undefined) {
    description += `Going: ${groupMeEvent.going_count} people\n`;
  }
  
  description += `\nSynced from GroupMe`;
  
  return description;
}

/**
 * Find existing event by GroupMe ID or title
 */
const findExistingEvent = (
  existingEvents: GoogleAppsScript.Calendar.CalendarEvent[], 
  groupMeId: string
) => {
  return existingEvents.find(event => {
    const description = event.getDescription();
    return description.includes(`[GroupMe Event ID: ${groupMeId}]`);
  });
}

/**
 * Update existing event if details have changed
 */
const updateEventIfNeeded = (
  event: GoogleAppsScript.Calendar.CalendarEvent, 
  newDetails: EventDetails
) => {
  let updated = false;

  console.log(`Existing event: ${event.getTitle()} - ${event.getStartTime()} to ${event.getEndTime()}`);
  
  if (event.getTitle() !== newDetails.title) {
    event.setTitle(newDetails.title);
    updated = true;
  }
  
  if (event.getStartTime().getTime() !== newDetails.startTime.getTime()) {
    event.setTime(newDetails.startTime, newDetails.endTime);
    updated = true;
  }
  
  if (event.getLocation() !== newDetails.location) {
    event.setLocation(newDetails.location);
    updated = true;
  }
  
  // Check if description needs updating (excluding the GroupMe ID part)
  const currentDesc = event.getDescription().split('[GroupMe Event ID:')[0].trim();
  const newDesc = newDetails.description.split('[GroupMe Event ID:')[0].trim();
  
  if (currentDesc !== newDesc) {
    
    const groupMeIdMatch = GROUPME_ID_REGEX.exec(event.getDescription());
    const fullDescription = newDetails.description + 
      (groupMeIdMatch ? `\n\n[GroupMe Event ID: ${groupMeIdMatch[1]}]` : '');
    event.setDescription(fullDescription);
    updated = true;
  }
  
  if (updated) {
    console.log(`Updated event: ${event.getTitle()} - ${event.getStartTime()} to ${event.getEndTime()}`);
  }
}

/**
 * Remove Google Calendar events that no longer exist in GroupMe
 */
const cleanupRemovedEvents = (
  existingEvents: GoogleAppsScript.Calendar.CalendarEvent[], 
  processedEventIds: Set<string>
) => {
  existingEvents.forEach(event => {
    const description = event.getDescription();
    const match = GROUPME_ID_REGEX.exec(description);
    
    if (match) {
      const groupMeId = match[1];
      if (!processedEventIds.has(groupMeId)) {
        event.deleteEvent();
        console.log(`Deleted removed event: ${event.getTitle()}`);
      }
    }
  });
}
