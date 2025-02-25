# AreteCoin Token Model: From Ancient Olympics to Now

## Historical Foundation
- **Start Date**: 778 BC Spring Equinox
- **Total Historical Hours**: 24,557,688 (as of 2025)
- **Token Generation**: 1 token per hour
- **Historical Supply**: 24,557,688 tokens

## Token Distribution Model

### 1. Historical Tokens (778 BC - 2025)
```javascript
const HISTORICAL_EPOCHS = {
    ANCIENT: {
        start: "778 BC",
        end: "394 AD",  // Last ancient Olympics
        tokensPerHour: 1
    },
    MODERN: {
        start: "1896",  // First modern Olympics
        end: "2025",
        tokensPerHour: 1
    }
};

// Distribution through Olympiad-based halving
const HALVING_SCHEDULE = {
    cycle: 4 * 365.25 * 24,  // Hours in an Olympiad
    initialReward: 1000,     // Tokens per block
    halvingEvents: 12        // Number of halvings
};
```

### 2. Modern Distribution (2025 onwards)

#### Hourly Token Generation
```javascript
class HourlyToken {
    timestamp: Date;
    performances: Performance[];
    witnesses: Witness[];
    totalValue: number;

    // Distribution based on performance quality
    distributeValue() {
        return this.performances.map(perf => ({
            athlete: perf.pubkey,
            share: calculateShare(perf, this.totalValue)
        }));
    }
}
```

#### Performance-Based Distribution
```javascript
class PerformanceShare {
    // Factors affecting share
    factors: {
        difficulty: number,     // 0-1
        execution: number,      // 0-1
        witnesses: number,      // Count of witnesses
        level: string          // local/regional/national/international
    };

    // Calculate share of hourly token
    calculateShare() {
        return (
            this.factors.difficulty *
            this.factors.execution *
            (1 + Math.log(this.factors.witnesses)) *
            getLevelMultiplier(this.factors.level)
        );
    }
}
```

### 3. Olympiad Cycles

#### Four-Year Cycle
```javascript
class OlympiadCycle {
    startDate: Date;
    endDate: Date;
    totalTokens: number;
    
    // Special events during Olympics
    olympicBonus: {
        goldMedal: 24,      // Hours worth
        silverMedal: 12,
        bronzeMedal: 6
    };
    
    // Monthly cycles within Olympiad
    lunarCycles: {
        cycleLength: 28 * 24,  // Hours
        bonusTokens: 28        // One day's worth per cycle
    };
}
```

### 4. Halving Model

#### Historical Token Distribution
```javascript
class HistoricalDistribution {
    // Initial distribution phase
    initialPhase: {
        startBlock: 0,
        endBlock: 210000,
        rewardPerBlock: 1000
    };

    // Halving schedule
    halvingSchedule: {
        interval: 210000,    // Blocks
        totalHalvings: 12,
        currentHalving: 0
    };

    // Calculate current block reward
    calculateReward(block) {
        const halvings = Math.floor(block / this.halvingSchedule.interval);
        return this.initialPhase.rewardPerBlock / Math.pow(2, halvings);
    }
}
```

## Token Utility

### 1. Performance Rewards
- Hourly tokens for verified performances
- Bonus tokens for competition wins
- Olympic medal multipliers
- Training achievement tokens

### 2. Witness Incentives
- Share of performance tokens
- Validation rewards
- Consensus participation bonuses
- Long-term staking rewards

### 3. Historical Value
- Each token tied to specific hour since 778 BC
- Special value for Olympic hours
- Increased value for historical competition times
- Collectible aspect for significant moments

## Implementation Strategy

### Phase 1: Historical Distribution
1. Create genesis block from 778 BC
2. Implement halving schedule
3. Reserve Olympic moments
4. Structure historical token distribution

### Phase 2: Modern System
1. Launch hourly token generation
2. Implement performance validation
3. Start witness network
4. Enable real-time distribution

### Phase 3: Full Integration
1. Connect to HackySack game
2. Add competition framework
3. Implement Olympic bonus system
4. Launch historical token claiming

## Technical Implementation

### 1. Token Contract
```javascript
class AreteToken {
    // Basic token properties
    name: "AreteCoin";
    symbol: "ARETE";
    decimals: 8;
    
    // Historical tracking
    genesisHour: "778 BC Spring Equinox";
    currentHour: getCurrentHour();
    totalHours: calculateTotalHours();
    
    // Distribution logic
    async mintHourlyToken() {
        const hour = this.currentHour;
        const performances = await getHourPerformances(hour);
        return distributeToken(hour, performances);
    }
    
    // Historical claiming
    async claimHistoricalTokens(startHour, endHour) {
        validateHistoricalClaim(startHour, endHour);
        return calculateHistoricalDistribution(startHour, endHour);
    }
}
```

### 2. Performance Validation
```javascript
class PerformanceValidator {
    // Validate real-time performance
    async validatePerformance(performance) {
        const witnesses = await getWitnesses(performance);
        const consensus = await achieveConsensus(witnesses);
        return calculateReward(performance, consensus);
    }
    
    // Historical performance import
    async importHistoricalPerformance(record) {
        validateHistoricalRecord(record);
        return assignHistoricalTokens(record);
    }
}
```

## Future Considerations

### 1. Historical Claims
- Process for claiming historical performances
- Verification of historical records
- Distribution of unclaimed historical tokens
- Special handling of Olympic periods

### 2. Modern Integration
- Real-time performance tracking
- Automated token distribution
- Witness network scaling
- Competition integration

### 3. Value Preservation
- Token burning mechanisms
- Staking requirements
- Historical token preservation
- Olympic moment preservation
