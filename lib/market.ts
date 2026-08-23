export function getNewYorkTime(date: Date = new Date()) {
  return new Date(
    date.toLocaleString("en-US", {
      timeZone: "America/New_York",
    })
  );
}

export function isMarketOpen() {
  const nyTime = getNewYorkTime();
  const day = nyTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hours = nyTime.getHours();

  // For S&P 500 CFDs, typical trading hours are 24/5:
  // Opens: Sunday 5:00 PM (17:00) ET
  // Closes: Friday 5:00 PM (17:00) ET
  
  // Saturday: Closed all day
  if (day === 6) {
    return false;
  }
  
  // Friday: Closes at 5:00 PM
  if (day === 5 && hours >= 17) {
    return false;
  }
  
  // Sunday: Opens at 5:00 PM
  if (day === 0 && hours < 17) {
    return false;
  }
  
  // Monday through Thursday, and the open portions of Sunday/Friday
  return true;
}
