class JpcertWatcher extends Watcher {
  static watch(latestWatchedAt) {
    // JPCERTから注意喚起情報・脆弱性情報を取得
    const jpcertNewHeadsUps = this.getJpcertNewHeadsUp(latestWatchedAt);
    const jpcertNewVulnerabilities = this.getJpcertNewVulnerabilities(latestWatchedAt);

    // JPCERTからの取得結果をRedmineのチケットに登録
    if (redmine['isCreateTicket']) {
      let isJpcertTicketCreated = false;
      const watchOvers = config['jpcertWatchOvers'].split(/,|\n/);

      jpcertNewHeadsUps.forEach(function(headsUp) {
        const ticketId = getTicketId(headsUp['link']);
        if (ticketId) {
          headsUp['ticketId'] = ticketId;
          headsUp['isUpdate'] = true;
          return;
        }
        isJpcertTicketCreated = true;

        const isWatchOver = watchOvers.some(function(watchOver) {
          return headsUp['title'].match(watchOver);
        });

        let ticket;
        if (isWatchOver) {
          ticket = createTicketForWatchOver('JPCERT', latestWatchedAt, headsUp['title'], headsUp['link']);
        } else {
          ticket = createTicketForEscalation('JPCERT', latestWatchedAt, headsUp['title'], headsUp['link']);
        }

        headsUp['ticketId'] = ticket['id'];
      });

      jpcertNewVulnerabilities.forEach(function(vulnerability) {
        const ticketId = getTicketId(vulnerability['link']);
        if (ticketId) {
          vulnerability['ticketId'] = ticketId;
          vulnerability['isUpdate'] = true;
          return;
        }
        isJpcertTicketCreated = true;

        const isWatchOver = watchOvers.some(function(watchOver) {
          return vulnerability['title'].match(watchOver);
        });

        let ticket;
        if (isWatchOver) {
          ticket = createTicketForWatchOver('JPCERT', latestWatchedAt, vulnerability['title'], vulnerability['link']);
        } else {
          ticket = createTicketForEscalation('JPCERT', latestWatchedAt, vulnerability['title'], vulnerability['link']);
        }

        vulnerability['ticketId'] = ticket['id'];
      });

      if (!isJpcertTicketCreated) {
        createTicketForWhenNotFoundNewVulnerability('JPCERT', latestWatchedAt);
      }
    }

    // Slackへ通知
    if (jpcertNewHeadsUps.length > 0) {
      postMessage(this.slackMessagefy('JPCERT：注意喚起情報', jpcertNewHeadsUps));
    }
    if (jpcertNewVulnerabilities.length > 0) {
      postMessage(this.slackMessagefy('JPCERT：脆弱性情報', jpcertNewVulnerabilities));
    }
  }

  /**
   * JPCERTから注意喚起情報を取得し、呼び出し元へ返す.
   *
   * @param {Date} latestWatchedAt 前回確認日時
   *
   * @return {Array(HashMap)} 注意喚起情報
   */
  static getJpcertNewHeadsUp(latestWatchedAt) {
    const latestWatchedAtTime = latestWatchedAt.getTime();

    // rssを取得
    const response = UrlFetchApp.fetch('https://www.jpcert.or.jp/rss/jpcert.rdf');
    const xml = XmlService.parse(response.getContentText());

    // rssのネームスペース
    const namespace = XmlService.getNamespace('http://purl.org/rss/1.0/');
    const namespaceDc = XmlService.getNamespace('http://purl.org/dc/elements/1.1/');

    // rssに含まれるitemから条件に該当するデータを取得
    const items = xml.getRootElement().getChildren('item', namespace);
    const results = items.map(item => {
      const result = {
        'title': item.getChild('title', namespace).getText(),
        'link' : item.getChild('link', namespace).getText(),
        'date' : new Date(item.getChild('date', namespaceDc).getText())
      };

      // 注意喚起以外の情報は除外
      if (!result['link'].match(/https:\/\/www\.jpcert\.or\.jp\/at\//)) {
        return;
      }

      // 確認済みの情報は除外
      if (result['date'].getTime() <= latestWatchedAtTime) {
        return;
      }

      // タイトルを調整
      result['title'] = result['title'].replace(/^注意喚起:/, '');
      result['title'] = result['title'].replace(/\((?:公開|更新)\)$/, '');
      result['title'] = result['title'].trim();

      return result;
    }).filter(result => result);

    return results;
  }

  /**
   * JPCERTから脆弱性情報を取得し、呼び出し元へ返す.
   *
   * @param {Date} latestWatchedAt 前回確認日時
   *
   * @return {Array(HashMap)} 脆弱性情報
   */
  static getJpcertNewVulnerabilities(latestWatchedAt) {
    const latestWatchedAtTime = latestWatchedAt.getTime();

    // rssを取得
    const response = UrlFetchApp.fetch('http://jvn.jp/rss/jvn.rdf');
    const xml = XmlService.parse(response.getContentText());

    // rssのネームスペース
    const namespace = XmlService.getNamespace('http://purl.org/rss/1.0/');
    const namespaceDcTerms = XmlService.getNamespace('http://purl.org/dc/terms/');

    // rssに含まれるitemから条件に該当するデータを取得
    const items = xml.getRootElement().getChildren('item', namespace);
    const results = items.map(item => {
      const result = {
        'title' : item.getChild('title', namespace).getText(),
        'link'  : item.getChild('link', namespace).getText(),
        'date'  : new Date(item.getChild('issued', namespaceDcTerms).getText())
      };

      // 確認済みの情報は除外
      if (result['date'].getTime() <= latestWatchedAtTime) {
        return;
      }

      return result;
    }).filter(result => result);

    return results;
  }
}