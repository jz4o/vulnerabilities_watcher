function utilitiesTest() {
  var currentYear = new Date().getFullYear();
  var dateInt = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  var isSaturdayOrSunday = function(date) {
    var weekInt = date.getDay();
    var weekName = dateInt[weekInt];
    return ['saturday', 'sunday'].includes(weekName);
  };

  exports({
    'utilities': {
      'isHoliday': {
        'saturday': function() {
          var dayDiff = dateInt.indexOf('saturday') - new Date(currentYear + '/06/01').getDay();
          var targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
          assertThat(isHoliday(new Date(currentYear + '/06/' + targetDay))).isTrue();
        },
        'sunday': function() {
          var dayDiff = dateInt.indexOf('sunday') - new Date(currentYear + '/06/01').getDay();
          var targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
          assertThat(isHoliday(new Date(currentYear + '/06/' + targetDay))).isTrue();
        },
        'public holiday': {
          'new years day': function() {
            assertThat(isHoliday(new Date(currentYear + '/01/01'))).isTrue();
          },
          'adult day': function() {
            // 2nd monday of january
            var dayDiff = dateInt.indexOf('monday') - new Date(currentYear + '/01/01').getDay();
            var targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
            assertThat(isHoliday(new Date(currentYear + '/01/' + targetDay))).isTrue();
          },
          'foundation day': function() {
            assertThat(isHoliday(new Date(currentYear + '/02/11'))).isTrue();
          },
          'emperors birthday': function() {
            assertThat(isHoliday(new Date(currentYear + '/02/23'))).isTrue();
          },
          'vernal equinox day': function() {
            var targetDay = Math.floor(20.8431 + 0.242194 * (currentYear - 1980)) - Math.floor((currentYear - 1980) / 4);
            assertThat(isHoliday(new Date(currentYear + '/03/' + targetDay))).isTrue();
          },
          'showa day': function() {
            assertThat(isHoliday(new Date(currentYear + '/04/29'))).isTrue();
          },
          'constitution day': function() {
            assertThat(isHoliday(new Date(currentYear + '/05/03'))).isTrue();
          },
          'green day': function() {
            assertThat(isHoliday(new Date(currentYear + '/05/04'))).isTrue();
          },
          'childrens day': function() {
            assertThat(isHoliday(new Date(currentYear + '/05/05'))).isTrue();
          },
          'sea day': function() {
            if (currentYear == 2020) {
              // for tokyo olympics special measures law
              assertThat(isHoliday(new Date('2020/07/23'))).isTrue();
            } else {
              // 3rd monday of july
              var dayDiff = dateInt.indexOf('monday') - new Date(currentYear + '/07/01').getDay();
              var targetDay = 1 + dayDiff + (dayDiff < 0 ? 21 : 14);
              assertThat(isHoliday(new Date(currentYear + '/07/' + targetDay))).isTrue();
            }
          },
          'mountain day': function() {
            if (currentYear == 2020) {
              // for tokyo olympics special measures law
              assertThat(isHoliday(new Date('2020/08/10'))).isTrue();
            } else {
              assertThat(isHoliday(new Date(currentYear + '/08/11'))).isTrue();
            }
          },
          'respect for the aged day': function() {
            // 3rd monday of september
            var dayDiff = dateInt.indexOf('monday') - new Date(currentYear + '/09/01').getDay();
            var targetDay = 1 + dayDiff + (dayDiff < 0 ? 21 : 14);
            assertThat(isHoliday(new Date(currentYear + '/09/' + targetDay))).isTrue();
          },
          'equinox day': function() {
            var targetDay = Math.floor(23.2488 + 0.242194 * (currentYear - 1980)) - Math.floor((currentYear - 1980) / 4);
            assertThat(isHoliday(new Date(currentYear + '/09/' + targetDay))).isTrue();
          },
          'physical education day': function() {
            if (currentYear == 2020) {
              // for tokyo olympics special measures law
              assertThat(isHoliday(new Date('2020/07/24'))).isTrue();
            } else {
              // 2nd monday of october
              var dayDiff = dateInt.indexOf('monday') - new Date(currentYear + '/10/01').getDay();
              var targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
              assertThat(isHoliday(new Date(currentYear + '/10/' + targetDay))).isTrue();
            }
          },
          'culture day': function() {
            assertThat(isHoliday(new Date(currentYear + '/11/03'))).isTrue();
          },
          'labor thanksgiving day': function() {
            assertThat(isHoliday(new Date(currentYear + '/11/23'))).isTrue();
          }
        },
        'traditional religious holiday': {
          'bank holidays': function() {
            var dates = [new Date(currentYear + '/01/02'), new Date(currentYear + '/01/03')];
            dates.forEach(date => {
              assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
            });
          },
          'setsubun': function() {
            var day = day = parseInt(4.8693 + 0.242713 * (currentYear - 1901) - parseInt((currentYear - 1901) / 4)) - 1;
            var date = new Date(currentYear + '/02/0' + day);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          'hinamatsuri': function() {
            var date = new Date(currentYear + '/03/03');
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          "mother's day": function() {
            // 2nd sunday of may
            var dayDiff = dateInt.indexOf('sunday') - new Date(currentYear + '/05/01').getDay();
            var targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
            var date = new Date(currentYear + '/05/' + targetDay);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          'tanabata': function() {
            var date = new Date(currentYear + '/07/07');
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          'shichi-go-san': function() {
            var date = new Date(currentYear + '/11/15');
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          'christmas': function() {
            var date = new Date(currentYear + '/12/25');
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          "new year's eve": function() {
            var date = new Date(currentYear + '/12/31');
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
        }
      },
      'postMessage': function() {
        // override UrlFetchApp.fetch
        UrlFetchApp = {};
        UrlFetchApp.fetch = function(url, params) {
          return {
            'url': url,
            'params': params
          };
        };

        var testMessage = 'message';

        var result = JSON.stringify(postMessage(testMessage));
        var expect = JSON.stringify({
          'url': slackIncomingUrl,
          'params': {
            'method'     : 'post',
            'contentType': 'application/json',
            'payload'    : JSON.stringify({ 'text': testMessage })
          }
        });

        assertThat(result).is(expect);
      }
    }
  });
}
