class WindowsForestWatcher extends Watcher {
  static watch(latestWatchedAt) {
    // 窓の杜から記事を取得
    var articles = this.getWindowsForestSecurityArticles(latestWatchedAt);

    // 窓の杜からの情報取得結果をRedmineのチケットに登録
    if (redmine['isCreateTicket']) {
      var isTicketCreated = false;
      articles.forEach(function(article) {
        var ticketId = getTicketId(article['link']);
        if (ticketId) {
          article['ticketId'] = ticketId;
          article['isUpdate'] = true;
          return;
        }
        isTicketCreated = true;

        var ticket = createTicketForWatchOver('窓の杜', latestWatchedAt, article['title'], article['link']);
        article['ticketId'] = ticket['id'];
      });

      if (!isTicketCreated) {
        createTicketForWhenNotFoundNewVulnerability('窓の杜', latestWatchedAt);
      }
    }

    // Slackへ通知
    if (articles.length > 0) {
      postMessage(this.slackMessagefy('窓の杜：セキュリティ関連記事', articles));
    }
  }

  /**
   * 窓の杜からセキュリティ関連記事を取得し、呼び出し元へ返す.
   *
   * @param {Date} latestWatchedAt 前回確認日時
   *
   * @return {Array(HashMap)} セキュリティ関連記事
   */
  static getWindowsForestSecurityArticles(latestWatchedAt) {
    var result = [];
    var latestWatchedAtTime = latestWatchedAt.getTime();

    // 窓の杜のHTMLソースを取得
    var response = UrlFetchApp.fetch('https://forest.watch.impress.co.jp/category/security/');
    var articleSource = response.getContentText().match(/<section class="list">.*?(<ul class="list-02">.*?<\/ul>).*?<\/section>/)[1].replace(/<img.*?>/g, '');

    var xml = XmlService.parse(articleSource);
    var articles = xml.getRootElement().getChildren('li');

    // 新着情報から条件に該当するデータを取得
    for (var i = 0; i < articles.length; i++) {
      if (articles[i].getAttribute('class').getValue().split(' ').includes('ad')) {
        continue;
      }

      var textDivChildren = articles[i].getChild('div').getChildren('div').find(child => child.getAttribute('class').getValue() === 'text').getChildren('p');
      var titleAnchor = textDivChildren.find(child => child.getAttribute('class').getValue() === 'title').getChild('a');

      var link = titleAnchor.getAttribute('href').getValue();
      var title = titleAnchor.getText();
      var date = new Date(textDivChildren.find(child => child.getAttribute('class').getValue() === 'date').getValue().replace(/\(|\)/g, '') + ' 23:59:59');

      // 確認済みの情報は除外
      if (date.getTime() <= latestWatchedAtTime) {
        continue;
      }

      var item = {
        'title' : title,
        'link'  : link,
        'date'  : date
      };

      result.push(item);
    }

    return result;
  }
}
