import stats from 'stats-lite';

import board from './js/board.json';

export default class Game {
  constructor(playerNames) {
    this.playerNames = playerNames;
    this.players = playerNames.reduce((acc, name) => {
      acc[name] = {
        money: 0,
        location: 0,
        status: 'active', // enum: ['active', 'jail', 'lost']
        properties: [],
      };
      return acc;
    }, {});
    [this.activePlayer] = playerNames;
    this.properties = [...board];
    this.apartments = {
      // 1: 3 // NOTE: 1 = property id, 3 = # of apartments
    };
    this.hotels = {};
  }
  /* eslint-disable no-use-before-define */

  handleFindMoneyToPay = handleFindMoneyToPay;

  handleRole = handleRole;

  isOwnedProperty = (targetProp) => ['utility', 'railroad', 'property'].includes(targetProp.type)

  distributeProps = distributeProps;

  moviePiece = movePiece;

  updatePropStats = updatePropStats;

  playGame = playGame;

  payRent = payRent;

  calcPayAmount = calcPayAmount;

  updateActivePlayer = () => {
    this.activePlayer = ((this.activePlayer + 1) >= this.playerNames.length
      ? 0
      : this.activePlayer + 1);
  }

  rollDice = () => {
    const [die1,
      die2] = [
      Math.floor(Math.random() * 6),
      Math.floor(Math.random() * 6),
    ];
    return [
      die1 + die2,
      die1,
      die2,
    ];
  }

  checkForWinner = checkForWinner;

  calculateOpportunityCost = calculateOpportunityCost;

  getPropValueMap = getPropValueMap;
  /* eslint-enable no-use-before-define */
}

/**
 * @function distributeProps
 * Randomly distributes all the properties to as many players defined
 * within the Game.players list.
 * @param
 * @return null
 */
function distributeProps() {
  const propsCopy = this
    .properties
    .filter((p) => this.isOwnedProperty(p));
  let targetPlayer = 0;
  while (propsCopy.length) {
    if (targetPlayer === 4) {
      targetPlayer = 0;
    }
    const cardIx = Math.floor(Math.random() * propsCopy.length);
    this.players[this.playerNames[targetPlayer++]] // eslint-disable-line no-plusplus
      .properties
      .push(propsCopy.splice(cardIx, 1)[0]);
  }
  return 1;
}

/**
 * @function movePiece
 * given a player argument, roll dice, and move the active location of that
 * target piece to the rolled location.
 * @param {string} playerName
 * @return null
 */
function movePiece(diceValue) {
  let loci = this.players[this.activePlayer].location;
  loci += diceValue;
  if (loci > 39) {
    const remaining = loci - 39;
    loci = remaining;
  }
}

/**
 * @function handleRole
 * Roll dice
 * iterate thru board for every value of dice
 * process/update property values
 * move piece
 * update active player
 * @param
 * @return
 */
function handleRole() {
  const [value] = this.rollDice();
  const activePlayer = this.players[this.activePlayer];
  const loci = activePlayer.location;
  const { properties } = this;
  for (let i = 1; i < value; i += 1) {
    const currentProp = properties[loci + i];
    const apIsNotOwner = !activePlayer
      .properties
      .find((p) => p.id === currentProp.id);
    if (apIsNotOwner) {
      this.updatePropStats(currentProp, {
        amount: 0,
        type: 'loss',
      });
    }
    const shouldPayRent = [
      apIsNotOwner,
      (i === value - 1),
      !currentProp.mortgaged,
    ].every(Boolean);
    if (shouldPayRent) {
      this.payRent(currentProp, activePlayer);
    }
  }
  this.movePiece(value);
  this.updateActivePlayer();
}

/**
 * @function updatePropStats
 * Updates the statistical meta data for a property based on monopolistic
 * attrs of the property.
 * @param {object} property
 * @param {object} activePlayer
 */
function updatePropStats(targetProp, { amount, type }) {
  /* eslint-disable no-param-reassign */
  if (!targetProp.loss) targetProp.loss = [];
  if (!targetProp.profit) targetProp.profit = [];
  if (!targetProp.landings) targetProp.landings = 0;
  if (!targetProp.sharpeRatio) targetProp.sharpeRatio = 0;
  if (!targetProp.returnPerEvent) targetProp.returnPerEvent = 0;

  targetProp.landings += 1;
  if (type === 'profit') targetProp.profit.push(amount);
  else if (type === 'loss') targetProp.loss.push(amount);
  const netProfit = (stats.sum(targetProp.profit) - stats.sum(targetProp.loss));
  targetProp.sharpeRatio = (netProfit / stats.stdev(targetProp.loss.concat(targetProp.profit)));
  targetProp.returnPerEvent = netProfit / targetProp.landings;
  /* eslint-enable no-param-reassign */
}

/**
 * @function payRent
 * Updates the statics meta data for a property based on monopolistic attrs of the
 * property. Updates "cash" attr on payer & receivers accounts.
 * @param {object} property
 * @param {object} activePlayer
 */
