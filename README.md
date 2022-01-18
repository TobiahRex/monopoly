# Monopoly Analysis

### Problems Statement

#### Playing when player has Cash
- [x] Randomly distribute all properties amongst N players
- [x] N-3 player rolls die & lands on Baltic Avenue (die = 3 ~ D3)
- [x] Assume N-3 player does not own Baltic Avenue (die = 3 ~ D3) or Mediterranean Ave. (die = 1 ~ D1)
- [x] Update D1 Sharpe Ratio (SR)
  - Revenue Lost (RL) -= D1-Rent (-$2)
- [x] Update D3's SR
  - Revenue Gained (RG) += D3-Rent (+$4)
- [x] Randomly shuffle
- N-2 player rolls die & lands on D7.
- Update D1-D6 sharpe ratio
- **NOTE**:
    - Do not update sharpe ratio for properties that are mortgaged, but make not on meta value that property is mortgaged.

#### Playing when player has no Cash
- Player mortgages properties like utilities & Railroads
- Player mortgages properties with no houses
- Player removes houses from cheapest properties @ ascending order

#### Datapoints to track for each property
- Landings
  - Mortgaged?
  - Rent paid
  - Dice Roll prior to landing

# GamePlay
- Game.distributeProps()
- Game.playGame()
  - Game.buyImprovements()      # TODO
  - Game.unmortgageProperty()   # TODO
  - Game.handleRole()
    - Game.rollDice()
    - Game.updatePropStats()
    - Game.payRent()
      - Game.calcPayAmount()
      - Game.handleFindMoneyToPay()
        - Game.getRentMap()
        - Game.calcOpportunityCost()
      - Game.updatePropStats()
  - Game.checkForWinnder()