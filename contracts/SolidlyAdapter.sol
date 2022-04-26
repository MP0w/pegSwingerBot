//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./UniswapInterface.sol";
import "./Adapter.sol";
import "./Sweepable.sol";

interface SolidlyRouter {
    function swapExactTokensForTokensSimple(
        uint amountIn,
        uint amountOutMin,
        address tokenFrom,
        address tokenTo,
        bool stable,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

interface SolidlyFixedRouter {
    function getAmountOut(uint amountIn, address tokenIn, address tokenOut, bool stable) external view returns (uint);
}

contract SolidlyAdapter is Adapter, Sweepable {
    address public override immutable router;

    constructor(address _router) {
        router = _router;
    }

    function swap(IERC20 from, IERC20 to, uint amount, uint minOut, address destination) public override {
        from.approve(router, amount);

        SolidlyRouter(router).swapExactTokensForTokensSimple(
            amount,
            minOut,
            address(from),
            address(to),
            true,
            destination,
            block.timestamp
        );
    }

    function getRatio(IERC20 from, IERC20 to, uint amount) public override view returns (uint) {
        SolidlyFixedRouter fixedRouter = SolidlyFixedRouter(0x0f68551237a7efFe35600524c0dD4989bF8208e9);

        uint amountOut = fixedRouter.getAmountOut(
            amount,
            address(from),
            address(to),
            true
        );

        return ((1 ether) * 1000) / amountOut;
    }
}