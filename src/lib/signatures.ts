import { toFunctionSelector } from "viem";

// What a function lets someone do, in plain English.
export type Organ = "token" | "ownership" | "mint" | "burn" | "blacklist" | "tax" | "trading" | "limits" | "drain" | "upgrade" | "swap" | "info";

export type Known = { sig: string; organ: Organ; says?: string; returns?: "uint" | "address" | "bool" | "string" };

const K = (organ: Organ, says: string | undefined, ...sigs: string[]): Known[] => sigs.map((sig) => ({ sig, organ, says }));
const R = (returns: Known["returns"], organ: Organ, says: string | undefined, ...sigs: string[]): Known[] =>
  sigs.map((sig) => ({ sig, organ, says, returns }));

export const KNOWN: Known[] = [
  // ERC-20 basics
  ...K("token", undefined, "transfer(address,uint256)", "transferFrom(address,address,uint256)", "approve(address,uint256)",
    "allowance(address,address)", "balanceOf(address)", "increaseAllowance(address,uint256)", "decreaseAllowance(address,uint256)",
    "permit(address,address,uint256,uint256,uint8,bytes32,bytes32)", "nonces(address)", "DOMAIN_SEPARATOR()", "eip712Domain()"),
  ...R("string", "info", undefined, "name()", "symbol()"),
  ...R("uint", "info", undefined, "decimals()", "totalSupply()"),

  // Ownership
  ...R("address", "ownership", "Shows who controls the admin switches.", "owner()", "getOwner()", "pendingOwner()"),
  ...K("ownership", "Hands control of the contract to another wallet.", "transferOwnership(address)", "acceptOwnership()", "setOwner(address)"),
  ...K("ownership", "Gives up control forever. Good if it's been called.", "renounceOwnership()"),
  ...K("ownership", "Role-based admin: some wallets have special powers.", "grantRole(bytes32,address)", "revokeRole(bytes32,address)",
    "renounceRole(bytes32,address)"),
  ...R("bool", "ownership", undefined, "hasRole(bytes32,address)"),

  // Mint
  ...K("mint", "Can print new tokens out of thin air, diluting every holder.", "mint(address,uint256)", "mint(uint256)", "mintTo(address,uint256)",
    "_mint(address,uint256)", "mint(address)", "issue(uint256)", "airdrop(address[],uint256[])", "addSupply(uint256)", "increaseSupply(uint256)"),
  ...K("burn", "Destroys tokens.", "burn(uint256)", "burnFrom(address,uint256)"),
  ...K("burn", "Can destroy tokens in someone else's wallet.", "burn(address,uint256)", "burnFromWallet(address,uint256)"),

  // Blacklist
  ...K("blacklist", "Can block wallets from selling or moving tokens.", "blacklist(address)", "blacklistAddress(address,bool)",
    "setBlacklist(address,bool)", "addToBlacklist(address)", "addBlacklist(address)", "setBots(address[],bool)", "setBot(address,bool)",
    "addBots(address[])", "blockBots(address[])", "blockAddress(address)", "setIsBlacklisted(address,bool)", "updateBlacklist(address,bool)",
    "manageBlacklist(address[],bool)", "setSniper(address,bool)", "markBot(address,bool)", "freeze(address)", "freezeAccount(address,bool)"),
  ...K("blacklist", "Removes wallets from the blocklist.", "removeFromBlacklist(address)", "delBot(address)", "unblacklist(address)", "unfreeze(address)"),
  ...R("bool", "blacklist", "Checks whether a wallet is blocked.", "isBlacklisted(address)", "isBot(address)", "bots(address)", "_isBlacklisted(address)", "blacklisted(address)"),

  // Taxes
  ...K("tax", "Can change the buy/sell tax, possibly up to 100%.", "setFee(uint256)", "setFees(uint256,uint256)", "setTax(uint256)",
    "setTaxes(uint256,uint256)", "setBuyFee(uint256)", "setSellFee(uint256)", "setBuyTax(uint256)", "setSellTax(uint256)",
    "updateFees(uint256,uint256)", "updateBuyFees(uint256,uint256,uint256)", "updateSellFees(uint256,uint256,uint256)", "setTaxFeePercent(uint256)",
    "setFeePercent(uint256)", "setSwapFees(uint256,uint256)", "setTransferFee(uint256)", "setBuyFees(uint256,uint256)", "setSellFees(uint256,uint256)",
    "changeTax(uint256,uint256)", "reduceFee(uint256)", "setFee(uint256,uint256)"),
  ...K("tax", "Lets chosen wallets skip the tax.", "excludeFromFee(address)", "includeInFee(address)", "excludeFromFees(address,bool)",
    "setExcludedFromFee(address,bool)", "setIsFeeExempt(address,bool)"),
  ...R("bool", "tax", undefined, "isExcludedFromFee(address)", "_isExcludedFromFee(address)"),
  ...K("tax", "Changes where the tax money goes.", "setMarketingWallet(address)", "setTaxWallet(address)", "setFeeReceiver(address)", "setDevWallet(address)",
    "updateMarketingWallet(address)", "setTreasury(address)", "setFeeRecipient(address)"),
  ...R("uint", "tax", "Current tax setting.", "buyTax()", "sellTax()", "buyFee()", "sellFee()", "_taxFee()", "taxFee()", "_buyTax()", "_sellTax()",
    "totalBuyFee()", "totalSellFee()", "buyTotalFees()", "sellTotalFees()", "_finalBuyTax()", "_finalSellTax()", "fee()", "transferFee()"),

  // Trading switches
  ...K("trading", "Trading has an on/off switch the owner controls.", "openTrading()", "enableTrading()", "startTrading()", "setTradingEnabled(bool)",
    "setTrading(bool)", "launch()", "pause()", "unpause()", "setPaused(bool)", "disableTrading()", "stopTrading()", "setSwapEnabled(bool)"),
  ...R("bool", "trading", "Shows whether trading is switched on.", "tradingEnabled()", "tradingActive()", "paused()", "swapEnabled()"),

  // Limits
  ...K("limits", "Can cap how much a wallet can buy, hold or sell.", "setMaxTxAmount(uint256)", "setMaxWalletSize(uint256)", "setMaxWallet(uint256)",
    "setMaxTx(uint256)", "updateMaxTxnAmount(uint256)", "updateMaxWalletAmount(uint256)", "removeLimits()", "setMaxTxPercent(uint256)",
    "setMaxWalletPercent(uint256)", "setLimits(uint256,uint256)", "setCooldown(uint256)", "setCooldownEnabled(bool)"),
  ...R("uint", "limits", "Current limit.", "maxTxAmount()", "_maxTxAmount()", "maxWallet()", "_maxWalletSize()", "maxWalletAmount()", "maxTransactionAmount()"),

  // Drain / rescue
  ...K("drain", "Can pull tokens or ETH out of the contract, including the liquidity it holds.", "withdraw()", "withdraw(uint256)", "withdrawETH()",
    "withdrawTokens(address)", "withdrawToken(address,uint256)", "rescueTokens(address,uint256)", "rescueETH()", "rescueERC20(address,uint256)",
    "recoverERC20(address,uint256)", "emergencyWithdraw()", "clearStuckBalance()", "clearStuckEth()", "manualSwap()", "manualsend()",
    "manualSend()", "sweep(address)", "removeLiquidity()", "withdrawStuckTokens(address)", "transferAll(address)", "claimStuckTokens(address)"),

  // Upgrades / proxies
  ...K("upgrade", "The code can be swapped for something else later.", "upgradeTo(address)", "upgradeToAndCall(address,bytes)",
    "changeAdmin(address)", "setImplementation(address)"),
  ...R("address", "upgrade", "Points to the code that actually runs.", "implementation()", "admin()"),

  // DEX plumbing (normal for tax tokens)
  ...K("swap", undefined, "uniswapV2Pair()", "uniswapV2Router()", "pair()", "router()", "swapTokensForEth(uint256)", "setSwapTokensAtAmount(uint256)",
    "swapTokensAtAmount()", "setAutomatedMarketMakerPair(address,bool)", "automatedMarketMakerPairs(address)"),
];

export const BY_SELECTOR: Map<string, Known> = new Map(KNOWN.map((k) => [toFunctionSelector(`function ${k.sig}`), k]));
