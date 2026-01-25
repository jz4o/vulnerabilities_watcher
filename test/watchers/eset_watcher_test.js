const esetWatcherTest = () => {
  const getEsetNewNewsOrigin = EsetWatcher.getEsetNewNews;
  const redmineIsCreateTicketOrigin = redmine['isCreateTicket'];
  const getTicketIdOrigin = getTicketId;
  const createTicketForWatchOverOrigin = createTicketForWatchOver;
  const createTicketForWhenNotFoundNewVulnerabilityOrigin = createTicketForWhenNotFoundNewVulnerability;
  const postMessageOrigin = postMessage;

  const getMockNews = () => [
    { 'title': 'title1', 'link': 'link1', 'date': new Date(0) },
    { 'title': 'title2', 'link': 'link2', 'date': new Date(1000) },
    { 'title': 'title3', 'link': 'link3', 'date': new Date(2000) },
  ];

  exports({
    'EsetWatcher': {
      'watch': {
        'when not create tickets in redmine': () => {
          // override to mock
          redmine['isCreateTicket'] = false;
          EsetWatcher.getEsetNewNews = getMockNews;

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

          EsetWatcher.watch();

          assertThat(createTicketForWatchOverHistory.length).is(0);
          assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(0);
          assertThat(postMessageHistory.length).is(1);

          // revert overridden
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          EsetWatcher.getEsetNewNews = getEsetNewNewsOrigin;
          getTicketId = getTicketIdOrigin;
          createTicketForWatchOver = createTicketForWatchOverOrigin;
          createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
          postMessage = postMessageOrigin;
        },
        'when create tickets in redmine': {
          'when if created ticket': () => {
            // override to mock
            redmine['isCreateTicket'] = true;
            EsetWatcher.getEsetNewNews = getMockNews;

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

            EsetWatcher.watch();

            const expectPostMessage = 'ESET：ニュース\n>>>\n'
              + `更新： <link1|title1>\n1970/01/01 09:00:00\n<${redmine.url}/issues/1|Redmine>\n\n`
              + `新規： <link2|title2>\n1970/01/01 09:00:01\n<${redmine.url}/issues/2|Redmine>\n\n`
              + `新規： <link3|title3>\n1970/01/01 09:00:02\n<${redmine.url}/issues/3|Redmine>`;

            assertThat(createTicketForWatchOverHistory.length).is(2);
            assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(0);
            assertThat(postMessageHistory.length).is(1);
            assertThat(postMessageHistory[0]).is(expectPostMessage);

            // revert overridden
            redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
            EsetWatcher.getEsetNewNews = getEsetNewNewsOrigin;
            getTicketId = getTicketIdOrigin;
            createTicketForWatchOver = createTicketForWatchOverOrigin;
            createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
            postMessage = postMessageOrigin;
          },
          'when if not created ticket': () => {
            // override to mock
            redmine['isCreateTicket'] = true;
            EsetWatcher.getEsetNewNews = getMockNews;

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

            EsetWatcher.watch();

            assertThat(createTicketForWatchOverHistory.length).is(0);
            assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(1);
            assertThat(postMessageHistory.length).is(1);

            // revert overridden
            redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
            EsetWatcher.getEsetNewNews = getEsetNewNewsOrigin;
            getTicketId = getTicketIdOrigin;
            createTicketForWatchOver = createTicketForWatchOverOrigin;
            createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
            postMessage = postMessageOrigin;
          },
        },
        'when news is empty': () => {
          // override to mock
          EsetWatcher.getEsetNewNews = _ => [];

          redmine['isCreateTicket'] = false;
          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          EsetWatcher.watch();

          assertThat(postMessageHistory.length).is(0);

          // revert overridden
          EsetWatcher.getEsetNewNews = getEsetNewNewsOrigin;
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          postMessage = postMessageOrigin;
        },
        'when news is exists': () => {
          // override to mock
          EsetWatcher.getEsetNewNews = getMockNews;

          redmine['isCreateTicket'] = false;
          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          EsetWatcher.watch();

          const expect = 'ESET：ニュース\n>>>\n'
            + '新規： <link1|title1>\n1970/01/01 09:00:00\n\n'
            + '新規： <link2|title2>\n1970/01/01 09:00:01\n\n'
            + '新規： <link3|title3>\n1970/01/01 09:00:02';

          assertThat(postMessageHistory.length).is(1);
          assertThat(postMessageHistory[0]).is(expect);

          // revert overridden
          EsetWatcher.getEsetNewNews = getEsetNewNewsOrigin;
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          postMessage = postMessageOrigin;
        },
      },
      'getEsetNewNews': () => {
        // override to mock
        const fetchOrigin = UrlFetchApp.fetch;
        const fetchResult = {};
        fetchResult.getContentText = () => {
          return `
            <rss version="2.0">
              <channel>
                <title>サイバーセキュリティ情報局</title>
                <description></description>
                <link>https://eset-info.canon-its.jp</link>
                <lastBuildDate>Thu, 01 Jan 1970 09:00:02 +0900</lastBuildDate>
                <copyright>©Canon Marketing Japan Inc.</copyright>
                <item>
                  <title>取得対象</title>
                  <link>https://eset-info.canon-its.jp/malware_info/news/detail/target.html</link>
                  <guid isPermaLink="true">https://eset-info.canon-its.jp/malware_info/news/detail/target.html</guid>
                  <pubDate>Thu, 01 Jan 1970 09:00:02 +0900</pubDate>
                  <description>
                    <![CDATA[取得対象の情報]]>
                  </description>
                </item>
                <item>
                  <title>確認済み情報</title>
                  <link>https://eset-info.canon-its.jp/malware_info/news/detail/watched.html</link>
                  <guid isPermaLink="true">https://eset-info.canon-its.jp/malware_info/news/detail/watched.html</guid>
                  <pubDate>Thu, 01 Jan 1970 09:00:00 +0900</pubDate>
                  <description>
                    <![CDATA[確認済みの情報]]>
                  </description>
                </item>
                <item>
                  <title>ニュース外情報</title>
                  <link>https://eset-info.canon-its.jp/malware_info/other-news/detail/other-news.html</link>
                  <guid isPermaLink="true">
                    https://eset-info.canon-its.jp/malware_info/other-news/detail/other-news.html
                  </guid>
                  <pubDate>Thu, 01 Jan 1970 09:00:02 +0900</pubDate>
                  <description>
                    <![CDATA[ニュースではない情報]]>
                  </description>
                </item>
              </channel>
            </rss>
          `;
        };
        UrlFetchApp.fetch = _url => fetchResult;

        const result = EsetWatcher.getEsetNewNews(new Date(1000));
        const resultNews = JSON.stringify(result[0]);
        const expect = JSON.stringify({
          'title': '取得対象',
          'link': 'https://eset-info.canon-its.jp/malware_info/news/detail/target.html',
          'date': new Date('Thu, 01 Jan 1970 09:00:02 +0900'),
        });

        assertThat(result.length).is(1);
        assertThat(resultNews).is(expect);

        // revert overridden
        UrlFetchApp.fetch = fetchOrigin;
      },
    },
  });
};
