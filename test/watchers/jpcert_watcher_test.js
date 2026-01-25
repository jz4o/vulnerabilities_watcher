const jpcertWatcherTest = () => {
  setup();

  const getJpcertNewHeadsUpOrigin = JpcertWatcher.getJpcertNewHeadsUp;
  const getJpcertNewVulnerabilitiesOrigin = JpcertWatcher.getJpcertNewVulnerabilities;
  const configJpcertWatchOversOrigin = config['jpcertWatchOvers'];
  const redmineIsCreateTicketOrigin = redmine['isCreateTicket'];
  const getTicketIdOrigin = getTicketId;
  const createTicketForWatchOverOrigin = createTicketForWatchOver;
  const createTicketForEscalationOrigin = createTicketForEscalation;
  const createTicketForWhenNotFoundNewVulnerabilityOrigin = createTicketForWhenNotFoundNewVulnerability;
  const postMessageOrigin = postMessage;

  const getMockHeadsUps = () => [
    { 'title': 'title1', 'link': 'link1', 'date': new Date(0) },
    { 'title': 'title2', 'link': 'link2', 'date': new Date(1000) },
    { 'title': 'title3', 'link': 'link3', 'date': new Date(2000) },
  ];

  const getMockVulnerabilities = () => [
    { 'title': 'title4', 'link': 'link4', 'date': new Date(3000) },
    { 'title': 'title5', 'link': 'link5', 'date': new Date(4000) },
    { 'title': 'title6', 'link': 'link6', 'date': new Date(5000) },
  ];

  exports({
    'JpcertWatcher': {
      'watch': {
        'when not create tickets in redmine': () => {
          // override to mock
          redmine['isCreateTicket'] = false;
          JpcertWatcher.getJpcertNewHeadsUp = getMockHeadsUps;
          JpcertWatcher.getJpcertNewVulnerabilities = getMockVulnerabilities;

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
          const createTicketForEscalationHistory = [];
          createTicketForEscalation = (siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink) => {
            createTicketForEscalationHistory.push({
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

          JpcertWatcher.watch();

          assertThat(createTicketForWatchOverHistory.length).is(0);
          assertThat(createTicketForEscalationHistory.length).is(0);
          assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(0);
          assertThat(postMessageHistory.length).is(2);

          // revert overridden
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          JpcertWatcher.getJpcertNewHeadsUp = getJpcertNewHeadsUpOrigin;
          JpcertWatcher.getJpcertNewVulnerabilities = getJpcertNewVulnerabilitiesOrigin;
          getTicketId = getTicketIdOrigin;
          createTicketForWatchOver = createTicketForWatchOverOrigin;
          createTicketForEscalation = createTicketForEscalationOrigin;
          createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
          postMessage = postMessageOrigin;
        },
        'when create tickets in redmine': {
          'when if created ticket': () => {
            // override to mock
            redmine['isCreateTicket'] = true;
            config['jpcertWatchOvers'] = '1,4,5';
            JpcertWatcher.getJpcertNewHeadsUp = getMockHeadsUps;
            JpcertWatcher.getJpcertNewVulnerabilities = getMockVulnerabilities;

            getTicketId = link => /1|2|4/.test(link) ? parseInt(link.replace('link', '')) : null;

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
            const createTicketForEscalationHistory = [];
            createTicketForEscalation = (siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink) => {
              createTicketForEscalationHistory.push({
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

            JpcertWatcher.watch();

            const expectHeadsUps = 'JPCERT：注意喚起情報\n>>>\n'
              + `更新： <link1|title1>\n1970/01/01 09:00:00\n<${redmine.url}/issues/1|Redmine>\n\n`
              + `更新： <link2|title2>\n1970/01/01 09:00:01\n<${redmine.url}/issues/2|Redmine>\n\n`
              + `新規： <link3|title3>\n1970/01/01 09:00:02\n<${redmine.url}/issues/3|Redmine>`;
            const expectVulnerabilities = 'JPCERT：脆弱性情報\n>>>\n'
              + `更新： <link4|title4>\n1970/01/01 09:00:03\n<${redmine.url}/issues/4|Redmine>\n\n`
              + `新規： <link5|title5>\n1970/01/01 09:00:04\n<${redmine.url}/issues/5|Redmine>\n\n`
              + `新規： <link6|title6>\n1970/01/01 09:00:05\n<${redmine.url}/issues/6|Redmine>`;

            assertThat(createTicketForWatchOverHistory.length).is(1);
            assertThat(createTicketForEscalationHistory.length).is(2);
            assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(0);
            assertThat(postMessageHistory.length).is(2);
            assertThat(postMessageHistory[0]).is(expectHeadsUps);
            assertThat(postMessageHistory[1]).is(expectVulnerabilities);

            // revert overridden
            redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
            config['jpcertWatchOvers'] = configJpcertWatchOversOrigin;
            JpcertWatcher.getJpcertNewHeadsUp = getJpcertNewHeadsUpOrigin;
            JpcertWatcher.getJpcertNewVulnerabilities = getJpcertNewVulnerabilitiesOrigin;
            getTicketId = getTicketIdOrigin;
            createTicketForWatchOver = createTicketForWatchOverOrigin;
            createTicketForEscalation = createTicketForEscalationOrigin;
            createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
            postMessage = postMessageOrigin;
          },
          'when if not created ticket': () => {
            // override to mock
            redmine['isCreateTicket'] = true;
            JpcertWatcher.getJpcertNewHeadsUp = getMockHeadsUps;
            JpcertWatcher.getJpcertNewVulnerabilities = getMockVulnerabilities;

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
            const createTicketForEscalationHistory = [];
            createTicketForEscalation = (siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink) => {
              createTicketForEscalationHistory.push({
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

            JpcertWatcher.watch();

            assertThat(createTicketForWatchOverHistory.length).is(0);
            assertThat(createTicketForEscalationHistory.length).is(0);
            assertThat(createTicketForWhenNotFoundNewVulnerabilityHistory.length).is(1);
            assertThat(postMessageHistory.length).is(2);

            // revert overridden
            redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
            JpcertWatcher.getJpcertNewHeadsUp = getJpcertNewHeadsUpOrigin;
            JpcertWatcher.getJpcertNewVulnerabilities = getJpcertNewVulnerabilitiesOrigin;
            getTicketId = getTicketIdOrigin;
            createTicketForWatchOver = createTicketForWatchOverOrigin;
            createTicketForEscalation = createTicketForEscalationOrigin;
            createTicketForWhenNotFoundNewVulnerability = createTicketForWhenNotFoundNewVulnerabilityOrigin;
            postMessage = postMessageOrigin;
          },
        },
        'when information is empty': () => {
          // override to mock
          JpcertWatcher.getJpcertNewHeadsUp = _ => [];
          JpcertWatcher.getJpcertNewVulnerabilities = _ => [];

          redmine['isCreateTicket'] = false;
          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          JpcertWatcher.watch();

          assertThat(postMessageHistory.length).is(0);

          // revert overridden
          JpcertWatcher.getJpcertNewHeadsUp = getJpcertNewHeadsUpOrigin;
          JpcertWatcher.getJpcertNewVulnerabilities = getJpcertNewVulnerabilitiesOrigin;
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          postMessage = postMessageOrigin;
        },
        'when information is exists': () => {
          // override to mock
          JpcertWatcher.getJpcertNewHeadsUp = getMockHeadsUps;
          JpcertWatcher.getJpcertNewVulnerabilities = getMockVulnerabilities;

          redmine['isCreateTicket'] = false;
          const postMessageHistory = [];
          postMessage = message => {
            postMessageHistory.push(message);
          };

          JpcertWatcher.watch();

          const expectHeadsUps = 'JPCERT：注意喚起情報\n>>>\n'
            + '新規： <link1|title1>\n1970/01/01 09:00:00\n\n'
            + '新規： <link2|title2>\n1970/01/01 09:00:01\n\n'
            + '新規： <link3|title3>\n1970/01/01 09:00:02';
          const expectVulnerabilities = 'JPCERT：脆弱性情報\n>>>\n'
            + '新規： <link4|title4>\n1970/01/01 09:00:03\n\n'
            + '新規： <link5|title5>\n1970/01/01 09:00:04\n\n'
            + '新規： <link6|title6>\n1970/01/01 09:00:05';

          assertThat(postMessageHistory.length).is(2);
          assertThat(postMessageHistory[0]).is(expectHeadsUps);
          assertThat(postMessageHistory[1]).is(expectVulnerabilities);

          // revert overridden
          JpcertWatcher.getJpcertNewHeadsUp = getJpcertNewHeadsUpOrigin;
          JpcertWatcher.getJpcertNewVulnerabilities = getJpcertNewVulnerabilitiesOrigin;
          redmine['isCreateTicket'] = redmineIsCreateTicketOrigin;
          postMessage = postMessageOrigin;
        },
      },
      'getJpcertNewHeadsUp': () => {
        // override to mock
        const fetchOrigin = UrlFetchApp.fetch;
        const fetchResult = {};
        fetchResult.getContentText = () => {
          return `
            <?xml version="1.0" encoding="UTF-8" ?>

            <rdf:RDF
              xmlns="http://purl.org/rss/1.0/"
              xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
              xmlns:dc="http://purl.org/dc/elements/1.1/"
              xmlns:dcterms="http://purl.org/dc/terms/"
              xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
              xmlns:content="http://purl.org/rss/1.0/modules/content/"
              xml:lang="ja">

              <item rdf:about="https://www.jpcert.or.jp/at/target-new.html">
                <title>注意喚起: 取得対象1  (公開)</title>
                <link>https://www.jpcert.or.jp/at/target-new.html</link>
                <dc:identifier>target-new</dc:identifier>
                <dc:date>1970-01-01T09:01+09:00</dc:date>
              </item>

              <item rdf:about="https://www.jpcert.or.jp/at/target-update.html">
                <title>注意喚起: 取得対象2  (更新)</title>
                <link>https://www.jpcert.or.jp/at/target-update.html</link>
                <dc:identifier>target-update</dc:identifier>
                <dc:date>1970-01-01T09:01+09:00</dc:date>
              </item>

              <item rdf:about="https://www.jpcert.or.jp/wr/other-heads-up.html">
                <title>Weekly Report: 注意喚起外情報</title>
                <description>注意喚起外の情報</description>
                <content:encoded>
                  <![CDATA[注意喚起外情報<a href="https://www.jpcert.or.jp/wr/other-heads-up.html">続きを読む</a>]]>
                </content:encoded>
                <link>https://www.jpcert.or.jp/wr/other-heads-up.html</link>
                <dc:identifier>other-heads-up</dc:identifier>
                <dc:date>1970-01-01T09:01+09:00</dc:date>
              </item>

              <item rdf:about="https://www.jpcert.or.jp/at/watched.html">
                <title>注意喚起: 確認済み情報  (公開)</title>
                <link>https://www.jpcert.or.jp/at/watched.html</link>
                <dc:identifier>watched</dc:identifier>
                <dc:date>1970-01-01T09:00+09:00</dc:date>
              </item>
            </rdf:RDF>
          `.trim();
        };
        UrlFetchApp.fetch = _url => fetchResult;

        const result = JpcertWatcher.getJpcertNewHeadsUp(new Date(0));
        const resultNewHeadsUp = JSON.stringify(result[0]);
        const expectNewHeadsUp = JSON.stringify({
          'title': '取得対象1',
          'link': 'https://www.jpcert.or.jp/at/target-new.html',
          'date': new Date('Thu, 01 Jan 1970 09:01:00 +0900'),
        });
        const resultUpdateHeadsUp = JSON.stringify(result[1]);
        const expectUpdateHeadsUp = JSON.stringify({
          'title': '取得対象2',
          'link': 'https://www.jpcert.or.jp/at/target-update.html',
          'date': new Date('Thu, 01 Jan 1970 09:01:00 +0900'),
        });

        assertThat(result.length).is(2);
        assertThat(resultNewHeadsUp).is(expectNewHeadsUp);
        assertThat(resultUpdateHeadsUp).is(expectUpdateHeadsUp);

        // revert overridden
        UrlFetchApp.fetch = fetchOrigin;
      },
      'getJpcertNewVulnerabilities': () => {
        // override to mock
        const fetchOrigin = UrlFetchApp.fetch;
        const fetchResult = {};
        fetchResult.getContentText = () => {
          return `
            <?xml version="1.0" encoding="UTF-8"?>
            <rdf:RDF
              xmlns="http://purl.org/rss/1.0/"
              xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
              xmlns:dc="http://purl.org/dc/elements/1.1/"
              xmlns:dcterms="http://purl.org/dc/terms/"
              xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
              xml:lang="ja">

              <item rdf:about="https://jvn.jp/jp/target/">
                <title>取得対象</title>
                <link>https://jvn.jp/jp/target/</link>
                <description>取得対象の情報</description>
                <dc:publisher>JVN</dc:publisher>
                <dc:creator>jvn@jvn.jp</dc:creator>
                <dc:identifier>target</dc:identifier>
                <dc:relation>https://jvn.jp/jp/target/</dc:relation>
                <dc:date>1970-01-01T09:00:01+09:00</dc:date>
                <dcterms:issued>1970-01-01T09:00:01+09:00</dcterms:issued>
                <dcterms:modified>1970-01-01T09:00:01+09:00</dcterms:modified>
              </item>

              <item rdf:about="https://jvn.jp/vu/watched/">
                <title>取得済み情報</title>
                <link>https://jvn.jp/vu/watched/</link>
                <description>取得済みの情報</description>
                <dc:publisher>JVN</dc:publisher>
                <dc:creator>jvn@jvn.jp</dc:creator>
                <dc:identifier>watched</dc:identifier>
                <dc:relation>https://jvn.jp/vu/watched/</dc:relation>
                <dc:date>1970-01-01T09:00:00+09:00</dc:date>
                <dcterms:issued>1970-01-01T09:00:00+09:00</dcterms:issued>
                <dcterms:modified>1970-01-01T09:00:00+09:00</dcterms:modified>
              </item>
            </rdf:RDF>
          `.trim();
        };
        UrlFetchApp.fetch = _url => fetchResult;

        const result = JpcertWatcher.getJpcertNewVulnerabilities(new Date(0));
        const resultVulnerability = JSON.stringify(result[0]);
        const expect = JSON.stringify({
          'title': '取得対象',
          'link': 'https://jvn.jp/jp/target/',
          'date': new Date('Thu, 01 Jan 1970 09:00:01 +0900'),
        });

        assertThat(result.length).is(1);
        assertThat(resultVulnerability).is(expect);

        // revert overridden
        UrlFetchApp.fetch = fetchOrigin;
      },
    },
  });
};
