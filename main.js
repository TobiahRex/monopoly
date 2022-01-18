const Game = require('./game');

(function analyzeMonopoly() {
  const G = new Game(['Toby', 'Adam', 'Ben', 'Brad']);
  G.distributeProps();
  console.log(JSON.stringify(G.playGame(), null, 2));
}());
