'use strict';

module.exports = {

    extends: 'lighthouse:default',

    passes: [{
        passName: 'defaultPass',
        gatherers: [
            'card-gatherer',
            'api_taller1.1-gatherer'
        ]
    }],

    audits: [
        'card-audit','api_taller1.1-audit'
    ],

    categories: {
        ratp_pwa: {
            name: 'Ratp pwa metrics',
            description: 'Metrics for the ratp timetable site',
            audits: [
                {id: 'card-audit', weight: 1},
                {id: 'api_taller1.1-audit', weight: 1}
            ]
        }
    }
};