function redmineTest() {
  var createTicketOrigin = createTicket;
  var createTicketMock   = function(subject, description, statusId, categoryId, doneRatio) {
    return {
      'subject':     subject,
      'description': description,
      'statusId':    statusId,
      'categoryId':  categoryId,
      'doneRatio':   doneRatio
    };
  }

  // override to mock
  UrlFetchApp = {};
  UrlFetchApp.fetch = function(url, params) {
    return {
      'url': url,
      'params': params
    };
  };

  exports({
    'createTicketForWhenNotFoundNewVulnerability': function() {
      // override function to mock
      createTicket = createTicketMock;

      var siteName  = 'testSite';
      var watchedAt = new Date();

      var result = JSON.stringify(createTicketForWhenNotFoundNewVulnerability(siteName, watchedAt));
      var expect = JSON.stringify({
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
    'createTicketForWatchOver': function() {
      // override function to mock
      createTicket = createTicketMock;

      var siteName           = 'testSite';
      var watchedAt          = new Date();
      var vulnerabilityTitle = 'testTitle';
      var vulnerabilityLink  = 'testLink'

      var result = JSON.stringify(createTicketForWatchOver(siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink));
      var expect = JSON.stringify({
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
    'createTicketForEscalation': function() {
      // override function to mock
      createTicket = createTicketMock;

      var siteName           = 'testSite';
      var watchedAt          = new Date();
      var vulnerabilityTitle = 'testTitle';
      var vulnerabilityLink  = 'testLink'

      var result = JSON.stringify(createTicketForEscalation(siteName, watchedAt, vulnerabilityTitle, vulnerabilityLink));
      var expect = JSON.stringify({
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
      'when vulnerability title is specified': function() {
        var sitename           = 'testSite';
        var watchedAt          = new Date(0);
        var vulnerabilityTitle = 'testTitle';

        var result = buildTicketSubject(sitename, watchedAt, vulnerabilityTitle)
        var expect = 'testSite 1970-01-01 09:00 [testTitle]';

        assertThat(result).is(expect);
      },
      'when vulnerability title is not specified': function() {
        var sitename           = 'testSite';
        var watchedAt          = new Date(0);
        var vulnerabilityTitle = null;

        var result = buildTicketSubject(sitename, watchedAt, vulnerabilityTitle)
        var expect = 'testSite 1970-01-01 09:00';

        assertThat(result).is(expect);
      }
    },
    'createTicket': function() {
      // override Object#getContentText to mock
      var getContentTextOrigin = Object.prototype.getContentText;
      Object.prototype.getContentText = function() {
        return JSON.stringify({ 'issue': this });
      };

      var subject     = 'testTitle';
      var description = 'testDescription';
      var statusId    = 999;
      var categoryId  = 888;
      var doneRatio   = 100;

      var result = JSON.stringify(createTicket(subject, description, statusId, categoryId, doneRatio));
      var expect = JSON.stringify({
        'url':    (redmine['url'] + '/issues.json'),
        'params': {
          'method'      : 'post',
          'contentType' : 'application/json',
          "headers"     : {
            'X-Redmine-API-Key': redmine['apiKey']
          },
          'payload'     : JSON.stringify({
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
          })
        }
      });

      assertThat(result).is(expect);

      // revert overridden function
      Object.prototype.getContentText = getContentTextOrigin;
    },
    'getTicketId': {
      'when ticket exist': function() {
        // override function to mock
        var getContentTextOrigin = Object.prototype.getContentText;
        Object.prototype.getContentText = function() {
          return JSON.stringify({
            'total_count': 1,
            'results': [
              { 'id': 999 }
            ]
          });
        }

        var vulnerabilityLink = 'testLink';

        var result = getTicketId(vulnerabilityLink);
        var expect = 999;

        assertThat(result).is(expect);

        // revert overridden function
        Object.prototype.getContentText = getContentTextOrigin;
      },
      'when ticket not exist': function() {
        // override function to mock
        var getContentTextOrigin = Object.prototype.getContentText;
        Object.prototype.getContentText = function() {
          return JSON.stringify({
            'total_count': 0,
            'results':     []
          });
        }

        var vulnerabilityLink = 'testLink';

        var result = getTicketId(vulnerabilityLink);
        var expect = null;

        assertThat(result).is(expect);

        // revert overridden function
        Object.prototype.getContentText = getContentTextOrigin;
      }
    }
  });
}
