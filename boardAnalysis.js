const props = require('./js/board.json');


(function evalProps(){
  const colorMap = {
    1: 'purple',
    2: 'light-blue',
    3: 'pink',
    4: 'orange',
    5: 'red',
    6: 'yellow',
    7: 'green',
    8: 'blue',
  }
  const propsByGroup = props.reduce((acc, next) => {
    if (next.group && next.rent) {
      if (acc[next.group[0]]) {
        acc[next.group[0]].push(next);
      } else {
        acc[next.group[0]] = [next];
      }
    }
    return acc;
  }, {});
  const result = Object.entries(propsByGroup).reduce((acc, [id, group]) => {
    const houseCost = group[0].house;
    const ownershipCost = group.reduce((total, n) => total + n.cost, 0);
    const setOfHouses = houseCost * group.length;
    acc[colorMap[id]] = {
      '0-houses': group.map((n) => ((n.rent[0] * 2)/(ownershipCost)).toFixed(3)),
      '1-house': group.map((n) => ((n.rent[1]) / (ownershipCost + setOfHouses)).toFixed(3)),
      '2-houses': group.map((n) => ((n.rent[2]) / (ownershipCost + setOfHouses + setOfHouses)).toFixed(3)),
      '3-houses': group.map((n) => ((n.rent[3]) / (ownershipCost + setOfHouses + setOfHouses + setOfHouses)).toFixed(3)),
      '4-houses': group.map((n) => ((n.rent[4]) / (ownershipCost + setOfHouses + setOfHouses + setOfHouses + setOfHouses)).toFixed(3)),
      'hotel': group.map((n) => ((n.rent[5]) / (ownershipCost + setOfHouses + setOfHouses + setOfHouses + setOfHouses + setOfHouses)).toFixed(3)),
      ownershipCost,
    }
    return acc;
  }, {});
  console.log(JSON.stringify(result, null, 2));
})();

/*
  {
    1: {
      1-house: .43,
      2-houses: .32,
      3-houses: .56,
      4-houses: .89,
      ownershipCost: 120,
      four-houses: 200,
      three-houses: 150,
    }
  }
*/
