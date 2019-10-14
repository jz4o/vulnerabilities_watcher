function allTest() {
  var testFunctions = shuffle([
    redmineTest,
    utilitiesTest
  ]);

  testFunctions.forEach(function(testFunction) {
    testFunction();
  })
}

function shuffle(array){
  var result = [];
  for(i = array.length; i > 0; i--){
    var index = Math.floor(Math.random() * i);
    var val = array.splice(index, 1)[0];
    result.push(val);
  }

  return result;
}
