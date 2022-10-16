class JpcertWatcher extends Watcher {
  static watch(latestWatchedAt) {
    // JPCERTから注意喚起情報・脆弱性情報を取得
    var jpcertNewHeadsUps = this.getJpcertNewHeadsUp(latestWatchedAt);
    var jpcertNewVulnerabilities = this.getJpcertNewVulnerabilities(latestWatchedAt);

    // JPCERTからの取得結果をRedmineのチケットに登録
    if (redmine['isCreateTicket']) {
      var isJpcertTicketCreated = false;
      var watchOvers = config['jpcertWatchOvers'].split(/,|\n/);

      jpcertNewHeadsUps.forEach(function(headsUp) {
        var ticketId = getTicketId(headsUp['link']);
        if (ticketId) {
          headsUp['ticketId'] = ticketId;
          headsUp['isUpdate'] = true;
          return;
        }
        isJpcertTicketCreated = true;

        var isWatchOver = watchOvers.some(function(watchOver) {
          return headsUp['title'].match(watchOver);
        });

        var ticket;
        if (isWatchOver) {
          ticket = createTicketForWatchOver('JPCERT', watchedAt, headsUp['title'], headsUp['link']);
        } else {
          ticket = createTicketForEscalation('JPCERT', watchedAt, headsUp['title'], headsUp['link']);
        }

        headsUp['ticketId'] = ticket['id'];
      });

      jpcertNewVulnerabilities.forEach(function(vulnerability) {
        var ticketId = getTicketId(vulnerability['link']);
        if (ticketId) {
          vulnerability['ticketId'] = ticketId;
          vulnerability['isUpdate'] = true;
          return;
        }
        isJpcertTicketCreated = true;

        var isWatchOver = watchOvers.some(function(watchOver) {
          return vulnerability['title'].match(watchOver);
        });

        var ticket;
        if (isWatchOver) {
          ticket = createTicketForWatchOver('JPCERT', watchedAt, vulnerability['title'], vulnerability['link']);
        } else {
          ticket = createTicketForEscalation('JPCERT', watchedAt, vulnerability['title'], vulnerability['link']);
        }

        vulnerability['ticketId'] = ticket['id']
      });

      if (!isJpcertTicketCreated) {
        createTicketForWhenNotFoundNewVulnerability('JPCERT', watchedAt);
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
    var result = [];
    var latestWatchedAtTime = latestWatchedAt.getTime();

    // rssを取得
    var response = UrlFetchApp.fetch("https://www.jpcert.or.jp/rss/jpcert.rdf");
    var xml = XmlService.parse(response.getContentText());

    // rssのネームスペース
    var namespace = XmlService.getNamespace('http://purl.org/rss/1.0/');
    var namespaceDc = XmlService.getNamespace('http://purl.org/dc/elements/1.1/');

    // rssに含まれるitemから条件に該当するデータを取得
    var items = xml.getRootElement().getChildren("item", namespace);
    for (var i = 0; i < items.length; i++) {
      var item = {
        'title': items[i].getChild('title', namespace).getText(),
        'link' : items[i].getChild('link', namespace).getText(),
        'date' : new Date(items[i].getChild('date', namespaceDc).getText())
      };

      // 注意喚起以外の情報は除外
      if (!item['link'].match(/https:\/\/www\.jpcert\.or\.jp\/at\//)) {
        continue;
      }

      // 確認済みの情報は除外
      if (item['date'].getTime() <= latestWatchedAtTime) {
        continue;
      }

      // タイトルを調整
      item['title'] = item['title'].replace(/^注意喚起:/, '');
      item['title'] = item['title'].replace(/\((?:公開|更新)\)$/, '');
      item['title'] = item['title'].trim();

      result.push(item);
    }

    return result;
  }

  /**
   * JPCERTから脆弱性情報を取得し、呼び出し元へ返す.
   *
   * @param {Date} latestWatchedAt 前回確認日時
   *
   * @return {Array(HashMap)} 脆弱性情報
   */
  static getJpcertNewVulnerabilities(latestWatchedAt) {
    var result = [];
    var latestWatchedAtTime = latestWatchedAt.getTime();

    // rssを取得
    var response = UrlFetchApp.fetch("http://jvn.jp/rss/jvn.rdf");
    var xml = XmlService.parse(response.getContentText());

    // rssのネームスペース
    var namespace = XmlService.getNamespace("http://purl.org/rss/1.0/")
    var namespaceDcTerms = XmlService.getNamespace("http://purl.org/dc/terms/");

    // rssに含まれるitemから条件に該当するデータを取得
    var items = xml.getRootElement().getChildren("item", namespace);
    for (var i = 0; i < items.length; i++) {
      var item = {
        'title' : items[i].getChild('title', namespace).getText(),
        'link'  : items[i].getChild('link', namespace).getText(),
        'date'  : new Date(items[i].getChild('issued', namespaceDcTerms).getText())
      };

      // 確認済みの情報は除外
      if (item['date'].getTime() <= latestWatchedAtTime) {
        continue;
      }

      result.push(item);
    }

    return result;
  }
}