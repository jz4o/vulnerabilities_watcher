/**
 * グローバル変数.
 *
 * scriptProperties [Properties]  スクリプトのプロパティ
 * spreadSheet      [SpreadSheet] スプレッドシート
 * configSheet      [Sheet]       configシート
 * config           [HashMap]     configシートの内容
 * slackIncomingUrl [String]      SlackのIncomingWebHooksで設定したURL
 * redmine          [HashMap]     RedmineのAPIを使用するために必要な内容
 */
var scriptProperties = PropertiesService.getScriptProperties();
var spreadSheet      = SpreadsheetApp.getActiveSpreadsheet();
var configSheet;
var config;
var slackIncomingUrl = scriptProperties.getProperty('SLACK_INCOMING_URL');
var redmine = {
  'url'       : scriptProperties.getProperty('REDMINE_URL'),
  'apiKey'    : scriptProperties.getProperty('REDMINE_API_KEY'),
  'projectId' : scriptProperties.getProperty('REDMINE_PROJECT_ID'),
  'tracker' : {
    'task' : scriptProperties.getProperty('REDMINE_TRACKER_TASK_ID')
  },
  'status' : {
    'new'     : scriptProperties.getProperty('REDMINE_STATUS_NEW_ID'),
    'resolve' : scriptProperties.getProperty('REDMINE_STATUS_RESOLVE_ID'),
    'finish'  : scriptProperties.getProperty('REDMINE_STATUS_FINISH_ID')
  },
  'priority' : {
    'normal' : scriptProperties.getProperty('REDMINE_PRIORITY_NORMAL_ID')
  },
  'category' : {
    'vulnerabilityNothing' : scriptProperties.getProperty('REDMINE_CATEGORY_VULNERABILITY_NOTHING_ID'),
    'watchOver'            : scriptProperties.getProperty('REDMINE_CATEGORY_WATCH_OVER_ID'),
    'escalation'           : scriptProperties.getProperty('REDMINE_CATEGORY_ESCALATION_ID')
  },
  'marginDaysForResolveToFinish': scriptProperties.getProperty('REDMINE_MARGIN_DAYS_FOR_RESOLVE_TO_FINISH')
};

// セットアップ.
setup();

/**
 * 各シートおよびconfigの初期化処理.
 */
function setup() {
  setupSheets();
  setupConfig();
}

/**
 * シートの初期化処理.
 *
 * 不足分シートを追加し、グローバル変数にセット
 */
function setupSheets() {
  // シート名
  var sheetNames = ['config'];

  for (var i = 0; i < sheetNames.length; i++) {
    var sheetName = sheetNames[i];

    // シート追加
    if (spreadSheet.getSheetByName(sheetName) == null) {
      spreadSheet.insertSheet(sheetName);
    }

    // グローバル変数にセット
    eval(sheetName + 'Sheet = spreadSheet.getSheetByName("' + sheetName + '")')
  }
}

/**
 * 設定値の初期化処理.
 *
 * 不足分設定を追加し、configシートを更新
 */
function setupConfig() {
  // configシートの内容を取得
  config = getConfig();

  // 設定内容のデフォルト値
  var configDefaultValues = {
    'latestWatchedAt': new Date(0)
  }

  // 設定されていない項目にデフォルト値をセット
  for (key in configDefaultValues) {
    if (config[key] == null) {
      config[key] = configDefaultValues[key];
    }
  }

  // configシートの内容を更新
  updateConfigSheet();
}

/**
 * configシートの内容を取得し、呼び出し元に返す.
 *
 * @return [HashMap] configシートの内容
 */
function getConfig() {
  var result = {};

  var configData  = configSheet.getDataRange().getValues();
  var titleRow    = configData[0];
  var keyColumn   = titleRow.indexOf('key');
  var valueColumn = titleRow.indexOf('value');

  for (var i = 1; i < configData.length; i++) {
    var key = configData[i][keyColumn];
    var value = configData[i][valueColumn];
    result[key] = value;
  }

  return result;
}

