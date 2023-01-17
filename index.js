'use strict';
const axios = require('axios').create({baseURL: 'https://api.coingecko.com/api/v3'});
const fs = require('fs');
const proxyRotator = require('./proxyRotator.js');

const getAllExchanges = async () => {
    let allExchanges = [];
    let proxy = proxyRotator.getProxy();
    await axios.get("/exchanges/list", {
        proxy: {
            protocol: 'http',
            host: proxy.split(':')[0],
            port: parseInt(proxy.split(':')[1]),
            auth: {
                username: proxy.split(':')[2],
                password: proxy.split(':')[3]
            }
        }
    }).then(function (response) {
        allExchanges = response.data;
    });

    fs.writeFileSync("allExchanges.json", JSON.stringify(allExchanges));

    return allExchanges;
};

const getCentralizedExchanges = async (allExchanges) => {
    let centralizedExchanges = [];
    console.log(allExchanges.length);
    let i = 0;
    for (let exchange of allExchanges) {
        console.log(i);
        i++;
        let proxy = proxyRotator.getProxy();
        console.log(proxy);
        await axios.get(`/exchanges/${exchange["id"]}`, {
            proxy: {
                protocol: 'http',
                host: proxy.split(':')[0],
                port: parseInt(proxy.split(':')[1]),
                auth: {
                    username: proxy.split(':')[2],
                    password: proxy.split(':')[3]
                }
            }
        }).then(function (response) {
            if (response.data["centralized"] === true) centralizedExchanges.push(exchange);
        });
    }

    fs.writeFileSync("centralizedExchanges.json", JSON.stringify(centralizedExchanges));

    return centralizedExchanges;
};

const getCoingeckoCurrencies = async () => {
    let allCurrencies = [];
    let proxy = proxyRotator.getProxy();
    await axios.get("/coins/list?include_platform=true", {
        proxy: {
            protocol: 'http',
            host: proxy.split(':')[0],
            port: parseInt(proxy.split(':')[1]),
            auth: {
                username: proxy.split(':')[2],
                password: proxy.split(':')[3]
            }
        }
    }).then(function (response) {
        allCurrencies = response.data;
    });

    fs.writeFileSync("allCurrencies.json", JSON.stringify(allCurrencies));

    return allCurrencies;
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

    fs.writeFileSync("currenciesWithIdentifiers.json",JSON.stringify(currenciesWithIdentifiers));
    return currenciesWithIdentifiers;
}

(async function () {
    // let allExchanges = await getAllExchanges();
    // let centalizedExchanges = await getCentralizedExchanges(allExchanges);
    // let coingeckoCurrencies = await getCoingeckoCurrencies();
    // let uniswapCurrencies = require('./uniswapCurrency.json');
    // let currenciesWithIdentifiers = mapCurrencies(coingeckoCurrencies, uniswapCurrencies);

    let centralizedExchanges = require('./centralizedExchanges.json');
    let coingeckoCurrencies = require('./allCurrencies.json');
    let uniswapCurrencies = require('./uniswapCurrency.json');
    let currenciesWithIdentifiers = mapCurrencies(coingeckoCurrencies, uniswapCurrencies);
    //console.log(uniswapCurrencies[778]["exchangeCurrencies"][0]["exchangeTicker"]);
})();