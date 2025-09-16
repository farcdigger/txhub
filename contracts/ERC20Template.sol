// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Template is ERC20, Ownable {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 tokenDecimals
    ) ERC20(name, symbol) {
        _decimals = tokenDecimals;
        _mint(msg.sender, initialSupply * 10**tokenDecimals);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    // Owner can mint more tokens
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    // Owner can burn tokens
    function burn(uint256 amount) public onlyOwner {
        _burn(msg.sender, amount);
    }
}