/**
 * configシートの内容を更新.
 */
function updateConfigSheet() {
  configSheet.clear();
  var data = [];
  data.push(['key', 'value'])
  for (key in config) {
    data.push([key, config[key]]);
  }

  configSheet.getRange(1, 1, data.length, 2).setValues(data);
}

/**
 * 脆弱性情報・注意喚起情報をチェック
 */
function watch() {
  // 前回確認日時
  var latestWatchedAt = config['latestWatchedAt'];

  // 今回確認日時
  var watchedAt = new Date();

  // 土日祝日の場合はチェックしない
  if (isHoliday(watchedAt)) {
    return;
  }

  // JPCERTから注意喚起情報・脆弱性情報を取得
  var jpcertNewHeadsUps = getJpcertNewHeadsUp(latestWatchedAt);
  var jpcertNewVulnerabilities = getJpcertNewVulnerabilities(latestWatchedAt);

  // JPCERTからの取得結果をRedmineのチケットに登録
  var isJpcertTicketCreated = false;
  var watchOvers = config['jpcertWatchOvers'].split(',');

  jpcertNewHeadsUps.forEach(function(headsUp) {
    var ticketId = getTicketId(headsUp['link']);
    if (ticketId) {
      headsUp['ticketId'] = ticketId;
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

  // Slackへ通知
  if (jpcertNewHeadsUps.length > 0) {
    postMessage(slackMessagefy('JPCERT：注意喚起情報', jpcertNewHeadsUps));
  }
  if (jpcertNewVulnerabilities.length > 0) {
    postMessage(slackMessagefy('JPCERT：脆弱性情報', jpcertNewVulnerabilities));
  }

  // ESETからニュースを取得
  var esetNewNews = getEsetNewNews(latestWatchedAt);

  // ESETからの情報取得結果をRedmineのチケットに登録
  var isEsetTicketCreated = false;
  esetNewNews.forEach(function(news) {
    var ticketId = getTicketId(news['link']);
    if (ticketId) {
      news['ticketId'] = ticketId;
      return;
    }
    isEsetTicketCreated = true;

    var ticket = createTicketForWatchOver('ESET', watchedAt, news['title'], news['link']);
    news['ticketId'] = ticket['id'];
  });

  if (!isEsetTicketCreated) {
    createTicketForWhenNotFoundNewVulnerability('ESET', watchedAt);
  }

  // Slackへ通知
  if (esetNewNews.length > 0) {
    postMessage(slackMessagefy('ESET：ニュース', esetNewNews));
  }

  // JC3から新着情報を取得し、通知
  var jc3NewInformation = getJc3NewInformation(latestWatchedAt);
  var isJc3TicketCreated = false;
  jc3NewInformation.forEach(function(information) {
    var ticketId = getTicketId(information['link']);
    if (ticketId) {
      information['ticketId'] = ticketId;
      return;
    }
    isJc3TicketCreated = true;

    var ticket = createTicketForWatchOver('JC3', watchedAt, information['title'], information['link']);
    information['ticketId'] = ticket['id']
  });

  if (!isJc3TicketCreated) {
    createTicketForWhenNotFoundNewVulnerability('JC3', watchedAt);
  }

  // Slackへ通知
  if (jc3NewInformation.length > 0) {
    postMessage(slackMessagefy('JC3：新着情報', jc3NewInformation));
  }

  // 前回確認日時を更新
  config['latestWatchedAt'] = watchedAt;
  updateConfigSheet();
}

/**
 * JPCERTから注意喚起情報を取得し、呼び出し元へ返す.
 *
 * @param {Date} latestWatchedAt 前回確認日時
 *
 * @return {Array(HashMap)} 注意喚起情報
 */
function getJpcertNewHeadsUp(latestWatchedAt) {
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
function getJpcertNewVulnerabilities(latestWatchedAt) {
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

/**
 * ESETからニュースを取得し、呼び出し元へ返す.
 *
 * @param {Date} latestWatchedAt 前回確認日時
 *
 * @return {Array(HashMap)} ニュース
 */
function getEsetNewNews(latestWatchedAt) {
  var result = [];
  var latestWatchedAtTime = latestWatchedAt.getTime();

  // rssを取得
  var response = UrlFetchApp.fetch('https://eset-info.canon-its.jp/rss/data_format=xml&xml_media_nm=malware');
  var xml = XmlService.parse(response.getContentText());

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

/**
 * JC3から新着情報を取得し、呼び出し元へ返す.
 *
 * @param {Date} latestWatchedAt 前回確認日時
 *
 * @return {Array(HashMap)} 新着情報
 */
function getJc3NewInformation(latestWatchedAt) {
  var result = [];
  var latestWatchedAtTime = latestWatchedAt.getTime();

  var jc3Url = 'https://www.jc3.or.jp/';

  // JC3のHTMLソースを取得
  // ※HTMLソース全体を使用するとXmlServiceによるパースでエラーが発生するため、
  // 必要な箇所だけ使用するようにしている
  var response = UrlFetchApp.fetch(jc3Url);
  var NewsAreaSection = response.getContentText().match(/<section class="topNewsArea">[\s\S]*?<\/section>/);

  // HTMLソースが不正な構成になっているため、暫定的対応
  if (NewsAreaSection == null) {
    NewsAreaSection = response.getContentText().match(/<section class="topNewsArea">[\s\S]*?\/section/);
    NewsAreaSection = NewsAreaSection.toString().replace('<!-- /section', '</dl></section>');
  }

  // XMLService によるパースでエラーが発生する箇所をパース可能な形に置換
  NewsAreaSection = NewsAreaSection.toString().replace(/\<br\>/g, '<br />');
  NewsAreaSection = NewsAreaSection.toString().replace(/<\/dd(?!>)/g, '<\/dd>');

  var xml = XmlService.parse(NewsAreaSection);

  // 新着情報を含むElementを取得
  var newsListElement = xml.getRootElement().getChild('dl'); // 新着情報部分の親Element
  var newsDates  = newsListElement.getChildren('dt');        // 発表時刻
  var newsDescriptions = newsListElement.getChildren('dd');  // 内容

  // 発表時刻の数と内容の数が異なる場合は取得失敗
  if (newsDates.length != newsDescriptions.length) {
    errorMsg = 'JC3の情報取得に失敗しました';
    Logger.log(errorMsg);
    postMessage(errorMsg);

    return result;
  }

  // 新着情報から条件に該当するデータを取得
  for (var i = 0; i < newsDescriptions.length; i++) {
    var newsDescription = newsDescriptions[i].getText().replace(/\s+$/, '');
    var date = new Date(newsDates[i].getText().split(/年|月|日/, 3).join('/') + ' 23:59:59');

    // JC3の会員に関する情報は除外
    if (newsDescription.match(/^賛助会員/)) {
      continue;
    }

    // JC3に関する情報は除外
    if (newsDescription.match(/^当法人が/)) {
      continue;
    }

    // 詳細情報を提示していない情報は除外
    if (!newsDescriptions[i].getChild('ul')) {
      continue;
    }
    var link = jc3Url + newsDescriptions[i].getChild('ul').getChild('li').getChild('a').getAttribute('href').getValue();

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

/**
 * 脆弱性情報・注意喚起情報をSlack通知用に加工して呼び出し元に返す.
 *
 * @param {String}  title 脆弱性情報・注意喚起情報の取得元
 * @param {HashMap} items 脆弱性情報・注意喚起情報
 *
 * @return {String} 脆弱性情報・注意喚起情報(Slack通知用)
 */
function slackMessagefy(title, items) {
  var result = title + '\n\n';
  result += '>>>\n';
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
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
