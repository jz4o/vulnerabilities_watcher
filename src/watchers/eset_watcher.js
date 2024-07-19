class EsetWatcher extends Watcher {
  static watch(latestWatchedAt) {
    // ESETからニュースを取得
    const esetNewNews = this.getEsetNewNews(latestWatchedAt);

    // ESETからの情報取得結果をRedmineのチケットに登録
    if (redmine['isCreateTicket']) {
      let isEsetTicketCreated = false;
      esetNewNews.forEach(function(news) {
        const ticketId = getTicketId(news['link']);
        if (ticketId) {
          news['ticketId'] = ticketId;
          news['isUpdate'] = true;
          return;
        }
        isEsetTicketCreated = true;

        const ticket = createTicketForWatchOver('ESET', latestWatchedAt, news['title'], news['link']);
        news['ticketId'] = ticket['id'];
      });

      if (!isEsetTicketCreated) {
        createTicketForWhenNotFoundNewVulnerability('ESET', latestWatchedAt);
      }
    }

    // Slackへ通知
    if (esetNewNews.length > 0) {
      postMessage(this.slackMessagefy('ESET：ニュース', esetNewNews));
    }
  }

  /**
   * ESETからニュースを取得し、呼び出し元へ返す.
   *
   * @param {Date} latestWatchedAt 前回確認日時
   *
   * @return {Array(HashMap)} ニュース
   */
  static getEsetNewNews(latestWatchedAt) {
    const latestWatchedAtTime = latestWatchedAt.getTime();

    // rssを取得
    const response = UrlFetchApp.fetch('https://eset-info.canon-its.jp/rss/data_format=xml&xml_media_nm=malware');
    let responseContentText = response.getContentText();

    // linkの開始タグがない問題の暫定対応
    responseContentText = responseContentText.replaceAll(/(?<!<link>)(http.*?)(?=<\/link>)/g, '<link>$1');

    const xml = XmlService.parse(responseContentText);

    // rssに含まれるitemから条件に該当するデータを取得
    const items = xml.getRootElement().getChild('channel').getChildren('item');
    const results = items.map(item => {
      const result = {
        'title' : item.getChild('title').getText(),
        'link'  : item.getChild('link').getText(),
        'date'  : new Date(item.getChild('pubDate').getText())
      };

      // ニュース以外の情報は除外
      if (!result['link'].match(/https:\/\/eset-info\.canon-its\.jp\/malware_info\/news\/detail\//)) {
        return;
      }

      // 確認済みの情報は除外
      if (result['date'].getTime() <= latestWatchedAtTime) {
        return;
      }

      return result;
    }).filter(result => result);

    return results;
  }
}