//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface UniswapRouter {
    function swapExactTokensForTokensSimple(
        uint amountIn,
        uint amountOutMin,
        address tokenFrom,
        address tokenTo,
        bool stable,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

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
    bool public solidStableSwap;
    address public keeper;
    address public treasury;
    uint public lowerBound = 1086;
    uint public upperbound = 970;

    constructor(address _mainAsset, address _peggedAsset, address _router, bool _solidStableSwap) {
        mainAsset = IERC20(_mainAsset);
        peggedAsset = IERC20(_peggedAsset);
        router = UniswapRouter(_router);
        solidStableSwap = _solidStableSwap;
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
        uint balance = from.balanceOf(treasury);
        uint ratio = toPegged ? lowerBound : upperbound;
        uint amountOutMin = balance / 1000 * ratio;
        uint toBalance = to.balanceOf(treasury);
        // approve router
        from.approve(address(router), balance);
        // transfer fro  treasury to this
        from.transferFrom(treasury, address(this), balance);

        if (solidStableSwap) {
            router.swapExactTokensForTokensSimple(
                balance,
                amountOutMin,
                address(from),
                address(to),
                true,
                address(treasury),
                block.timestamp
            );
        } else {
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
        }


        uint newToBalance = to.balanceOf(address(treasury));
        require((newToBalance - toBalance) > amountOutMin, "too high slippage");

        if (toPegged) {
            require(balance < newToBalance, "unexpected lower balance for pegged asset");
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
