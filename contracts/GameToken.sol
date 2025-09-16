// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1B max supply
    
    // Mint control
    bool public mintingEnabled = false; // Initially disabled
    
    constructor() ERC20("BaseHub Token", "BHUB") Ownable(msg.sender) {
        _mint(msg.sender, 1 * 10**18); // Only 1 token to owner
    }
    
    // Mint tokens to players (only game contracts can call this)
    function mintToPlayer(address player, uint256 amount) external {
        // Check if minting is enabled
        require(mintingEnabled, "Minting is currently disabled");
        
        // Check max supply
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        // Only allow specific game contracts to mint
        require(
            msg.sender == owner() || 
            isGameContract(msg.sender), 
            "Only game contracts can mint"
        );
        _mint(player, amount);
    }
    
    // Check if address is a game contract
    function isGameContract(address contractAddr) public view returns (bool) {
        // This will be set by owner after deploying game contracts
        return gameContracts[contractAddr];
    }
    
    // Game contract addresses
    mapping(address => bool) public gameContracts;
    
    // Add game contract (only owner)
    function addGameContract(address contractAddr) external onlyOwner {
        gameContracts[contractAddr] = true;
    }
    
    // Remove game contract (only owner)
    function removeGameContract(address contractAddr) external onlyOwner {
        gameContracts[contractAddr] = false;
    }
    
    // Enable minting (only owner)
    function enableMinting() external onlyOwner {
        mintingEnabled = true;
    }
    
    // Disable minting (only owner)
    function disableMinting() external onlyOwner {
        mintingEnabled = false;
    }
    
    // Check minting status
    function isMintingEnabled() external view returns (bool) {
        return mintingEnabled;
    }
    
    // Owner mint function (bypasses mintingEnabled check)
    function ownerMint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    // Owner can mint to multiple addresses
    function ownerBatchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Exceeds max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
}
