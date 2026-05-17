// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Like {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract CForgeToken {
    string public constant name = "cforge";
    string public constant symbol = "CFRG";
    uint8 public constant decimals = 18;

    uint256 public constant CELO_MINT_FEE = 0.002 ether;
    uint256 public constant MINT_AMOUNT = 1000 ether;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 ether;

    // Celo mainnet stablecoins supported for MiniPay mint fees; keep decimals aligned with docs.
    address public constant USDM = 0x765DE816845861e75A25fCA122bb6898B8B1282a;
    address public constant USDC = 0xcebA9300f2b948710d2653dD7B07f33A8B32118C;
    address public constant USDT = 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e;

    address public owner;
    address payable public treasury;
    bool public paused;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public stableMintFee;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed tokenOwner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TreasuryUpdated(address indexed treasury);
    event StableFeeUpdated(address indexed token, uint256 fee);
    event PausedUpdated(bool paused);
    event TokensMinted(
        address indexed minter,
        address indexed paymentToken,
        uint256 paymentAmount,
        uint256 amountMinted,
        uint256 newTotalSupply
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Minting paused");
        _;
    }

    constructor(address payable treasury_) {
        owner = msg.sender;
        treasury = treasury_ == address(0) ? payable(msg.sender) : treasury_;

        stableMintFee[USDM] = 200_000_000_000_000; // 0.0002 USDm, 18 decimals
        stableMintFee[USDC] = 200; // 0.0002 USDC, 6 decimals
        stableMintFee[USDT] = 200; // 0.0002 USDT, 6 decimals
    }

    function mintWithCelo() external payable whenNotPaused {
        require(msg.value == CELO_MINT_FEE, "Incorrect CELO fee");
        _forwardCelo(msg.value);
        _mint(msg.sender, MINT_AMOUNT);

        emit TokensMinted(msg.sender, address(0), msg.value, MINT_AMOUNT, totalSupply);
    }

    function mintWithStable(address stableToken) external whenNotPaused {
        uint256 fee = stableMintFee[stableToken];
        require(fee > 0, "Unsupported stablecoin");
        require(IERC20Like(stableToken).transferFrom(msg.sender, treasury, fee), "Fee transfer failed");

        _mint(msg.sender, MINT_AMOUNT);

        emit TokensMinted(msg.sender, stableToken, fee, MINT_AMOUNT, totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "Allowance too low");

        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }

        _transfer(from, to, amount);
        return true;
    }

    function setTreasury(address payable treasury_) external onlyOwner {
        require(treasury_ != address(0), "Invalid treasury");
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function setStableFee(address token, uint256 fee) external onlyOwner {
        require(token != address(0), "Invalid token");
        stableMintFee[token] = fee;
        emit StableFeeUpdated(token, fee);
    }

    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit PausedUpdated(paused_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Invalid recipient");
        require(totalSupply + amount <= MAX_SUPPLY, "Max supply reached");

        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[from] >= amount, "Balance too low");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _forwardCelo(uint256 amount) internal {
        (bool ok, ) = treasury.call{value: amount}("");
        require(ok, "CELO transfer failed");
    }
}
