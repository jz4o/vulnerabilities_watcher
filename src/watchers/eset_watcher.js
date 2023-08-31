class EsetWatcher extends Watcher {
  static watch(latestWatchedAt) {
    // ESETからニュースを取得
    var esetNewNews = this.getEsetNewNews(latestWatchedAt);

    // ESETからの情報取得結果をRedmineのチケットに登録
    if (redmine['isCreateTicket']) {
      var isEsetTicketCreated = false;
      esetNewNews.forEach(function(news) {
        var ticketId = getTicketId(news['link']);
        if (ticketId) {
          news['ticketId'] = ticketId;
          news['isUpdate'] = true;
          return;
        }
        isEsetTicketCreated = true;

        var ticket = createTicketForWatchOver('ESET', latestWatchedAt, news['title'], news['link']);
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
    var result = [];
    var latestWatchedAtTime = latestWatchedAt.getTime();

    // rssを取得
    var response = UrlFetchApp.fetch('https://eset-info.canon-its.jp/rss/data_format=xml&xml_media_nm=malware');
    var responseContentText = response.getContentText();

    // linkの開始タグがない問題の暫定対応
    responseContentText = responseContentText.replaceAll(/(?<!<link>)(http.*?)(?=<\/link>)/g, '<link>$1');

    var xml = XmlService.parse(responseContentText);

    // rssに含まれるitemから条件に該当するデータを取得
    var items = xml.getRootElement().getChild('channel').getChildren('item');
    for (var i = 0; i < items.length; i++) {
      var item = {
        'title' : items[i].getChild('title').getText(),
        'link'  : items[i].getChild('link').getText(),
        'date'  : new Date(items[i].getChild('pubDate').getText())
      };

      // ニュース以外の情報は除外
      if (!item['link'].match(/https:\/\/eset\-info\.canon\-its\.jp\/malware_info\/news\/detail\//)) {
        continue;
      }

      // 確認済みの情報は除外
      if (item['date'].getTime() <= latestWatchedAtTime) {
        continue;
      }

      result.push(item);
    }

    return result;
  }
}