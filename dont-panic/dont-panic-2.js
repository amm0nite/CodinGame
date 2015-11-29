/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

var inputs = readline().split(' ');
var nbFloors = parseInt(inputs[0]); // number of floors
var width = parseInt(inputs[1]); // width of the area
var nbRounds = parseInt(inputs[2]); // maximum number of rounds
var exitFloor = parseInt(inputs[3]); // floor on which the exit is found
var exitPos = parseInt(inputs[4]); // position of the exit on its floor
var nbTotalClones = parseInt(inputs[5]); // number of generated clones
var nbAdditionalElevators = parseInt(inputs[6]); // ignore (always zero)
var nbElevators = parseInt(inputs[7]); // number of elevators

var k = 0;
var zones = [];

var test = 0;

for (k = 0; k < nbFloors; k++) {
    if (k <= exitFloor) {
        var zone = {};
        zone.elevators = [];
        zone.niv = k;
        zone.pos = -1;
        zone.done = false;
        zone.bks = 0;
        zone.dst = 0;
        zone.ovr = false;
        zones.push(zone);
        test++;
    }
}

for (k = 0; k < nbElevators; k++) {
    var inputs = readline().split(' ');
    var elevatorFloor = parseInt(inputs[0]); // floor on which this elevator is found
    var elevatorPos = parseInt(inputs[1]); // position of the elevator on its floor
    
    var zone = zones[elevatorFloor];
    zone.elevators.push(elevatorPos);
}

zones[exitFloor].pos = exitPos;

function getRemaining() {
    var i = 0;
    var remaining = nbAdditionalElevators;
    for (i = 0; i< zones.length; i++)  {
       var zo = zones[i];
       if (zo.pos == -1 || zo.ovr) {
           remaining--;
       }
    }
    return remaining;
}

function extraElevators() {
    var i = 0;
    var previous = null;
   
   for (i = 0; i< zones.length; i++)  {
       var zo = zones[i];
       if (zo.pos != -1) {
           var from = firstPos;
           if (previous) {
               from = previous.pos;
           }
           var distance = Math.abs(zo.pos - from);
           zo.dst = distance;
       }
       previous = zo;
   }
   
   var zonesByDistDesc = zones.slice(0, -1).sort(function(a, b) {
       return b.dst - a.dst; 
   });
   
   var remaining = getRemaining();
   printErr("remaining "+remaining);
   
   if (remaining > 0) {
       for (i = 0; i < zonesByDistDesc.length; i++) {
           var ovrzone = zonesByDistDesc[i];
           if (!ovrzone.ovr) {
                ovrzone.ovr = true;
               var from = firstPos;
               var beforeovr = zones[ovrzone.niv - 1];
               if (beforeovr) {
                   from = beforeovr.pos;
               }
               ovrzone.pos = from;
               elevatorFilter(ovrzone.niv + 1); 
               break;
           }
       }
       extraElevators();
   }
}

function elevatorFilter(offset) {
    var i = 0;
    var j = 0;
    
    if (!offset) {
        offset = 0;
    }
    for (i = offset; i< zones.length; i++)  {
        var zone = zones[i];
        var previousZone = zones[i - 1];
        
        for (j = 0; j < zone.elevators.length; j++) {
            var elevatorPos = zone.elevators[j];
            if (zone.pos == -1) {
                zone.pos = elevatorPos;
            }
            else {
                var reference = exitPos;
                if (previousZone) {
                    reference = previousZone.pos;
                }
                
                var distance1 = Math.abs(reference - zone.pos);
                var distance2 = Math.abs(reference - elevatorPos);
                if (distance2 < distance1) {
                    zone.pos = elevatorPos;
                }
            }
        }
    }
}

function dumpZone(zone) {
    printErr(zone.niv+" pos="+zone.pos+" dst="+zone.dst+" ovr="+zone.ovr+"\n");
}
function dumpZones() {
    var i = 0;
    for (i = 0 ; i < zones.length; i++) {
        dumpZone(zones[i]);
    }
}

zones.donize = function(clone) {
    var zone = zones[clone.niv];
    if (clone.pos == zone.pos && !zone.ovr) {
        zone.done = true;
    }
}

zones.action = function(clone) {
    var zone = zones[clone.niv];
    var elevatorPos = zone.pos;
    var previousZone = zones[zone.niv - 1];
    
    if (!zone.done) {
        if (elevatorPos == -1 || zone.ovr) {
            zone.pos = clone.pos;
            if (zone.ovr) {
                zone.done;
                zone.ovr = false;
            }
            return 'ELEVATOR';
        }
        if (clone.pos > elevatorPos && clone.dir == 'RIGHT') {
            zone.bks++;
            return 'BLOCK';
        }
        if (clone.pos < elevatorPos && clone.dir == 'LEFT') {
            zone.bks++;
            return 'BLOCK';
        }
    }
    
    return 'WAIT';
};

var initiated = false;
var firstPos = -1;

// game loop
while (true) {
    var inputs = readline().split(' ');
    var cloneFloor = parseInt(inputs[0]); // floor of the leading clone
    var clonePos = parseInt(inputs[1]); // position of the leading clone on its floor
    var direction = inputs[2]; // direction of the leading clone: LEFT or RIGHT

    if (firstPos == -1 && clonePos != -1) {
        firstPos = clonePos;
    }

    if (!initiated && firstPos != -1) {
        elevatorFilter();
        extraElevators(); 
        initiated = true;
    }
    
    dumpZones();
    
    var result = 'WAIT';

    if (clonePos != -1) {
        var myClone = {};
        myClone.pos = clonePos;
        myClone.dir = direction;
        myClone.niv = cloneFloor;
    
        zones.donize(myClone);
        result = zones.action(myClone);
    }
    print(result);
}