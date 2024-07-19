class Jc3Watcher extends Watcher {
  static watch(latestWatchedAt) {
    // JC3から新着情報を取得
    const jc3NewInformation = this.getJc3NewInformation(latestWatchedAt);

    // JC3からの情報取得結果をRedmineのチケットに登録
    if (redmine['isCreateTicket']) {
      let isJc3TicketCreated = false;
      jc3NewInformation.forEach(function(information) {
        const ticketId = getTicketId(information['link']);
        if (ticketId) {
          information['ticketId'] = ticketId;
          information['isUpdate'] = true;
          return;
        }
        isJc3TicketCreated = true;

        const ticket = createTicketForWatchOver('JC3', latestWatchedAt, information['title'], information['link']);
        information['ticketId'] = ticket['id'];
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
    const latestWatchedAtTime = latestWatchedAt.getTime();

    const jc3Url = 'https://www.jc3.or.jp/';

    // JC3のHTMLソースを取得
    // ※HTMLソース全体を使用するとXmlServiceによるパースでエラーが発生するため、
    // 必要な箇所だけ使用するようにしている
    const response = UrlFetchApp.fetch(jc3Url);
    const newsAreaRegexp = /<label class="tab-label TAB-02" for="TAB-02">脅威情報<\/label>\s*(<div[\s\S]*?<\/div>)/;
    const newsAreaSection = response.getContentText().match(newsAreaRegexp)[1];

    const xml = XmlService.parse(newsAreaSection);
    const newsDescriptions = xml.getRootElement().getChildren('article');

    // 新着情報から条件に該当するデータを取得
    const results = newsDescriptions.map(newsDescription => {
      const title = newsDescription.getChild('h3').getValue();
      const dateStr = newsDescription.getChild('ul').getChild('li').getText().split('.').join('/');
      const date = new Date(dateStr + ' 23:59:59');
      const link = newsDescription.getChild('h3').getChild('a').getAttribute('href').getValue();

      // 確認済みの情報は除外
      if (date.getTime() <= latestWatchedAtTime) {
        return;
      }

      const item = {
        'title' : title,
        'link'  : link,
        'date'  : date
      };

      return item;
    }).filter(result => result);

    return results;
  }
}