function payRent(targetProp, activePlayer) {
  const { amount, owner } = this.calcPayAmount(targetProp);
  if (amount && owner) {
    if (activePlayer.cash < amount) {
      this.handleFindMoneyToPay(activePlayer, amount);
    } else {
      this.players[owner].cash += amount;
      this.players[activePlayer].cash -= amount;
      this.updatePropStats(targetProp, { amount, type: 'profit' });
    }
  }
}

/**
 * @function handleFindMoneyToPay
 * Extracts money from players resources to pay the debt
 * @param {object} activePlayer
 * @param {number} debt
 * @return
 */
function handleFindMoneyToPay(activePlayer, debt) {
  /*
    - mortgage any utilties owned
    - mortgage properties with no monopolies.
    - mortgage railroads
    - shave off houses:
      * Sort properties with houses in ascending order.
      * Minimize opportunity cost if N-house's are shaved.
      * Find combinations of cash needed
        * then evaluate the lowest opportunity cost.
      *
    []
  */
  let remainingDebt = debt;
  const utilities = activePlayer
    .properties
    .filter((p) => p.type === 'utility');
  // Step 1: Mortgage utilties
  if (utilities.length) {
    utilities.forEach((utility) => {
      if ((remainingDebt - (utility.cost / 2) > 0)) {
        remainingDebt -= (utility.cost / 2);
        utility.mortgaged = true; // eslint-disable-line no-param-reassign
      }
    });
  }
  const playerPropertyMap = activePlayer
    .properties
    .reduce((acc, next) => {
      if (acc[next.group[0]]) {
        acc[next.group[0]].owned += 1;
        acc[next.group[0]]
          .properties
          .push(next);
      } else {
        acc[next.group[0]] = {
          owned: 1,
          total: next.group[2],
          properties: [next],
        };
      }
      return acc;
    }, {});

  // Step 2: Mortgage non-monopoly properties
  if (remainingDebt > 0) {
    const mortgageValueMap = this.getPropValueMap(activePlayer, 'mortgaged');
    const nonMonopolies = Object
      .values(playerPropertyMap)
      .reduce((acc, data) => (data.total !== data.owned ? acc.concat(data.properties) : acc), []);
    const propsToMortgage = nonMonopolies
      .map((p) => ({
        opportunityCost: this.calculateOpportunityCost(p, activePlayer, mortgageValueMap),
        property: p,
      }))
      .sort((a, b) => a.opportunityCost - b.opportunityCost)
      .reverse();
    propsToMortgage.forEach((p) => {
      if (remainingDebt > 0) {
        remainingDebt -= mortgageValueMap[p.id];
        p.mortgaged = true; // eslint-disable-line no-param-reassign
      }
    });
  }

  // Step 3: Shave off houses
  if (remainingDebt > 0) {
    const improveValueMap = this.getPropValueMap(activePlayer, 'improvements');
    const propsWithOverThreeApts = Object.values(improveValueMap).reduce((acc, group) => {
      if (Object.values(group).some((n) => (3 < n) && (n < 10))) { // eslint-disable-line yoda
        acc.push(group);
      }
      return acc;
    }, []);
    if (propsWithOverThreeApts.length) {
      propsWithOverThreeApts.forEach((group) => {
        Object.entries(group).forEach(([pId, value]) => {
          if (typeof pId === 'number') {
            const housesAboveThree = value - 3;
            this.properties[pId]
          }
        });
      });
    }
    /*
      shave off houses where there's more than 3 first.
        - if monopolies.houses > 3
          then shave off houses from most expensive properties first.
    */
  }
}

/**
 * @function calcPayAmount
 * Calculates the amount the active player must pay another player.
 * @param {object} targetProp
 * @param {object} activePlayer
 * @return {number}
 */
function calcPayAmount(targetProp) {
  if (!this.isOwnedProperty(targetProp)) {
    return { amount: 0, owner: undefined };
  }
  const propOwnerMap = {};
  Object
    .entries(this.players)
    .forEach(([ownerName, data]) => {
      data
        .properties
        .forEach((prop) => {
          if (prop.group[0] === targetProp.group[0]) {
            if (propOwnerMap[ownerName]) {
              propOwnerMap[ownerName][prop.id] = prop;
            } else {
              propOwnerMap[ownerName] = {
                [prop.id]: prop,
              };
            }
          }
        });
    });
  let owner = '';
  const hasSameOwner = Object.keys(propOwnerMap).length === 1;
  if (hasSameOwner) {
    owner = Object.keys(propOwnerMap[0]);
  } else {
    owner = Object
      .entries(propOwnerMap)
      .reduce((acc, [pOwner, prop]) => (prop.id === targetProp.id ? pOwner : ''), '');
    if (!owner) {
      throw Error('Cannot find owner.');
    }
  }

  if (targetProp.type === 'utility') {
    const [value] = this.rollDice();
    if (hasSameOwner) {
      return {
        amount: value * 10,
        owner,
      };
    }
    return { amount: value * 4, owner };
  }

  if (targetProp.type === 'railroad') {
    if (hasSameOwner) {
      return { amount: 200, owner };
    }
    const numOfRRs = Object
      .values(propOwnerMap[owner])
      .length;
    switch (numOfRRs) {
      case 1:
        return { amount: 25, owner };
      case 2:
        return { amount: 50, owner };
      case 3:
        return { amount: 100, owner };
      case 4:
        return { amount: 200, owner };
      default:
        throw Error('Could not calculate railroad payment');
    }
  }

  if (targetProp.type === 'property') {
    if (hasSameOwner) {
      if (this.apartments[targetProp.id].count > 0) {
        return {
          amount: targetProp.rent[this.apartments[targetProp.id].count],
          owner,
        };
      }
      return { amount: targetProp.rent[0] * 2, owner };
    }
    return { amount: targetProp.rent[0], owner };
  }

  throw Error('could not calculate rent');
}

