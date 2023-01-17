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

    fs.writeFileSync("allExchanges.txt", JSON.stringify(allExchanges));

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

    fs.writeFileSync("centralizedExchanges.txt", JSON.stringify(centralizedExchanges));

    return centralizedExchanges;
};

const getUniswapCurrencies = () => {
    return JSON.parse(fs.readFileSync("uniswapCurrency.txt", "utf8"));
}

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

    fs.writeFileSync("allCurrencies.txt", JSON.stringify(allCurrencies));

    return allCurrencies;
};

(async function () {
    //let allExchanges = await getAllExchanges();
    //let centalizedExchanges = getCentralizedExchanges(allExchanges);

    // let allCoingeckoCurrencies = getCoingeckoCurrencies();
    //console.log(getUniswapCurrencies()[778]["exchangeCurrencies"][0]["exchangeTicker"]);

})();