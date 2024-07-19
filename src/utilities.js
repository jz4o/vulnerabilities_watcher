/**
 * 受取った日付が休日・祝日か判定し、結果を呼び出し元に返す.
 *
 * @param {Date} 日付
 *
 * @return {Boolean} 土日祝日：true, 平日：false
 */
function isHoliday(date) {
  // 土日か判定
  const weekInt = date.getDay();
  if (weekInt <= 0 || 6 <= weekInt) {
    return true;
  }

  // 祝日か判定
  const calendarId = 'ja.japanese#holiday@group.v.calendar.google.com';
  const calendar = CalendarApp.getCalendarById(calendarId);
  const todayEvents = calendar.getEventsForDay(date);
  if (todayEvents.length > 0) {
    return true;
  }

  // 土日でも祝日でもない
  return false;
}

/**
 * Slackにメッセージを通知.
 *
 * @param {String} message 通知内容
 *
 * @return {HTTPResponse} 通知結果
 */
function postMessage(message) {
  const options = {
    'method'     : 'post',
    'contentType': 'application/json',
    'payload'    : JSON.stringify({ 'text': message })
  };

  return UrlFetchApp.fetch(slackIncomingUrl, options);
}