/**
 * @function checkForWinner
 * Detect if there is only one player left with money.
 * @param
 * @return
 */
function checkForWinner() {
  const remainingPlayers = Object
    .entries(this.players)
    .reduce((acc, [name, player]) => {
      if (player.cash) {
        acc.push(name);
      }
      return acc;
    }, []);
  if (remainingPlayers.length > 1) {
    return false;
  }
  return true;
}

/**
 * @function playGame
 * Handle role for each player. Check for a winner. If a winner is found, then return calculate
 * the game results & return to caller.
 * @param na
 * @return {obj} results
 */
function playGame() {
  let keepPlaying = true;
  while (keepPlaying) {
    this.handleRole();
    if (this.checkForWinner() === true) {
      keepPlaying = false;
    }
  }
  const results = this.processGameResults();
  return results;
}

/**
 * @function opportunityCost
 *
 * @param
 * @return
 */
function calculateOpportunityCost(targetProperty, activePlayer, propertyValueMap) {
  /*
    "opportunity Cost"
    "cash Gained"
    "revenue Lost"
    ""
    opportunityCost = revenuePotential / boardFootprint
    "revenuePotential" = [$6 * 0.1, $7 * 0.2]
    "boardFootprint" = [1 * 0.3, 1 * 0.4, 1 * 0.6]
  */
  const boardFootprint = activePlayer
    .properties
    .map((p) => {
      if (p.id !== targetProperty.id) {
        return p.weight;
      }
      return 0;
    });
  const revenuePotential = activePlayer
    .properties
    .map((p) => {
      if (p.id !== targetProperty.id) {
        return propertyValueMap[p.id] * p.weight;
      }
      return 0;
    });
  const opportunityCost = stats.sum(revenuePotential) / stats.sum(boardFootprint);
  return opportunityCost;
}

function getPropValueMap(activePlayer, mapType = 'rent') {
  const propMap = activePlayer
    .properties
    .reduce((acc, nProp) => {
      if (acc[nProp.group[0]]) {
        acc[nProp.group[0]]
          .properties
          .push(nProp);
      } else {
        acc[nProp.group[0]] = {
          properties: [],
          total: nProp.group[2],
        };
      }
      return acc;
    }, {});
  if (mapType === 'mortgage') {
    const mortgageMap = Object.entries(propMap).reduce((acc, nextGroup) => {
      nextGroup.properties.forEach((p) => {
        acc[p.id] = (p.cost) / 2;
      });
      return acc;
    });
    return mortgageMap;
  }
  /*
    {
      0: {
        properties: [{...}, {...}]
        total: 3
      }
    }
  */

  if (mapType === 'rent') {
    const rentMap = Object
      .entries(propMap)
      .reduce((acc, [, nextGroup]) => {
        if (nextGroup.total !== nextGroup.properties.length) {
          nextGroup.properties.forEach((np) => {
            acc[np.id] = np.rent[0]; // eslint-disable-line prefer-destructuring
          });
        } else {
          nextGroup
            .properties
            .forEach((np) => {
              if (this.apartments[np.id]) {
                acc[np.id] = np.rent[this.apartments[np.id].count];
              } else {
                acc[np.id] = np.rent[0] * 2;
              }
            });
        }
        return acc;
      }, {});
    return rentMap;
  }

  if (mapType === 'improvements') {
    const Apts = this.game.apartments;
    const aptHotelValueMap = Object
      .entries(propMap)
      .reduce((acc, [groupId, nextGroup]) => {
        if (nextGroup.total === nextGroup.properties.length) {
          acc[groupId] = nextGroup.properties.reduce((acc2, p) => {
            /* eslint-disable no-param-reassign */
            if (!acc2.shaveValue) {
              acc2.shaveValue = p.house / 2;
            }
            acc2[p.id] = Apts[p.id];
            return acc2;
          }, {});
          /* eslint-enable no-param-reassign */
        }
        return acc;
      }, {});
    const sortedResults = Object
      .entries(aptHotelValueMap)
      .sort(([, group1], [, group2]) => (group1.shaveValue - group2.shaveValue))
      .reduce((acc, [id, group]) => {
        acc[id] = group;
        return acc;
      }, {});
    return sortedResults;
    /* Signature of map
      {
        0: {
          shaveValue: 25,
          [id-1]: 4,
          [id-2]: 3,
        }
      }
    */
  }
  return {};
}
