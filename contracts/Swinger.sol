//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface UniswapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract Swinger is Ownable {
    IERC20 public immutable mainAsset;
    IERC20 public immutable peggedAsset;
    UniswapRouter public router;
    address public keeper;
    address public treasury;
    uint public lowerBound = 1086;
    uint public upperbound = 970;

    constructor(address _mainAsset, address _peggedAsset, address _router) {
        mainAsset = IERC20(_mainAsset);
        peggedAsset = IERC20(_peggedAsset);
        router = UniswapRouter(_router);
        keeper = msg.sender;
        treasury = msg.sender;
    }

    modifier onlyKeeper() {
        require(keeper == _msgSender(), "caller is not the keeper");
        _;
    }

    function swing(bool toPegged) public onlyKeeper {
        IERC20 from = toPegged ? mainAsset : peggedAsset;
        IERC20 to = toPegged ? peggedAsset : mainAsset;
        uint balance = from.balanceOf(address(treasury));
        uint ratio = toPegged ? lowerBound : upperbound;
        uint amountOutMin = balance / 1000 * ratio;
        uint toBalance = to.balanceOf(address(treasury));

        address[] memory route = new address[](2);
        route[0] = address(from);
        route[1] = address(to);

        router.swapExactTokensForTokens(
            balance,
            amountOutMin,
            route,
            address(treasury),
            block.timestamp
        );

        uint newToBalance = to.balanceOf(address(treasury));
        require((newToBalance - toBalance) > amountOutMin, "too high slippage");

        if (toPegged) {
            require(balance < newToBalance);
        }
    }

    function setLimits(uint _lowerBound, uint _upperBound) public onlyOwner {
        lowerBound = _lowerBound;
        upperbound = _upperBound;
    }

    function setKeeper(address _keeper) public onlyOwner {
        keeper = _keeper;
    }

    function setTreasury(address _treasury) public onlyOwner {
        treasury = _treasury;
    }

    function sweep(address _erc) public onlyOwner {
        IERC20 token = IERC20(_erc);
        uint256 balance = token.balanceOf(address(this));
        token.transferFrom(address(this), msg.sender, balance);
    }
}
