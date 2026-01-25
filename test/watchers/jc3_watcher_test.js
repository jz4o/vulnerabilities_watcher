const jc3WatcherTest = () => {
  const getJc3NewInformationOrigin = Jc3Watcher.getJc3NewInformation;
  const redmineIsCreateTicketOrigin = redmine['isCreateTicket'];
  const getTicketIdOrigin = getTicketId;
  const createTicketForWatchOverOrigin = createTicketForWatchOver;
  const createTicketForWhenNotFoundNewVulnerabilityOrigin = createTicketForWhenNotFoundNewVulnerability;
  const postMessageOrigin = postMessage;

  const getMockInformation = () => [
    { 'title': 'title1', 'link': 'link1', 'date': new Date(0) },
    { 'title': 'title2', 'link': 'link2', 'date': new Date(1000) },
    { 'title': 'title3', 'link': 'link3', 'date': new Date(2000) },
  ];

  exports({
    'Jc3Watcher': {
      'watch': {
        'when not create tickets in redmine': () => {
          // override to mock
          redmine['isCreateTicket'] = false;
          Jc3Watcher.getJc3NewInformation = getMockInformation;

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

          Jc3Watcher.watch();

          assertThat(createTicketForWatchOverHistory.length).is(0);
          assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(0);
          assertThat(postMessageHistory.length).is(1);

          // revert overridden
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          Jc3Watcher.getJc3NewInformation = getJc3NewInformationOrigin;
          getTicketId = getTicketIdOrigin;
          createTicketForWatchOver = createTicketForWatchOverOrigin;
          createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
          postMessage = postMessageOrigin;
        },
        'when create tickets in redmine': {
          'when if created ticket': () => {
            // override to mock
            redmine['isCreateTicket'] = true;
            Jc3Watcher.getJc3NewInformation = getMockInformation;

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

            Jc3Watcher.watch();

            const expectPostMessage = 'JC3：新着情報\n>>>\n'
              + `更新： <link1|title1>\n1970/01/01 09:00:00\n<${redmine.url}/issues/1|Redmine>\n\n`
              + `新規： <link2|title2>\n1970/01/01 09:00:01\n<${redmine.url}/issues/2|Redmine>\n\n`
              + `新規： <link3|title3>\n1970/01/01 09:00:02\n<${redmine.url}/issues/3|Redmine>`;

            assertThat(createTicketForWatchOverHistory.length).is(2);
            assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(0);
            assertThat(postMessageHistory.length).is(1);
            assertThat(postMessageHistory[0]).is(expectPostMessage);

            // revert overridden
            redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
            Jc3Watcher.getJc3NewInformation = getJc3NewInformationOrigin;
            getTicketId = getTicketIdOrigin;
            createTicketForWatchOver = createTicketForWatchOverOrigin;
            createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
            postMessage = postMessageOrigin;
          },
          'when if not created ticket': () => {
            // override to mock
            redmine['isCreateTicket'] = true;
            Jc3Watcher.getJc3NewInformation = getMockInformation;

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

            Jc3Watcher.watch();

            assertThat(createTicketForWatchOverHistory.length).is(0);
            assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(1);
            assertThat(postMessageHistory.length).is(1);

            // revert overridden
            redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
            Jc3Watcher.getJc3NewInformation = getJc3NewInformationOrigin;
            getTicketId = getTicketIdOrigin;
            createTicketForWatchOver = createTicketForWatchOverOrigin;
            createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
            postMessage = postMessageOrigin;
          },
        },
        'when information is empty': () => {
          // override to mock
          Jc3Watcher.getJc3NewInformation = _ => [];

          redmine['isCreateTicket'] = false;
          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          Jc3Watcher.watch();

          assertThat(postMessageHistory.length).is(0);

          // revert overridden
          Jc3Watcher.getJc3NewInformation = getJc3NewInformationOrigin;
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          postMessage = postMessageOrigin;
        },
        'when information is exists': () => {
          // override to mock
          Jc3Watcher.getJc3NewInformation = getMockInformation;

          redmine['isCreateTicket'] = false;
          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          Jc3Watcher.watch();

          const expect = 'JC3：新着情報\n>>>\n'
            + '新規： <link1|title1>\n1970/01/01 09:00:00\n\n'
            + '新規： <link2|title2>\n1970/01/01 09:00:01\n\n'
            + '新規： <link3|title3>\n1970/01/01 09:00:02';

          assertThat(postMessageHistory.length).is(1);
          assertThat(postMessageHistory[0]).is(expect);

          // revert overridden
          Jc3Watcher.getJc3NewInformation = getJc3NewInformationOrigin;
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          postMessage = postMessageOrigin;
        },
      },
      'getJc3NewInformation': () => {
        // override to mock
        const fetchOrigin = UrlFetchApp.fetch;
        const fetchResult = {};
        fetchResult.getContentText = () => {
          return `
            <label class="tab-label TAB-02" for="TAB-02">脅威情報</label>
            <div class="tab-content">
              <article id="entry-target">
                <h3 class="other-link">
                  <a href="https://www.jc3.or.jp/threats/topics/target.html">
                    取得対象
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8.48 14.14">
                      <polygon points="1.41 14.14 8.48 7.07 1.41 0 0 1.42 5.66 7.07 0 12.73 1.41 14.14"></polygon>
                    </svg>
                  </a>
                </h3>
                <ul class="entry-info">
                  <li class="date">1970.1.2</li>
                  <li class="category cat-26">脅威情報</li>
                </ul>
              </article>

              <article id="entry-watched">
                <h3 class="other-link">
                  <a href="https://www.jc3.or.jp/threats/topics/watched.html">
                    確認済み情報
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8.48 14.14">
                      <polygon points="1.41 14.14 8.48 7.07 1.41 0 0 1.42 5.66 7.07 0 12.73 1.41 14.14"></polygon>
                    </svg>
                  </a>
                </h3>
                <ul class="entry-info">
                  <li class="date">1970.1.1</li>
                  <li class="category cat-26">脅威情報</li>
                </ul>
              </article>
            </div>
          `;
        };
        UrlFetchApp.fetch = _url => fetchResult;

        const result = Jc3Watcher.getJc3NewInformation(new Date(1000 * 60 * 60 * 24));
        const resultInformation = JSON.stringify(result[0]);
        const expect = JSON.stringify({
          'title': '取得対象',
          'link': 'https://www.jc3.or.jp/threats/topics/target.html',
          'date': new Date('Thu, 02 Jan 1970 23:59:59 +0900'),
        });

        assertThat(result.length).is(1);
        assertThat(resultInformation).is(expect);

        // revert overridden
        UrlFetchApp.fetch = fetchOrigin;
      },
    },
  });
};
