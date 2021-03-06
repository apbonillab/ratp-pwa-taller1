'use strict';

const Audit = require('lighthouse').Audit;

const RESPONSE_MAX_API = 3000;

class LoadAudits extends Audit {
    static get meta() {
        return {
            category: 'MyPerformance',
            name: 'api-audit',
            description: 'Response of api',
            failureDescription: 'The api slow response',
            helpText: 'Used to measure time from navigationStart to when the first' +
            ' response time.',

            requiredArtifacts: ['TimeApi']
        };
    }

    static audit(artifacts) {
        const response = artifacts.TimeApi;
        const belowThreshold = response <= RESPONSE_MAX_API;

        return {
            rawValue: response,
            score: belowThreshold
        };
    }
}

module.exports = LoadAudits;
