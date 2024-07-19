class Watcher {
  static watch() {
    throw `${this.name}.watch is not defined.`;
  }

  /**
   * 脆弱性情報・注意喚起情報をSlack通知用に加工して呼び出し元に返す.
   *
   * @param {String}  title 脆弱性情報・注意喚起情報の取得元
   * @param {HashMap} items 脆弱性情報・注意喚起情報
   *
   * @return {String} 脆弱性情報・注意喚起情報(Slack通知用)
   */
  static slackMessagefy(title, items) {
    const tz = Session.getScriptTimeZone();

    const itemsResult = items.map(item => {
      const itemRows = [];

      const status = item['isUpdate'] ? '更新： ' : '新規： ';
      const titleLink = '<' + item['link'] + '|' + item['title'] + '>';
      itemRows.push(status + titleLink);

      const date = Utilities.formatDate(item['date'], tz, 'yyyy/MM/dd HH:mm:ss');
      itemRows.push(date);

      if (item['ticketId']) {
        const ticketUrl = redmine['url'] + '/issues/' + item['ticketId'];
        const ticketLink = '<' + ticketUrl + '|' + 'Redmine' + '>';
        itemRows.push(ticketLink);
      }

      return itemRows.join('\n');
    }).join('\n\n');

    const result = [
      title,
      '>>>',
      itemsResult
    ].join('\n');

    return result;
  }
}