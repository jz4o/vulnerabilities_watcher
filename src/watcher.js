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
    var result = title + '\n\n';
    result += '>>>\n';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      result += item['isUpdate'] ? '更新： ' : '新規： ';
      result += '<' + item['link'] + '|' + item['title'] + '>' + "\n";
      result += '[' + item['date'] + ']' + "\n";
      if (item['ticketId']) {
        var ticketUrl = redmine['url'] + '/issues/' + item['ticketId'];
        result += '<' + ticketUrl + '|' + 'Redmine' + '>' + "\n";
      }
      result += "\n";
    }

    return result;
  }
}