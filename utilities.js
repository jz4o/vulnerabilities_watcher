/**
 * 受取った日付が休日・祝日か判定し、結果を呼び出し元に返す.
 *
 * @param {Date} 日付
 *
 * @return {Boolean} 土日祝日：true, 平日：false
 */
function isHoliday(date) {
  // 土日か判定
  var weekInt = date.getDay();
  if (weekInt <= 0 || 6 <= weekInt) {
    return true;
  }

  // 祝日か判定
  var calendarId = 'ja.japanese#holiday@group.v.calendar.google.com';
  var calendar = CalendarApp.getCalendarById(calendarId);
  var todayEvents = calendar.getEventsForDay(date);
  if (todayEvents.length > 0) {
    return true;
  }

  // 土日でも祝日でもない
  return false;
}
