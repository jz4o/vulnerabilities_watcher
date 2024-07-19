class WindowsForestWatcher extends Watcher {
  static watch(latestWatchedAt) {
    // 窓の杜から記事を取得
    const articles = this.getWindowsForestSecurityArticles(latestWatchedAt);

    // 窓の杜からの情報取得結果をRedmineのチケットに登録
    if (redmine['isCreateTicket']) {
      let isTicketCreated = false;
      articles.forEach(function(article) {
        const ticketId = getTicketId(article['link']);
        if (ticketId) {
          article['ticketId'] = ticketId;
          article['isUpdate'] = true;
          return;
        }
        isTicketCreated = true;

        const ticket = createTicketForWatchOver('窓の杜', latestWatchedAt, article['title'], article['link']);
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
    const latestWatchedAtTime = latestWatchedAt.getTime();

    // 窓の杜のHTMLソースを取得
    const response = UrlFetchApp.fetch('https://forest.watch.impress.co.jp/category/security/');
    const articleRegexp = /<section class="list">.*?(<ul class="list-02">.*?<\/ul>).*?<\/section>/;
    const articleSource = response
      .getContentText()
      .match(articleRegexp)[1]
      .replace(/<img.*?>/g, '')
      .replace(/&(?!amp;)/g, '&amp;');

    const xml = XmlService.parse(articleSource);
    const articles = xml.getRootElement().getChildren('li');

    // 新着情報から条件に該当するデータを取得
    const results = articles.map(article => {
      if (article.getAttribute('class').getValue().split(' ').includes('ad')) {
        return;
      }

      const textDivChildren = article
        .getChild('div')
        .getChildren('div')
        .find(child => child.getAttribute('class').getValue() === 'text')
        .getChildren('p');
      const titleAnchor = textDivChildren
        .find(child => child.getAttribute('class').getValue() === 'title')
        .getChild('a');

      const dateStr = textDivChildren
        .find(child => child.getAttribute('class').getValue() === 'date')
        .getValue()
        .replace(/\(|\)/g, '');

      const link = titleAnchor.getAttribute('href').getValue();
      const title = titleAnchor.getText();
      const date = new Date(dateStr + ' 23:59:59');

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
