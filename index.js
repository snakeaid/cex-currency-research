'use strict';
const coingecko = require('./coingeckoService');

(async function () {
    let allExchanges = await coingecko.getAllExchanges();
    let centralizedExchanges = await coingecko.getCentralizedExchanges(allExchanges);
    let coingeckoCurrencies = await coingecko.getCoingeckoCurrencies();
    let uniswapCurrencies = require('./uniswapCurrency.json');
    let currenciesWithIdentifiers = coingecko.mapCurrencies(coingeckoCurrencies, uniswapCurrencies);
    let exchangesWithVolumes = coingecko.getExchangesWithVolumes(centralizedExchanges);
    let exchangesWithCurrencies = coingecko.getExchangesWithCurrencies(exchangesWithVolumes.slice(0, 23));
    let filteredExchangesByUniswap = coingecko.filterExchangesByUniswap(exchangesWithCurrencies, currenciesWithIdentifiers);
    let tradedCurrencies = await coingecko.getTradedCurrencies(["binance", "kucoin", "gate"]);
    coingecko.filterExchangesByTraded(filteredExchangesByUniswap, tradedCurrencies);
})();