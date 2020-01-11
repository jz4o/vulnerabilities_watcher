/**
 * Redmineにチケットを登録.
 * ※前回確認時以降に新しい脆弱性情報・注意喚起情報が発表されていない場合に使用
 *
 * @param {String} siteName  脆弱性情報・注意喚起情報の取得元
 * @param {Date}   watchedAt 確認日時
 *
 * @return {HashMap} 作成したチケット
 */
function createTicketForWhenNotFoundNewVulnerability(siteName, watchedAt) {
  return createTicket(
    buildTicketSubject(siteName, watchedAt, null),
    '',
    redmine['status']['resolve'],
    redmine['category']['vulnerabilityNothing'],
    100
  );
}

/**
 * Redmineにチケットを登録.
 * ※対応が必要ない脆弱性情報・注意喚起情報が発表されている場合に使用
 *
 * @param {String} siteName           脆弱性情報・注意喚起情報の取得元
 * @param {Date}   watchedAt          確認日時
 * @param {String} vulnerabilityTitle 脆弱性情報・注意喚起情報のタイトル
 * @param {String} vulnerabilityLink  脆弱性情報・注意喚起情報のURL
 *
 * @return {HashMap} 作成したチケット
 */
function createTicketForWatchOver(siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink) {
  return createTicket(
    buildTicketSubject(siteName, watchedAt, vulnerabilityTitle),
    vulnerabilityLink,
    redmine['status']['resolve'],
    redmine['category']['watchOver'],
    100
  );
}

/**
 * Redmineにチケットを登録.
 * ※対応の有無の確認が必要な脆弱性情報・注意喚起情報が発表されている場合に使用
 *
 * @param {String} siteName           脆弱性情報・注意喚起情報の取得元
 * @param {Date}   watchedAt          確認日時
 * @param {String} vulnerabilityTitle 脆弱性情報・注意喚起情報のタイトル
 * @param {String} vulnerabilityLink  脆弱性情報・注意喚起情報のURL
 *
 * @return {HashMap} 作成したチケット
 */
function createTicketForEscalation(siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink) {
  return createTicket(
    buildTicketSubject(siteName, watchedAt, vulnerabilityTitle),
    vulnerabilityLink,
    redmine['status']['new'],
    redmine['category']['escalation'],
    0
  );
}

/**
 * Redmineのチケットの件名を作成し、呼び出し元に返す.
 *
 * @param {String} siteName           脆弱性情報・注意喚起情報の取得元
 * @param {Date}   watchedAt          確認日時
 * @param {String} vulnerabilityTitle 脆弱性情報・注意喚起情報の件名
 *
 * @return {String} チケットの件名
 */
function buildTicketSubject(sitename, watchedAt, vulnerabilityTitle) {
  var subject = sitename + ' ' + Utilities.formatDate(watchedAt, 'JST', 'YYYY-MM-dd HH:mm');
  if (vulnerabilityTitle) {
    subject += ' [' + vulnerabilityTitle + ']';
  }

  return subject;
}

/**
 * Redmineのチケットを作成.
 *
 * @param {String}  subject     チケットの件名
 * @param {String}  description チケットの説明
 * @param {Integer} statusId    チケットのステータスID
 * @param {Integer} categoryId  チケットのカテゴリID
 * @param {Integer} doneRatio   チケットの進捗率
 *
 * @return {HashMap} 作成したチケット
 */
function createTicket(subject, description, statusId, categoryId, doneRatio) {
  var requestBody = {
    "issue": {
      "project_id"     : redmine['projectId'],
      "tracker_id"     : redmine['tracker']['task'],
      "subject"        : subject,
      "description"    : description,
      "status_id"      : statusId,
      "priority_id"    : redmine['priority']['normal'],
      "assigned_to_id" : config['watcherRedmineId'],
      "category_id"    : categoryId,
      "done_ratio"     : doneRatio
    }
  }

  var headers = {
    'X-Redmine-API-Key': redmine['apiKey']
  };

  var options = {
    'method'      : 'post',
    'contentType' : 'application/json',
    "headers"     : headers,
    'payload'     : JSON.stringify(requestBody)
  }

  var response = UrlFetchApp.fetch(redmine['url'] + '/issues.json', options);
  return JSON.parse(response.getContentText())['issue'];
}

/**
 * RedmineのチケットのIDを取得し、呼び出し元に返す.
 *
 * @param {String} vulnerabilityLink 脆弱性情報・注意喚起情報のURL
 *
 * @return {Integer|null} 該当の脆弱性情報・注意喚起情報のチケットのID
 */
function getTicketId(vulnerabilityLink) {
  var headers = {
    'X-Redmine-API-Key': redmine['apiKey']
  };

  var options = {
    'method'  : 'get',
    'headers' : headers
  }

  var response = UrlFetchApp.fetch(redmine['url'] + '/search.json?q=' + vulnerabilityLink, options);
  var json = JSON.parse(response.getContentText());

  if (json['total_count'] <= 0) {
    return null;
  } else {
    return json['results'][0]['id'];
  }
}

/**
 * 不要となったチケットのIDを取得し、呼び出し元に返す.
 *
 * 不要チケットの条件：
 *  * ステータスが解決
 *  * 最終更新日から猶予期間を経過している
 *  * 進捗率が100%
 *
 *  @return {Array} 不要となったチケットのID
 */
function getResolvedTicketIds() {
  var headers = {
    'X-Redmine-API-Key': redmine['apiKey']
  };

  var options = {
    'method'  : 'get',
    'headers' : headers
  }

  var borderDate = new Date();
  borderDate.setDate(borderDate.getDate() - redmine['marginDaysForResolveToFinish']);

  var searchConditions = [];
  searchConditions.push('project_id=' + redmine['projectId']);
  searchConditions.push('status_id=' + redmine['status']['resolve']);
  searchConditions.push('updated_on=%3C%3D' + Utilities.formatDate(borderDate, 'JST', 'yyyy-MM-dd')); // <=borderDate
  searchConditions.push('done_ratio=%3E%3D100');                                                      // >=100

  var response = UrlFetchApp.fetch(redmine['url'] + '/issues.json?' + searchConditions.join('&'), options);
  var json = JSON.parse(response.getContentText());

  var result = [];
  json['issues'].forEach(function(issue) {
    result.push(issue['id']);
  });

  return result;
}

/**
 * 不要となったチケットのステータスを終了に更新する.
 */
function finishForResolvedTickets() {
  var requestBody = {
    'issue': {
      'status_id': redmine['status']['finish'],
      'notes'    : '解決済チケットを終了（スクリプトによる自動終了）'
    }
  }
  var headers = {
    'X-Redmine-API-Key': redmine['apiKey']
  };
  var options = {
    'method'      : 'put',
    'contentType' : 'application/json',
    'headers'     : headers,
    'payload'     : JSON.stringify(requestBody)
  };

  getResolvedTicketIds().forEach(function(ticketId) {
    UrlFetchApp.fetch(redmine['url'] + '/issues/' + ticketId + '.json', options);
  });
}
