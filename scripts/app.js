(function () {
    'use strict';
   

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container')

    };

    localforage.config({
        driver: localforage.IndexedDB,
        name: 'taller1'
    });


    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {


        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});
        savePreferences(key,label);
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a timestation card with the latest weather forecast. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            window.cardLoadTime = performance.now();
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/


    app.getSchedule = function (key, label) {
        var result;
        var response =  getFromCache(key).then((cache)=>{
            if(cache != null){
                result = mapping(cache,key,label);
                app.updateTimetableCard(result);
            }
        });       
     

        var url = 'https://api-ratp.pierre-grimaud.fr/v4/schedules/' + key;

        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    window.apiResponseTime = performance.now();                   
                    var response = JSON.parse(request.response);
                    var result = mapping(response,key,label);
                    app.updateTimetableCard(result);
                }
            } else {
                // Return the initial weather forecast since no data is available.
                app.updateTimetableCard(initialStationTimetable);
            }
        };
        request.open('GET', url);
        request.send();
    };

    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function () {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
            app.getSchedule(key);
        });
    };

    /*
     * Fake timetable data that is presented when the user first uses the app,
     * or when the user has not saved any stations. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {

        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2017-07-18T17:08:42+02:00',
        schedules: [
            {
                message: '0 mn'
            },
            {
                message: '2 mn'
            },
            {

                message: '5 mn'
            }
        ]


    };

    function mapping(response,key,label){
        var result = {};
        result.key = key;
        result.label = label;
        result.created = response._metadata.date;
        result.schedules = response.result.schedules;
        return result;
    }
    /************************************************************************
     *
     * Code required to start the app
     *
     * NOTE: To simplify this codelab, we've used localStorage.
     *   localStorage is a synchronous API and has serious performance
     *   implications. It should not be used in production applications!
     *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
     *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
     ************************************************************************/

    function initLoad(){
        app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense');
        app.selectedTimetables = [
            {key: initialStationTimetable.key, label: initialStationTimetable.label}
        ];
        savePreferences();
    }
  
    function savePreferences(){
            localforage.setItem('preferencias',JSON.stringify(app.selectedTimetables)).then(function(value){
                console.log('ok save preferencias'+JSON.stringify(app.selectedTimetables));
        });
    }
 
    localforage.getItem('preferencias').then(function(value) {
        
        app.selectedTimetables = value;
        
        if (app.selectedTimetables) {
            app.selectedTimetables = JSON.parse(app.selectedTimetables);
            app.selectedTimetables.forEach(function(timetable) {
                app.getSchedule( timetable.key, timetable.label);
            });
        } else {
            initLoad();
        }
    }).catch(function (err) {
        console.log('errrorr'+err);
        initLoad();
    });


    
    function getFromCache(value) {       
    if ('caches' in window) {
      var url = 'https://api-ratp.pierre-grimaud.fr/v4/schedules/' + value;
      return caches.match(url)
          .then((response) => {
            if (response) {
              return response.json();
            }
            return null;
          })
          .catch((err) => {
            console.error('Error getting data from cache', err);
            return null;
          });
        }
      }
})();
