/**
 * グローバル変数.
 *
 * scriptProperties [Properties]  スクリプトのプロパティ
 * spreadSheet      [SpreadSheet] スプレッドシート
 * configSheet      [Sheet]       configシート
 * config           [HashMap]     configシートの内容
 * slackIncomingUrl [String]      SlackのIncomingWebHooksで設定したURL
 */
var scriptProperties = PropertiesService.getScriptProperties();
var spreadSheet      = SpreadsheetApp.getActiveSpreadsheet();
var configSheet;
var config;
var slackIncomingUrl = scriptProperties.getProperty('SLACK_INCOMING_URL');

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

  // JPCERTから注意喚起情報を取得し、通知
  var jpcertNewHeadsUps = getJpcertNewHeadsUp(latestWatchedAt);
  if (jpcertNewHeadsUps.length > 0) {
    postMessage(slackMessagefy('JPCERT：注意喚起情報', jpcertNewHeadsUps));
  }

  // JPCERTから脆弱性情報を取得し、通知
  var jpcertNewVulnerabilities = getJpcertNewVulnerabilities(latestWatchedAt);
  if (jpcertNewVulnerabilities.length > 0) {
    postMessage(slackMessagefy('JPCERT：脆弱性情報', jpcertNewVulnerabilities));
  }

  // ESETからニュースを取得し、通知
  var esetNewNews = getEsetNewNews(latestWatchedAt);
  if (esetNewNews.length > 0) {
    postMessage(slackMessagefy('ESET：ニュース', esetNewNews));
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
    result += "\n";
  }

  return result;
}

/**
 * Slackにメッセージを通知.
 *
 * @param {String} 通知内容
 */
function postMessage(message) {
  var options = {
    'method'     : 'post',
    'contentType': 'application/json',
    'payload'    : JSON.stringify({ 'text': message })
  };

  UrlFetchApp.fetch(slackIncomingUrl, options);
}
