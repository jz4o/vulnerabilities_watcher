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
        // override Object#getContentText to mock
        const getContentTextOrigin = Object.prototype.getContentText;
        Object.prototype.getContentText = function() {
          return JSON.stringify({ 'issue': this });
        };

        const subject     = 'testTitle';
        const description = 'testDescription';
        const statusId    = 999;
        const categoryId  = 888;
        const doneRatio   = 100;

        const result = JSON.stringify(createTicket(subject, description, statusId, categoryId, doneRatio));
        const expect = JSON.stringify({
          'url':    (redmine['url'] + '/issues.json'),
          'params': {
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
          }
        });

        assertThat(result).is(expect);

        // revert overridden function
        Object.prototype.getContentText = getContentTextOrigin;
      },
      'getTicketId': {
        'when ticket exist': () => {
          // override function to mock
          const getContentTextOrigin = Object.prototype.getContentText;
          Object.prototype.getContentText = () => {
            return JSON.stringify({
              'total_count': 1,
              'results': [
                { 'id': 999 }
              ]
            });
          };

          const vulnerabilityLink = 'testLink';

          const result = getTicketId(vulnerabilityLink);
          const expect = 999;

          assertThat(result).is(expect);

          // revert overridden function
          Object.prototype.getContentText = getContentTextOrigin;
        },
        'when ticket not exist': () => {
          // override function to mock
          const getContentTextOrigin = Object.prototype.getContentText;
          Object.prototype.getContentText = () => {
            return JSON.stringify({
              'total_count': 0,
              'results':     []
            });
          };

          const vulnerabilityLink = 'testLink';

          const result = getTicketId(vulnerabilityLink);
          const expect = null;

          assertThat(result).is(expect);

          // revert overridden function
          Object.prototype.getContentText = getContentTextOrigin;
        }
      }
    }
  });
};
