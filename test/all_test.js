function allTest() {
  const testFunctions = shuffle([
    redmineTest,
    utilitiesTest
  ]);

  testFunctions.forEach(function(testFunction) {
    testFunction();
  });
}

function shuffle(array){
  const result = [];
  for(i = array.length; i > 0; i--){
    const index = Math.floor(Math.random() * i);
    const val = array.splice(index, 1)[0];
    result.push(val);
  }

  return result;
}
