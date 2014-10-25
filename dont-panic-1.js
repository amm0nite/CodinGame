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

var i = 0;
var zones = [];

var test = 0;

for (i = 0; i < nbFloors; i++) {
    var zone = {};
    zone.niv = i;
    zone.pos = 0;
    zone.done = false;
    zones.push(zone);
    test++;
}

for (i = 0; i < nbElevators; i++) {
    var inputs = readline().split(' ');
    var elevatorFloor = parseInt(inputs[0]); // floor on which this elevator is found
    var elevatorPos = parseInt(inputs[1]); // position of the elevator on its floor
    
    var zone = zones[elevatorFloor];
    zone.pos = elevatorPos;
}

zones[exitFloor].pos = exitPos;

function dumpZone(zone) {
    printErr(zone.niv+" pos="+zone.pos+"\n");
}
function dumpZones() {
    for (i = 0 ; i < zones.length; i++) {
        dumpZone(zones[i]);
    }
}

zones.donize = function(zone, clone) {
    if (clone.pos == zone.pos) {
        zone.done = true;
    }
}

zones.action = function(zone, clone) {
    var elevatorPos = zone.pos;
    if (!zone.done) {
        if (clone.pos > elevatorPos && clone.dir == 'RIGHT') {
            return 'BLOCK';
        }
        else if (clone.pos < elevatorPos && clone.dir == 'LEFT') {
            return 'BLOCK';
        }
    }
    return 'WAIT';
};

// game loop
while (true) {
    var inputs = readline().split(' ');
    var cloneFloor = parseInt(inputs[0]); // floor of the leading clone
    var clonePos = parseInt(inputs[1]); // position of the leading clone on its floor
    var direction = inputs[2]; // direction of the leading clone: LEFT or RIGHT

    var result = 'WAIT';

    if (clonePos != -1) {
        var myClone = {};
        myClone.pos = clonePos;
        myClone.dir = direction;
        myClone.niv = cloneFloor;
    
        var myZone = zones[myClone.niv];
        
        zones.donize(myZone, myClone);
        result = zones.action(myZone, myClone);
    }
    print(result);
}