'use strict';

function pollEvents(currentEventPortals, maxPortals, xMax, xMin, yMax, yMin) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', "https://account.altvr.com/api/home/recommended");
    xhr.withCredentials = true;
    xhr.onreadystatechange = function(e) {
        if (this.readyState === XMLHttpRequest.DONE) {
            var response = JSON.parse(this.response);
            var sids = response.items.map(function(el) { return el.item.space.space_sid; });
            var currentSids = Object.keys(currentEventPortals);

            for (var sid of currentSids) {
                if (sids.includes(sid)) continue;

                var anchor = document.getElementById("anchor");
                anchor.removeChild(currentEventPortals[sid]);
                delete currentEventPortals[sid];
            }

            for (var i = 0; i < maxPortals; i++) {
                if (!sids[i]) break;

                var result = calculatePortalPositionAndRotation(i, maxPortals, xMax, xMin, yMax, yMin);
                var position = result[0];
                var rotation = result[1];

                var existingPortal = currentEventPortals[sids[i]];
                if (existingPortal) {
                    existingPortal.setAttribute("position", position);
                    existingPortal.setAttribute("rotation", rotation);
                    continue;
                }

                var newPortal = document.createElement("a-entity");
                newPortal.setAttribute("n-portal", "targetSpace: " + sids[i]);
                newPortal.setAttribute("position", position);
                newPortal.setAttribute("rotation", rotation);

                var eventTitle = document.createElement("a-entity");
                eventTitle.setAttribute("n-text", "text: " + response.items[i].item.name + "; fontSize: 2; width: 2;");
                eventTitle.setAttribute("position", "0 0.3 0");
                newPortal.appendChild(eventTitle);

                currentEventPortals[sids[i]] = newPortal;
                document.getElementById("anchor").appendChild(newPortal);
            }
        }
    };
    xhr.send();

    window.setTimeout(pollEvents, 5 * 60 * 1000, currentEventPortals, maxPortals, xMax, xMin, yMax, yMin);
}

function calculatePortalPositionAndRotation(i, maxPortals, xMax, xMin, yMax, yMin) {
    var xPos = i / maxPortals * (xMax + Math.abs(xMin)) + xMin;
    var yPos = i / maxPortals * (yMax + Math.abs(yMin)) + yMin;

    var position = xPos + " 0.5 " + yPos;
    var rotation = "0 0 0";
    return [position, rotation];
}

AFRAME.registerComponent('event-portals', {
    schema: {
        maxPortals: {
            type: 'int',
            default: 7,
        },
        xMax: {
            type: 'number',
            default: 10,
        },
        xMin: {
            type: 'number',
            default: -10,
        },
        yMax: {
            type: 'number',
            default: 10,
        },
        yMin: {
            type: 'number',
            default: -10,
        },
    },
    init: function() {
        this.currentEventPortals = {};
        pollEvents(this.currentEventPortals, this.data.maxPortals, this.data.xMax, this.data.xMin, this.data.yMax, this.data.yMin);
    }
});
