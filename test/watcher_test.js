const watcherTest = () => {
  exports({
    'watcher': {
      'watch': () => {
        try {
          Watcher.watch();
          throw 'message';
        } catch(e) {
          assertThat(e).is('Watcher.watch is not defined.');
        }
      },
      'slackMessagefy': {
        'when items is empty': () => {
          const result = Watcher.slackMessagefy('title', []);
          const expect = 'title\n>>>\n';

          assertThat(result).is(expect);
        },
        'when items is exists': () => {
          const items = [
            {
              'isUpdate': true,
              'link': 'link1',
              'title': 'item1',
              'date': new Date(0),
              'ticketId': 1,
            },
            {
              'isUpdate': false,
              'link': 'link2',
              'title': 'item2',
              'date': new Date(1000),
              'ticketId': null,
            },
          ];
          const result = Watcher.slackMessagefy('title', items);
          const expect = 'title\n>>>\n'
            + `更新： <link1|item1>\n1970/01/01 09:00:00\n<${redmine.url}/issues/1|Redmine>\n\n`
            + '新規： <link2|item2>\n1970/01/01 09:00:01';

          assertThat(result).is(expect);
        },
      },
    },
  });
};
