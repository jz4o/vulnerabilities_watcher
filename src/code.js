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
const scriptProperties = PropertiesService.getScriptProperties();
const spreadSheet      = SpreadsheetApp.getActiveSpreadsheet();
let configSheet;
let config;
const slackIncomingUrl = scriptProperties.getProperty('SLACK_INCOMING_URL');
const redmine = {
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
  'marginDaysForResolveToFinish': scriptProperties.getProperty('REDMINE_MARGIN_DAYS_FOR_RESOLVE_TO_FINISH'),
  'isCreateTicket': scriptProperties.getProperty('REDMINE_IS_CREATE_TICKET') == 'true'
};

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
  const sheetNames = ['config'];

  sheetNames.forEach(sheetName => {
    // シート追加
    if (spreadSheet.getSheetByName(sheetName) == null) {
      spreadSheet.insertSheet(sheetName);
    }

    // グローバル変数にセット
    eval(sheetName + 'Sheet = spreadSheet.getSheetByName("' + sheetName + '")');
  });
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
  const configDefaultValues = {};
  getWatcherClasses().forEach(watcher => {
    configDefaultValues[`${watcher.name}LatestWatchedAt`] = new Date(0);
  });

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
  const configData  = configSheet.getDataRange().getValues();
  const titleRow    = configData[0];
  const keyColumn   = titleRow.indexOf('key');
  const valueColumn = titleRow.indexOf('value');

  const result = {};
  configData.forEach(data => {
    const key = data[keyColumn];
    const value = data[valueColumn];

    result[key] = value;
  });

  return result;
}

/**
 * configシートの内容を更新.
 */
function updateConfigSheet() {
  configSheet.clear();
  const data = [];
  data.push(['key', 'value']);
  for (key in config) {
    data.push([key, config[key]]);
  }

  configSheet.getRange(1, 1, data.length, 2).setValues(data);
}

function getWatcherClasses() {
  return [EsetWatcher, Jc3Watcher, JpcertWatcher, WindowsForestWatcher];
}

/**
 * 脆弱性情報・注意喚起情報をチェック
 */
function watch() {
  // セットアップ.
  setup();

  // 今回確認日時
  const watchedAt = new Date();

  // 土日祝日の場合はチェックしない
  if (isHoliday(watchedAt)) {
    return;
  }

  getWatcherClasses().forEach(watcher => {
    try {
      // 前回確認日時
      const latestWatchedAt = config[`${watcher.name}LatestWatchedAt`];

      watcher.watch(latestWatchedAt);

      // 前回確認日時を更新
      config[`${watcher.name}LatestWatchedAt`] = watchedAt;
    } catch(e) {
      const errorMessage = `Error: ${watcher.name}\n${e.stack}`;
      postMessage(errorMessage);
    }
  });

  updateConfigSheet();
}
