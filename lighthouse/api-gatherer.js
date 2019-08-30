'use strict';

const Gatherer = require('lighthouse').Gatherer;

class TimeApi extends Gatherer {
    afterPass(options) {
        const driver = options.driver;

        return driver.evaluateAsync('window.responseApi')
            .then(responseTime => {
                if (!responseTime) {

                    throw new Error('Unable to find api metrics in page');
                }
                return responseTime;
            });
    }
}

module.exports = TimeApi;
