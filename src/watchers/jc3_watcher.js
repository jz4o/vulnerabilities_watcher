class Jc3Watcher extends Watcher {
  static watch(latestWatchedAt) {
    // JC3から新着情報を取得
    var jc3NewInformation = this.getJc3NewInformation(latestWatchedAt);

    // JC3からの情報取得結果をRedmineのチケットに登録
    if (redmine['isCreateTicket']) {
      var isJc3TicketCreated = false;
      jc3NewInformation.forEach(function(information) {
        var ticketId = getTicketId(information['link']);
        if (ticketId) {
          information['ticketId'] = ticketId;
          information['isUpdate'] = true;
          return;
        }
        isJc3TicketCreated = true;

        var ticket = createTicketForWatchOver('JC3', latestWatchedAt, information['title'], information['link']);
        information['ticketId'] = ticket['id']
      });

      if (!isJc3TicketCreated) {
        createTicketForWhenNotFoundNewVulnerability('JC3', latestWatchedAt);
      }
    }

    // Slackへ通知
    if (jc3NewInformation.length > 0) {
      postMessage(this.slackMessagefy('JC3：新着情報', jc3NewInformation));
    }
  }

  /**
   * JC3から新着情報を取得し、呼び出し元へ返す.
   *
   * @param {Date} latestWatchedAt 前回確認日時
   *
   * @return {Array(HashMap)} 新着情報
   */
  static getJc3NewInformation(latestWatchedAt) {
    var result = [];
    var latestWatchedAtTime = latestWatchedAt.getTime();

    var jc3Url = 'https://www.jc3.or.jp/';

    // JC3のHTMLソースを取得
    // ※HTMLソース全体を使用するとXmlServiceによるパースでエラーが発生するため、
    // 必要な箇所だけ使用するようにしている
    var response = UrlFetchApp.fetch(jc3Url);
    var newsAreaSection = response.getContentText().match(/<label class="tab-label TAB-02" for="TAB-02">脅威情報<\/label>\s*(<div[\s\S]*?<\/div>)/)[1];

    var xml = XmlService.parse(newsAreaSection);
    var newsDescriptions = xml.getRootElement().getChildren('article');

    // 新着情報から条件に該当するデータを取得
    for (var i = 0; i < newsDescriptions.length; i++) {
      var newsDescription = newsDescriptions[i].getChild('h3').getValue();
      var date = new Date(newsDescriptions[i].getChild('ul').getChild('li').getText().split('.').join('/') + ' 23:59:59');
      var link = newsDescriptions[i].getChild('h3').getChild('a').getAttribute('href').getValue();

      // 確認済みの情報は除外
      if (date.getTime() <= latestWatchedAtTime) {
        continue;
      }

      var item = {
        'title' : newsDescription,
        'link'  : link,
        'date'  : date
      };

      result.push(item);
    }

    return result;
  }
}