const codeTest = () => {
  const setupSheetsOrigin = setupSheets;
  const setupConfigOrigin = setupConfig;
  const getConfigOrigin = getConfig;
  const updateConfigSheetOrigin = updateConfigSheet;
  const getWatcherClassesOrigin = getWatcherClasses;
  const isHolidayOrigin = isHoliday;
  const postMessageOrigin = postMessage;

  exports({
    'code': {
      'setup': () => {
        // override to mock
        let setupSheetsCallCount = 0;
        setupSheets = () => setupSheetsCallCount++;
        let setupConfigCallCount = 0;
        setupConfig = () => setupConfigCallCount++;

        setup();

        assertThat(setupSheetsCallCount).is(1);
        assertThat(setupConfigCallCount).is(1);

        // revert overridden
        setupSheets = setupSheetsOrigin;
        setupConfig = setupConfigOrigin;
      },
      'setupSheets': () => {
        setupSheets();

        assertThat(configSheet).isNotUndefined();
      },
      'setupConfig': {
        'when config sheet is empty': () => {
          // override to mock
          const configOrigin = config;
          config = {};
          getConfig = () => ({});

          setupConfig();

          assertThat(Object.keys(config).length).is(getWatcherClasses().length);
          Object.entries(config).forEach(([key, value]) => {
            assertThat(key).matches(k => k.toString().endsWith('LatestWatchedAt'));
            assertThat(value).matches(v => v instanceof Date && v.getTime() === 0);
          });

          // revert overridden
          getConfig = getConfigOrigin;
          config = configOrigin;
        },
        'when watcher classes is empty': () => {
          // override to mock
          getWatcherClasses = () => [];
          getConfig = () => ({ 'dummyKey': 'dummyValue' });

          setupConfig();

          assertThat(Object.keys(config).length).is(1);
          assertThat(config['dummyKey']).is('dummyValue');

          // revert overridden
          getWatcherClasses = getWatcherClassesOrigin;
          getConfig = getConfigOrigin;
        },
      },
      'getConfig': {
        'when config sheet is not setup': () => {
          // override to mock
          const configSheetOrigin = configSheet;
          configSheet = undefined;

          try {
            getConfig();
            throw('message');
          } catch(e) {
            assertThat(e).is('configSheet is not setup.');
          } finally {
            // revert overridden
            configSheet = configSheetOrigin;
          }
        },
        'when config sheet is empty': () => {
          // override to mock
          const configSheetOrigin = configSheet;
          configSheet = {};
          configSheet.getDataRange = () => configSheet;
          configSheet.getValues = () => [];

          const result = getConfig();
          assertThat(Object.keys(result).length).is(0);

          // revert overridden
          configSheet = configSheetOrigin;
        },
        'when config sheet is not empty': {
          'when key column is missing in title row': () => {
            // override to mock
            const configSheetOrigin = configSheet;
            configSheet = {};
            configSheet.getDataRange = () => configSheet;
            configSheet.getValues = () => [
              ['', 'value'],
              ['dummyKey1', 'dummyValue1'],
              ['dummyKey2', 'dummyValue2'],
              ['dummyKey3', 'dummyValue3'],
            ];

            try {
              getConfig();
              throw('message');
            } catch(e) {
              assertThat(e).is('configSheet first row is not title row.');
            } finally {
              // revert overridden
              configSheet = configSheetOrigin;
            }
          },
          'when value column is missing in title row': () => {
            // override to mock
            const configSheetOrigin = configSheet;
            configSheet = {};
            configSheet.getDataRange = () => configSheet;
            configSheet.getValues = () => [
              ['key', ''],
              ['dummyKey1', 'dummyValue1'],
              ['dummyKey2', 'dummyValue2'],
              ['dummyKey3', 'dummyValue3'],
            ];

            try {
              getConfig();
              throw('message');
            } catch(e) {
              assertThat(e).is('configSheet first row is not title row.');
            } finally {
              // revert overridden
              configSheet = configSheetOrigin;
            }
          },
          'when key column and value column is exists in title row': () => {
            // override to mock
            const configSheetOrigin = configSheet;
            configSheet = {};
            configSheet.getDataRange = () => configSheet;
            configSheet.getValues = () => [
              ['key', 'value'],
              ['dummyKey1', 'dummyValue1'],
              ['dummyKey2', 'dummyValue2'],
              ['dummyKey3', 'dummyValue3'],
            ];

            const result = getConfig();
            assertThat(Object.keys(result).length).is(3);
            assertThat(result['dummyKey1']).is('dummyValue1');
            assertThat(result['dummyKey2']).is('dummyValue2');
            assertThat(result['dummyKey3']).is('dummyValue3');

            // revert overridden
            configSheet = configSheetOrigin;
          },
        },
      },
      'updateConfigSheet': () => {
        // override to mock
        const configSheetOrigin = configSheet;
        const configOrigin = config;
        let clearCallCount = 0;
        const getRangeHistory = [];
        const setValuesHistory = [];
        configSheet = {};
        configSheet.clear = () => clearCallCount++;
        configSheet.getRange = (row, column, numRows, numColumns) => {
          getRangeHistory.push([row, column, numRows, numColumns]);
          return configSheet;
        };
        configSheet.setValues = data => {
          setValuesHistory.push(data);
        };

        config = {
          'dummyKey1': 'dummyValue1',
          'dummyKey2': 'dummyValue2',
          'dummyKey3': 'dummyValue3',
        };

        updateConfigSheet();

        assertThat(clearCallCount).is(1);
        assertThat(getRangeHistory.length).is(1);
        assertThat(getRangeHistory[0].join(',')).is(`1,1,${Object.keys(config).length + 1},2`);
        assertThat(setValuesHistory.length).is(1);
        assertThat(setValuesHistory[0].length).is(Object.keys(config).length + 1);

        // revert overridden
        configSheet = configSheetOrigin;
        config = configOrigin;
      },
      'getWatcherClasses': () => {
        const expectResult = [EsetWatcher, Jc3Watcher, JpcertWatcher, WindowsForestWatcher];

        getWatcherClasses().forEach((watcher, index) => {
          assertThat(watcher).is(expectResult[index]);
        });
      },
      'watch': () => {
        // override to mock
        isHoliday = () => false;
        const watchHistory = [];
        class MockWatcher {
          static watch() {
            watchHistory.push('MockWatcher');
          }
        }
        class ErrorWatcher {
          static watch() {
            watchHistory.push('ErrorWatcher');
            throw 'error';
          }
        }
        getWatcherClasses = () => [MockWatcher, ErrorWatcher];
        const postMessageHistory = [];
        postMessage = message => postMessageHistory.push(message);
        let updateConfigSheetCallCount = 0;
        updateConfigSheet = () => updateConfigSheetCallCount++;

        watch();

        assertThat(watchHistory.length).is(2);
        assertThat(postMessageHistory.length).is(1);
        assertThat(updateConfigSheetCallCount).is(1);

        // revert overridden
        isHoliday = isHolidayOrigin;
        getWatcherClasses = getWatcherClassesOrigin;
        postMessage = postMessageOrigin;
        updateConfigSheet = updateConfigSheetOrigin;
      },
    },
  });
};
