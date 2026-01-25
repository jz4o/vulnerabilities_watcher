const windowsForestWatcherTest = () => {
  const getWindowsForestSecurityArticlesOrigin = WindowsForestWatcher.getWindowsForestSecurityArticles;
  const redmineIsCreateTicketOrigin = redmine['isCreateTicket'];
  const getTicketIdOrigin = getTicketId;
  const createTicketForWatchOverOrigin = createTicketForWatchOver;
  const createTicketForWhenNotFoundNewVulnerabilityOrigin = createTicketForWhenNotFoundNewVulnerability;
  const postMessageOrigin = postMessage;

  const getMockArticles = () => [
    { 'title': 'title1', 'link': 'link1', 'date': new Date(0) },
    { 'title': 'title2', 'link': 'link2', 'date': new Date(1000) },
    { 'title': 'title3', 'link': 'link3', 'date': new Date(2000) },
  ];

  exports({
    'WindowsForestWatcher': {
      'watch': {
        'when not create tickets in redmine': () => {
          // override to mock
          redmine['isCreateTicket'] = false;
          WindowsForestWatcher.getWindowsForestSecurityArticles = getMockArticles;

          getTIcketId = _ => null;

          const createTicketForWatchOverHistory = [];
          createTicketForWatchOver = (siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink) => {
            createTicketForWatchOverHistory.push({
              'siteName': siteName,
              'watchedAt': watchedAt,
              'vulnerabilityTitle': vulnerabilityTitle,
              'vulnerabilityLink': vulnerabilityLink,
            });

            return { 'id': parseInt(vulnerabilityTitle.replace('title', '')) };
          };
          const createTicketForWhenNotFoundNewVulnerabilityHistory = [];
          createTicketForWhenNotFoundNewVulnerability = (siteName, watchedAt) => {
            createTicketForWhenNotFoundNewVulnerabilityHistory.push({
              'siteName': siteName,
              'watchedAt': watchedAt,
            });
          };

          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          WindowsForestWatcher.watch();

          assertThat(createTicketForWatchOverHistory.length).is(0);
          assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(0);
          assertThat(postMessageHistory.length).is(1);

          // revert overridden
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          WindowsForestWatcher.getWindowsForestSecurityArticles = getWindowsForestSecurityArticlesOrigin;
          getTicketId = getTicketIdOrigin;
          createTicketForWatchOver = createTicketForWatchOverOrigin;
          createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
          postMessage = postMessageOrigin;
        },
        'when create tickets in redmine': {
          'when if created ticket': () => {
            // override to mock
            redmine['isCreateTicket'] = true;
            WindowsForestWatcher.getWindowsForestSecurityArticles = getMockArticles;

            getTicketId = link => link.includes('1') ? 1 : null;

            const createTicketForWatchOverHistory = [];
            createTicketForWatchOver = (siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink) => {
              createTicketForWatchOverHistory.push({
                'siteName': siteName,
                'watchedAt': watchedAt,
                'vulnerabilityTitle': vulnerabilityTitle,
                'vulnerabilityLink': vulnerabilityLink,
              });

              return { 'id': parseInt(vulnerabilityTitle.replace('title', '')) };
            };
            const createTicketForWhenNotFoundNewVulnerabilityHistory = [];
            createTicketForWhenNotFoundNewVulnerability = (siteName, watchedAt) => {
              createTicketForWhenNotFoundNewVulnerabilityHistory.push({
                'siteName': siteName,
                'watchedAt': watchedAt,
              });
            };

            const postMessageHistory = [];
            postMessage = message => {
              postMessageHistory.push(message);
            };

            WindowsForestWatcher.watch();

            const expectPostMessage = '窓の杜：セキュリティ関連記事\n>>>\n'
              + `更新： <link1|title1>\n1970/01/01 09:00:00\n<${redmine.url}/issues/1|Redmine>\n\n`
              + `新規： <link2|title2>\n1970/01/01 09:00:01\n<${redmine.url}/issues/2|Redmine>\n\n`
              + `新規： <link3|title3>\n1970/01/01 09:00:02\n<${redmine.url}/issues/3|Redmine>`;

            assertThat(createTicketForWatchOverHistory.length).is(2);
            assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(0);
            assertThat(postMessageHistory.length).is(1);
            assertThat(postMessageHistory[0]).is(expectPostMessage);

            // revert overridden
            redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
            WindowsForestWatcher.getWindowsForestSecurityArticles = getWindowsForestSecurityArticlesOrigin;
            getTicketId = getTicketIdOrigin;
            createTicketForWatchOver = createTicketForWatchOverOrigin;
            createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
            postMessage = postMessageOrigin;
          },
          'when if not created ticket': () => {
            // override to mock
            redmine['isCreateTicket'] = true;
            WindowsForestWatcher.getWindowsForestSecurityArticles = getMockArticles;

            getTicketId = link => parseInt(link.replace('link', ''));

            const createTicketForWatchOverHistory = [];
            createTicketForWatchOver = (siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink) => {
              createTicketForWatchOverHistory.push({
                'siteName': siteName,
                'watchedAt': watchedAt,
                'vulnerabilityTitle': vulnerabilityTitle,
                'vulnerabilityLink': vulnerabilityLink,
              });

              return { 'id': parseInt(vulnerabilityTitle.replace('title', '')) };
            };
            const createTicketForWhenNotFoundNewVulnerabilityHistory = [];
            createTicketForWhenNotFoundNewVulnerability = (siteName, watchedAt) => {
              createTicketForWhenNotFoundNewVulnerabilityHistory.push({
                'siteName': siteName,
                'watchedAt': watchedAt,
              });
            };

            const postMessageHistory = [];
            postMessage = message => {
              postMessageHistory.push(message);
            };

            WindowsForestWatcher.watch();

            assertThat(createTicketForWatchOverHistory.length).is(0);
            assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(1);
            assertThat(postMessageHistory.length).is(1);

            // revert overridden
            redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
            WindowsForestWatcher.getWindowsForestSecurityArticles = getWindowsForestSecurityArticlesOrigin;
            getTicketId = getTicketIdOrigin;
            createTicketForWatchOver = createTicketForWatchOverOrigin;
            createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
            postMessage = postMessageOrigin;
          },
        },
        'when information is empty': () => {
          // override to mock
          WindowsForestWatcher.getWindowsForestSecurityArticles = _ => [];

          redmine['isCreateTicket'] = false;
          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          WindowsForestWatcher.watch();

          assertThat(postMessageHistory.length).is(0);

          // revert overridden
          WindowsForestWatcher.getWindowsForestSecurityArticles = getWindowsForestSecurityArticlesOrigin;
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          postMessage = postMessageOrigin;
        },
        'when information is exists': () => {
          // override to mock
          WindowsForestWatcher.getWindowsForestSecurityArticles = getMockArticles;

          redmine['isCreateTicket'] = false;
          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          WindowsForestWatcher.watch();

          const expect = '窓の杜：セキュリティ関連記事\n>>>\n'
            + '新規： <link1|title1>\n1970/01/01 09:00:00\n\n'
            + '新規： <link2|title2>\n1970/01/01 09:00:01\n\n'
            + '新規： <link3|title3>\n1970/01/01 09:00:02';

          assertThat(postMessageHistory.length).is(1);
          assertThat(postMessageHistory[0]).is(expect);

          // revert overridden
          WindowsForestWatcher.getWindowsForestSecurityArticles = getWindowsForestSecurityArticlesOrigin;
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          postMessage = postMessageOrigin;
        },
      },
      'getWindowsForestSecurityArticles': () => {
        // override to mock
        const fetchOrigin = UrlFetchApp.fetch;
        const fetchResult = {};
        fetchResult.getContentText = () => {
          return `
            <section class="list">
              <div class="article list wrap">
                <ul class="list-02">
                  <li class="item">
                    <div class="body">
                      <div class="image">
                        <p>
                          <a href="https://forest.watch.impress.co.jp/docs/news/target.html">
                            <img src="https://asset.watch.impress.co.jp/img/wf/list/target.jpg" pinger-seen="true">
                          </a>
                        </p>
                      </div>
                      <div class="text">
                        <p class="title">
                          <a href="https://forest.watch.impress.co.jp/docs/news/target.html">
                            取得対象
                          </a>
                        </p>
                        <p class="outline">取得対象の記事</p>
                        <p class="date">(1970/1/2)</p>
                      </div>
                    </div>
                  </li>
                  <li class="item">
                    <div class="body">
                      <div class="image">
                        <p>
                          <a href="https://forest.watch.impress.co.jp/docs/news/watched.html">
                            <img src="https://asset.watch.impress.co.jp/img/wf/list/watched.jpg" pinger-seen="true">
                          </a>
                        </p>
                      </div>
                      <div class="text">
                        <p class="title">
                          <a href="https://forest.watch.impress.co.jp/docs/news/watched.html">
                            確認済み記事
                          </a>
                        </p>
                        <p class="outline">確認済みの記事</p>
                        <p class="date">(1970/1/1)</p>
                      </div>
                    </div>
                  </li>
                  <li class="item ad">
                    <div class="body">
                      <div class="image">
                        <p>
                          <a href="https://forest.watch.impress.co.jp/docs/news/ad.html">
                            <img src="https://asset.watch.impress.co.jp/img/wf/list/ad.jpg" pinger-seen="true">
                          </a>
                        </p>
                      </div>
                      <div class="text">
                        <p class="title">
                          <a href="https://forest.watch.impress.co.jp/docs/news/ad.html">
                            広告
                          </a>
                        </p>
                        <p class="outline">広告</p>
                        <p class="date">(1970/1/2)</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </section>
          `.replace(/\s*\n\s*/g, '');
        };
        UrlFetchApp.fetch = _url => fetchResult;

        const result = WindowsForestWatcher.getWindowsForestSecurityArticles(new Date(1000 * 60 * 60 * 24));
        const resultArticle = JSON.stringify(result[0]);
        const expect = JSON.stringify({
          'title': '取得対象',
          'link': 'https://forest.watch.impress.co.jp/docs/news/target.html',
          'date': new Date('Thu, 02 Jan 1970 23:59:59 +0900'),
        });

        assertThat(result.length).is(1);
        assertThat(resultArticle).is(expect);

        // revert overridden
        UrlFetchApp.fetch = fetchOrigin;
      },
    },
  });
};
