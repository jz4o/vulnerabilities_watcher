const redmineTest = () => {
  const createTicketOrigin = createTicket;
  const createTicketMock   = (subject, description, statusId, categoryId, doneRatio) => {
    return {
      'subject':     subject,
      'description': description,
      'statusId':    statusId,
      'categoryId':  categoryId,
      'doneRatio':   doneRatio
    };
  };

  // override to mock
  UrlFetchApp = {};
  UrlFetchApp.fetch = (url, params) => {
    return {
      'url': url,
      'params': params
    };
  };

  exports({
    'redmine': {
      'createTicketForWhenNotFoundNewVulnerability': () => {
        // override function to mock
        createTicket = createTicketMock;

        const siteName  = 'testSite';
        const watchedAt = new Date();

        const result = JSON.stringify(createTicketForWhenNotFoundNewVulnerability(siteName, watchedAt));
        const expect = JSON.stringify({
          'subject':     buildTicketSubject(siteName, watchedAt, null),
          'description': '',
          'statusId':    redmine['status']['resolve'],
          'categoryId':  redmine['category']['vulnerabilityNothing'],
          'doneRatio':   100
        });

        assertThat(result).is(expect);

        // revert overridden function
        createTicket = createTicketOrigin;
      },
      'createTicketForWatchOver': () => {
        // override function to mock
        createTicket = createTicketMock;

        const siteName           = 'testSite';
        const watchedAt          = new Date();
        const vulnerabilityTitle = 'testTitle';
        const vulnerabilityLink  = 'testLink';

        const result = JSON.stringify(
          createTicketForWatchOver(siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink)
        );
        const expect = JSON.stringify({
          'subject':     buildTicketSubject(siteName, watchedAt, vulnerabilityTitle),
          'description': vulnerabilityLink,
          'statusId':    redmine['status']['resolve'],
          'categoryId':  redmine['category']['watchOver'],
          'doneRatio':   100
        });

        assertThat(result).is(expect);

        // revert overridden function
        createTicket = createTicketOrigin;
      },
      'createTicketForEscalation': () => {
        // override function to mock
        createTicket = createTicketMock;

        const siteName           = 'testSite';
        const watchedAt          = new Date();
        const vulnerabilityTitle = 'testTitle';
        const vulnerabilityLink  = 'testLink';

        const result = JSON.stringify(
          createTicketForEscalation(siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink)
        );
        const expect = JSON.stringify({
          'subject':     buildTicketSubject(siteName, watchedAt, vulnerabilityTitle),
          'description': vulnerabilityLink,
          'statusId':    redmine['status']['new'],
          'categoryId':  redmine['category']['escalation'],
          'doneRatio':   0
        });

        assertThat(result).is(expect);

        // revert overridden function
        createTicket = createTicketOrigin;
      },
      'buildTicketSubject': {
        'when vulnerability title is specified': () => {
          const sitename           = 'testSite';
          const watchedAt          = new Date(0);
          const vulnerabilityTitle = 'testTitle';

          const result = buildTicketSubject(sitename, watchedAt, vulnerabilityTitle);
          const expect = 'testSite 1970-01-01 09:00 [testTitle]';

          assertThat(result).is(expect);
        },
        'when vulnerability title is not specified': () => {
          const sitename           = 'testSite';
          const watchedAt          = new Date(0);
          const vulnerabilityTitle = null;

          const result = buildTicketSubject(sitename, watchedAt, vulnerabilityTitle);
          const expect = 'testSite 1970-01-01 09:00';

          assertThat(result).is(expect);
        }
      },
      'createTicket': () => {
        // override to mock
        const fetchOrigin = UrlFetchApp.fetch;
        const fetchResult = {};
        fetchResult.getContentText = () => JSON.stringify({ 'issue': 'dummyIssue' });
        const fetchHistory = [];
        UrlFetchApp.fetch = (url, options) => {
          fetchHistory.push({ 'url': url, 'options': options });
          return fetchResult;
        };

        const subject     = 'testTitle';
        const description = 'testDescription';
        const statusId    = 999;
        const categoryId  = 888;
        const doneRatio   = 100;

        const result = createTicket(subject, description, statusId, categoryId, doneRatio);
        const expect = 'dummyIssue';
        assertThat(result).is(expect);

        assertThat(fetchHistory.length).is(1);

        const resultUrl = fetchHistory[0].url;
        const resultOptions = JSON.stringify(fetchHistory[0].options);
        const expectUrl = redmine['url'] + '/issues.json';
        const expectOptions = JSON.stringify({
          'method'      : 'post',
          'contentType' : 'application/json',
          'headers'     : {
            'X-Redmine-API-Key': redmine['apiKey']
          },
          'payload'     : JSON.stringify({
            'issue': {
              'project_id'     : redmine['projectId'],
              'tracker_id'     : redmine['tracker']['task'],
              'subject'        : subject,
              'description'    : description,
              'status_id'      : statusId,
              'priority_id'    : redmine['priority']['normal'],
              'assigned_to_id' : config['watcherRedmineId'],
              'category_id'    : categoryId,
              'done_ratio'     : doneRatio
            }
          })
        });
        assertThat(resultUrl).is(expectUrl);
        assertThat(resultOptions).is(expectOptions);

        // revert overridden
        UrlFetchApp.fetch = fetchOrigin;
      },
      'getTicketId': {
        'when ticket exist': () => {
          // override to mock
          const fetchOrigin = UrlFetchApp.fetch;
          const fetchResult = {};
          fetchResult.getContentText = () => JSON.stringify({
            'total_count': 1,
            'results': [
              { 'id': 999 }
            ]
          });
          UrlFetchApp.fetch = (_url, _options) => fetchResult;

          const vulnerabilityLink = 'testLink';

          const result = getTicketId(vulnerabilityLink);
          const expect = 999;

          assertThat(result).is(expect);

          // revert overridden
          UrlFetchApp.fetch = fetchOrigin;
        },
        'when ticket not exist': () => {
          // override to mock
          const fetchOrigin = UrlFetchApp.fetch;
          const fetchResult = {};
          fetchResult.getContentText = () => JSON.stringify({
            'total_count': 0,
            'results': []
          });
          UrlFetchApp.fetch = (_url, _options) => fetchResult;

          const vulnerabilityLink = 'testLink';

          const result = getTicketId(vulnerabilityLink);
          const expect = null;

          assertThat(result).is(expect);

          // revert overridden
          UrlFetchApp.fetch = fetchOrigin;
        }
      },
      'getResolvedTicketIds': () => {
        // override to mock
        const fetchOrigin = UrlFetchApp.fetch;
        const fetchResult = {};
        fetchResult.getContentText = () => JSON.stringify({ 'issues': [{ 'id': 1 }, { 'id': 2 }, { 'id': 3 }] });
        UrlFetchApp.fetch = (_url, _options) => fetchResult;

        const result = JSON.stringify(getResolvedTicketIds());
        const expect = JSON.stringify([1, 2, 3]);

        assertThat(result).is(expect);

        // revert overridden
        UrlFetchApp.fetch = fetchOrigin;
      },
      'finishFOrResolvedTickets': () => {
        // override function to mock
        const getResolvedTicketIdsOrigin = getResolvedTicketIds;
        const mockResolvedTickerIds = [1, 2, 3];
        getResolvedTicketIds = () => mockResolvedTickerIds;

        const fetchHistory = [];
        UrlFetchApp.fetch = (url, params) => {
          const result = {
            'url': url,
            'params': params
          };

          fetchHistory.push(result);
          return result;
        };

        finishForResolvedTickets();

        const result = JSON.stringify(fetchHistory);
        const expect = JSON.stringify(mockResolvedTickerIds.map(i => ({
          'url': `${redmine.url}/issues/${i}.json`,
          'params': {
            'method': 'put',
            'contentType': 'application/json',
            'headers': {
              'X-Redmine-API-Key': redmine.apiKey,
            },
            'payload': JSON.stringify({
              'issue': {
                'status_id': redmine.status.finish,
                'notes': '解決済チケットを終了（スクリプトによる自動終了）',
              },
            })
          },
        })));

        assertThat(result).is(expect);

        // revert overridden function
        getResolvedTicketIds = getResolvedTicketIdsOrigin;
        UrlFetchApp.fetch = (url, params) => {
          return {
            'url': url,
            'params': params
          };
        };
      },
    }
  });
};
