const allTest = () => {
  const testFunctions = shuffle([
    codeTest,
    redmineTest,
    utilitiesTest,
    watcherTest,
    esetWatcherTest,
    jc3WatcherTest,
    jpcertWatcherTest,
    windowsForestWatcherTest,
  ]);

  testFunctions.forEach(testFunction => {
    testFunction();
  });
};

const shuffle = array => {
  const result = [];
  for(i = array.length; i > 0; i--){
    const index = Math.floor(Math.random() * i);
    const val = array.splice(index, 1)[0];
    result.push(val);
  }

  return result;
};
