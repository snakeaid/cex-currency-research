'use strict';
const axios = require('axios').create({baseURL: 'https://api.coingecko.com/api/v3'});
const fs = require("fs");
const proxyRotator = require('./proxyRotator.js');

const getAllExchanges = async () => {
    let allExchanges = [];

    await axiosGetWithProxy("/exchanges/list").then(function (response) {
        allExchanges = response.data;
    });

    fs.writeFileSync("allExchanges.json", JSON.stringify(allExchanges));
    return allExchanges;
};

const getCentralizedExchanges = async (allExchanges) => {
    let centralizedExchanges = [];

    for (let exchange of allExchanges) {
        await axiosGetWithProxy(`/exchanges/${exchange["id"]}`).then(function (response) {
            if (response.data["centralized"] === true) centralizedExchanges.push(exchange);
        });
    }

    fs.writeFileSync("centralizedExchanges.json", JSON.stringify(centralizedExchanges));
    return centralizedExchanges;
};

const getCoingeckoCurrencies = async () => {
    let allCurrencies = [];

    await axiosGetWithProxy("/coins/list?include_platform=true").then(function (response) {
        allCurrencies = response.data;
    });

    fs.writeFileSync("allCurrencies.json", JSON.stringify(allCurrencies));
    return allCurrencies;
};

const getExchangesWithCurrencies = async (exchanges) => {
    let exchangesWithCurrencies = [];
    let i = 1;
    for (let exchange of exchanges) {
        let page = 1;
        let exchangeWithCurrencies = {"exchangeId": exchange["id"], "tokensNumber": 0};
        let newCurrencies = [];
        let tickersOnPage = 999;

        do {
            console.log(`${i} page ${page}`)
            await axiosGetWithProxy(`/exchanges/${exchange["id"]}/tickers?page=${page}`)
                .then(function (response) {
                    tickersOnPage = response.data["tickers"].length;
                    for (let ticker of response.data["tickers"]) {
                        if (ticker["is_stale"] === false) newCurrencies.push(ticker["coin_id"], ticker["target_coin_id"]);
                    }
                });
            page++;
        } while (tickersOnPage !== 0);
        i++;
        newCurrencies = newCurrencies.filter(onlyUnique).filter(Boolean);
        exchangeWithCurrencies["tokensList"] = newCurrencies;
        exchangeWithCurrencies["tokensNumber"] = newCurrencies.length;

        exchangesWithCurrencies.push(exchangeWithCurrencies);
    }

    fs.writeFileSync("exchangesWithCurrencies.json", JSON.stringify(exchangesWithCurrencies));
    return exchangesWithCurrencies;
};

const getExchangesWithVolumes = async (exchanges) => {
    for (let exchange of exchanges) {
        await axiosGetWithProxy(`/exchanges/${exchange["id"]}`).then(response => {
            exchange["volume"] = response.data["trade_volume_24h_btc_normalized"];
        });
    }
    let sortedExchanges = exchanges.sort((ex1, ex2) => Math.sign(ex2["volume"] - ex1["volume"]));

    fs.writeFileSync("exchangesWithVolumes.json", JSON.stringify(sortedExchanges));
    return sortedExchanges;
};

const getTradedCurrencies = async (tradedExchanges) => {
    let tradedCurrencies = [];

    for (let exchange of tradedExchanges) {
        let page = 1;
        let tickersOnPage = 999;

        do {
            await axiosGetWithProxy(`/exchanges/${exchange}/tickers?page=${page}`)
                .then(function (response) {
                    tickersOnPage = response.data["tickers"].length;
                    for (let ticker of response.data["tickers"]) {
                        if (ticker["is_stale"] === false) tradedCurrencies.push(ticker["coin_id"], ticker["target_coin_id"]);
                    }
                });
            page++;
        } while (tickersOnPage !== 0);
    }

    tradedCurrencies = tradedCurrencies.filter(onlyUnique).filter(Boolean);

    fs.writeFileSync("tradedCurrencies.json", JSON.stringify(tradedCurrencies))
    return tradedCurrencies;
};

const mapCurrencies = (coingeckoCurrencies, uniswapCurrencies) => {
    let currenciesWithIdentifiers = [];
    for (let i = 0; i < uniswapCurrencies.length; i++) {
        for (let coingeckoCurrency of coingeckoCurrencies) {
            if (coingeckoCurrency["platforms"]["ethereum"] === uniswapCurrencies[i]["exchangeCurrencies"][0]["exchangeTicker"].toLowerCase()) {
                currenciesWithIdentifiers[i] = uniswapCurrencies[i];
                currenciesWithIdentifiers[i]["coingeckoId"] = coingeckoCurrency["id"];
            }
        }
    }

    fs.writeFileSync("currenciesWithIdentifiers.json", JSON.stringify(currenciesWithIdentifiers));
    return currenciesWithIdentifiers;
};

const filterExchangesByUniswap = (exchangesWithCurrencies, currenciesWithIds) => {
    let filteredExchanges = exchangesWithCurrencies;
    let currencyIds = currenciesWithIds.map(currency => currency["coingeckoId"]);

    for (let exchange of filteredExchanges) {
        exchange["tokensList"] = exchange["tokensList"].filter(value => currencyIds.includes(value));
        exchange["tokensNumber"] = exchange["tokensList"].length;
    }

    fs.writeFileSync("filteredExchangesByUniswap.json", JSON.stringify(filteredExchanges));
    return filteredExchanges;
};

const filterExchangesByTraded = (exchanges, tradedCurrencies) => {
    let filteredExchanges = exchanges;

    for (let exchange of filteredExchanges) {
        exchange["tokensList"] = exchange["tokensList"].filter(value => !tradedCurrencies.includes(value));
        exchange["tokensNumber"] = exchange["tokensList"].length;
    }

    filteredExchanges = filteredExchanges.sort((ex1, ex2) => Math.sign(ex2["tokensNumber"] - ex1["tokensNumber"]));

    fs.writeFileSync("filteredExchangesByTraded.json", JSON.stringify(filteredExchanges));
    return filteredExchanges;
};

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

async function axiosGetWithProxy(url) {
    let proxy = proxyRotator.getProxy();
    let axiosResponse = await axios.get(url, {
        proxy: {
            protocol: 'http', host: proxy.split(':')[0], port: parseInt(proxy.split(':')[1]), auth: {
                username: proxy.split(':')[2], password: proxy.split(':')[3]
            }
        }
    });
    return axiosResponse;
}

module.exports = {
    getAllExchanges,
    getCentralizedExchanges,
    getCoingeckoCurrencies,
    getExchangesWithCurrencies,
    getExchangesWithVolumes,
    getTradedCurrencies,
    mapCurrencies,
    filterExchangesByUniswap,
    filterExchangesByTraded
}