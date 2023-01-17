'use strict';
const fs = require('fs');

const proxies = fs.readFileSync("./proxies/ips-data_center.txt", "utf-8").toString().split('\n');

const getProxy = () => {
    const i = getRandomInt(1000);
    //console.log(proxies[i]);
    return proxies[i];
};

const getRandomInt = (max) => Math.floor(Math.random() * max);

module.exports = {
    getProxy
}
