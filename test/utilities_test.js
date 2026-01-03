const utilitiesTest = () => {
  const currentYear = new Date().getFullYear();
  const dayOfWeeks = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const isSaturdayOrSunday = date => {
    const weekInt = date.getDay();
    const dayOfWeek = dayOfWeeks[weekInt];
    return ['saturday', 'sunday'].includes(dayOfWeek);
  };

  exports({
    'utilities': {
      'isHoliday': {
        'saturday': () => {
          const dayDiff = dayOfWeeks.indexOf('saturday') - new Date(`${currentYear}/06/01`).getDay();
          const targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
          assertThat(isHoliday(new Date(`${currentYear}/06/${targetDay}`))).isTrue();
        },
        'sunday': () => {
          const dayDiff = dayOfWeeks.indexOf('sunday') - new Date(`${currentYear}/06/01`).getDay();
          const targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
          assertThat(isHoliday(new Date(`${currentYear}/06/${targetDay}`))).isTrue();
        },
        'public holiday': {
          'new years day': () => {
            assertThat(isHoliday(new Date(`${currentYear}/01/01`))).isTrue();
          },
          'adult day': () => {
            // 2nd monday of january
            const dayDiff = dayOfWeeks.indexOf('monday') - new Date(`${currentYear}/01/01`).getDay();
            const targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
            assertThat(isHoliday(new Date(`${currentYear}/01/${targetDay}`))).isTrue();
          },
          'foundation day': () => {
            assertThat(isHoliday(new Date(`${currentYear}/02/11`))).isTrue();
          },
          'emperors birthday': () => {
            assertThat(isHoliday(new Date(`${currentYear}/02/23`))).isTrue();
          },
          'vernal equinox day': () => {
            const targetDay = (
              Math.floor(20.8431 + 0.242194 * (currentYear - 1980))
              - Math.floor((currentYear - 1980) / 4)
            );
            assertThat(isHoliday(new Date(`${currentYear}/03/${targetDay}`))).isTrue();
          },
          'showa day': () => {
            assertThat(isHoliday(new Date(`${currentYear}/04/29`))).isTrue();
          },
          'constitution day': () => {
            assertThat(isHoliday(new Date(`${currentYear}/05/03`))).isTrue();
          },
          'green day': () => {
            assertThat(isHoliday(new Date(`${currentYear}/05/04`))).isTrue();
          },
          'childrens day': () => {
            assertThat(isHoliday(new Date(`${currentYear}/05/05`))).isTrue();
          },
          'sea day': () => {
            if (currentYear == 2020) {
              // for tokyo olympics special measures law
              assertThat(isHoliday(new Date('2020/07/23'))).isTrue();
            } else {
              // 3rd monday of july
              const dayDiff = dayOfWeeks.indexOf('monday') - new Date(`${currentYear}/07/01`).getDay();
              const targetDay = 1 + dayDiff + (dayDiff < 0 ? 21 : 14);
              assertThat(isHoliday(new Date(`${currentYear}/07/${targetDay}`))).isTrue();
            }
          },
          'mountain day': () => {
            if (currentYear == 2020) {
              // for tokyo olympics special measures law
              assertThat(isHoliday(new Date('2020/08/10'))).isTrue();
            } else {
              assertThat(isHoliday(new Date(`${currentYear}/08/11`))).isTrue();
            }
          },
          'respect for the aged day': () => {
            // 3rd monday of september
            const dayDiff = dayOfWeeks.indexOf('monday') - new Date(`${currentYear}/09/01`).getDay();
            const targetDay = 1 + dayDiff + (dayDiff < 0 ? 21 : 14);
            assertThat(isHoliday(new Date(`${currentYear}/09/${targetDay}`))).isTrue();
          },
          'equinox day': () => {
            const targetDay = (
              Math.floor(23.2488 + 0.242194 * (currentYear - 1980))
              - Math.floor((currentYear - 1980) / 4)
            );
            assertThat(isHoliday(new Date(`${currentYear}/09/${targetDay}`))).isTrue();
          },
          'physical education day': () => {
            if (currentYear == 2020) {
              // for tokyo olympics special measures law
              assertThat(isHoliday(new Date('2020/07/24'))).isTrue();
            } else {
              // 2nd monday of october
              const dayDiff = dayOfWeeks.indexOf('monday') - new Date(`${currentYear}/10/01`).getDay();
              const targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
              assertThat(isHoliday(new Date(`${currentYear}/10/${targetDay}`))).isTrue();
            }
          },
          'culture day': () => {
            assertThat(isHoliday(new Date(`${currentYear}/11/03`))).isTrue();
          },
          'labor thanksgiving day': () => {
            assertThat(isHoliday(new Date(`${currentYear}/11/23`))).isTrue();
          }
        },
        'traditional religious holiday': {
          'bank holidays': () => {
            const dates = [new Date(`${currentYear}/01/02`), new Date(`${currentYear}/01/03`)];
            dates.forEach(date => {
              assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
            });
          },
          'setsubun': () => {
            const day = parseInt(4.8693 + 0.242713 * (currentYear - 1901) - parseInt((currentYear - 1901) / 4)) - 1;
            const date = new Date(`${currentYear}/02/0${day}`);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          'hinamatsuri': () => {
            const date = new Date(`${currentYear}/03/03`);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          "mother's day": () => {
            // 2nd sunday of may
            const dayDiff = dayOfWeeks.indexOf('sunday') - new Date(`${currentYear}/05/01`).getDay();
            const targetDay = 1 + dayDiff + (dayDiff < 0 ? 14 : 7);
            const date = new Date(`${currentYear}/05/${targetDay}`);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          'tanabata': () => {
            const date = new Date(`${currentYear}/07/07`);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          'shichi-go-san': () => {
            const date = new Date(`${currentYear}/11/15`);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          'christmas': () => {
            const date = new Date(`${currentYear}/12/25`);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
          "new year's eve": () => {
            const date = new Date(`${currentYear}/12/31`);
            assertThat(isHoliday(date)).is(isSaturdayOrSunday(date));
          },
        }
      },
      'postMessage': () => {
        // override UrlFetchApp.fetch
        UrlFetchApp = {};
        UrlFetchApp.fetch = (url, params) => {
          return {
            'url': url,
            'params': params
          };
        };

        const testMessage = 'message';

        const result = JSON.stringify(postMessage(testMessage));
        const expect = JSON.stringify({
          'url': slackIncomingUrl,
          'params': {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify({ 'text': testMessage })
          }
        });

        assertThat(result).is(expect);
      }
    }
  });
};
