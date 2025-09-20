// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DailyStreak {
    address public owner;
    
    uint256 public constant BASE_XP = 10; // Base XP for first day
    uint256 public constant GAME_FEE = 0.00002 ether; // 0.00002 ETH fee
    address public constant FEE_WALLET = 0x7d2Ceb7a0e0C39A3d0f7B5b491659fDE4bb7BCFe;
    
    struct StreakData {
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 lastClaimDay;
        uint256 totalXP;
        uint256 totalClaims;
    }
    
    mapping(address => StreakData) public playerStreaks;
    
    event StreakClaimed(address indexed player, uint256 streak, uint256 xpEarned, uint256 totalXP);
    event StreakBroken(address indexed player, uint256 previousStreak);
    
    constructor() {
        owner = msg.sender;
    }
    
    // Claim daily streak
    function claimDailyStreak() external payable {
        require(msg.value >= GAME_FEE, "Insufficient fee");
        
        StreakData storage streak = playerStreaks[msg.sender];
        uint256 currentDay = block.timestamp / 1 days;
        
        // Check if it's a new day
        if (streak.lastClaimDay == currentDay) {
            revert("Already claimed today");
        }
        
        // Check if streak is broken (more than 1 day gap)
        if (streak.lastClaimDay > 0 && currentDay > streak.lastClaimDay + 1) {
            emit StreakBroken(msg.sender, streak.currentStreak);
            streak.currentStreak = 0;
        }
        
        // Calculate XP (exponential growth: 10, 20, 40, 80, 160...)
        uint256 xpEarned = BASE_XP * (2 ** streak.currentStreak);
        
        // Update streak data
        streak.currentStreak++;
        streak.longestStreak = streak.currentStreak > streak.longestStreak ? streak.currentStreak : streak.longestStreak;
        streak.lastClaimDay = currentDay;
        streak.totalXP += xpEarned;
        streak.totalClaims++;
        
        // Send fee to fee wallet
        payable(FEE_WALLET).transfer(GAME_FEE);
        
        // Refund excess ETH
        if (msg.value > GAME_FEE) {
            payable(msg.sender).transfer(msg.value - GAME_FEE);
        }
        
        emit StreakClaimed(msg.sender, streak.currentStreak, xpEarned, streak.totalXP);
    }
    
    // Get player streak data
    function getPlayerStreak(address player) external view returns (
        uint256 currentStreak,
        uint256 longestStreak,
        uint256 lastClaimDay,
        uint256 totalXP,
        uint256 totalClaims,
        uint256 nextXP
    ) {
        StreakData memory streak = playerStreaks[player];
        uint256 nextXPAmount = BASE_XP * (2 ** streak.currentStreak);
        
        return (
            streak.currentStreak,
            streak.longestStreak,
            streak.lastClaimDay,
            streak.totalXP,
            streak.totalClaims,
            nextXPAmount
        );
    }
    
    // Check if player can claim today
    function canClaimToday(address player) external view returns (bool) {
        StreakData memory streak = playerStreaks[player];
        uint256 currentDay = block.timestamp / 1 days;
        return streak.lastClaimDay != currentDay;
    }
    
    // Withdraw contract balance (only owner)
    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
}