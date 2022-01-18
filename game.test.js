/* global describe test */
import Game from './game';

describe('test Game class', () => {
  test('should do something', () => {
    const G = new Game(['Toby', 'Adam', 'Ben', 'Brad']);
    G.distributeProps();
    G.handleRole();
  });
});
