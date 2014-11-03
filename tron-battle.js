/**
 * Auto-generated code below aims at helping you parse
 * the standard input according to the problem statement.
 **/

var choice = 'LEFT';
var players = [];
var me = {};
me.direction = null;

// techniques
// eviter le carré formé par position de depart et position courante
// jouer x coups en avance pour ne pas être piégé
// avoir des destination avec pathfinding de distance

var directions = {
    'UP':    {'str':'UP',    'x':0, 'y':-1},
    'DOWN':  {'str':'DOWN',  'x':0, 'y':1 },
    'LEFT':  {'str':'LEFT',  'x':-1,'y':0 },
    'RIGHT': {'str':'RIGHT', 'x':1, 'y':0 }
}

var _inputs = function() {
	var pj = null;

	var inputs = readline().split(' ');
    var N = parseInt(inputs[0]); // total number of players (2 to 4).
    var P = parseInt(inputs[1]); // your player number (0 to 3).
    for (var i = 0; i < N; i++) {
        var inputs = readline().split(' ');
        var X0 = parseInt(inputs[0]); // starting X coordinate of lightcycle (or -1)
        var Y0 = parseInt(inputs[1]); // starting Y coordinate of lightcycle (or -1)
        var X1 = parseInt(inputs[2]); // starting X coordinate of lightcycle (can be the same as X0 if you play before this player)
        var Y1 = parseInt(inputs[3]); // starting Y coordinate of lightcycle (can be the same as Y0 if you play before this player)
        
		if (!players[i]) {
			pj = {};
			pj.id = i;
			pj.track = [];
			players[i] = pj;
		}
		pj = players[i];
        pj.x = X1;
        pj.y = Y1;
        pj.track.push([X1,Y1]);
        if (pj.x == -1 || pj.y == -1) {
            pj.track = [];
        }
        
        if (i == P) {
            me.player = pj;
            me.startx = pj.x;
            me.starty = pj.y;
        }
    }
};

var _valid_directions = function() {
	var str = '';
	var dir = null;
	var nx = 0;
	var ny = 0;
	var result = [];
	
	for (str in directions) {
		dir = directions[str];
		
		if (me.direction) {
    		if (str == me.direction.str) {
    			continue;
    		}
    		
    		if ((me.direction.x + dir.x) == 0) {
    		    continue;
    		}
    		if ((me.direction.y + dir.y) == 0) {
    		    continue;
    		}
		}
		
		nx = me.player.x + dir.x;
		ny = me.player.y + dir.y;
		//0 ≤ X0, X1 < 30
		//0 ≤ Y0, Y1 < 20
		if (nx < 0 || nx >= 30 || ny < 0 || ny >= 20) {
			continue;
		}
		if (_player_collision(nx, ny)) {
		    continue;
		}

		result.push(dir);
	}
	
	return result;
};

var _random_from_array = function(arr) {
	var rand = Math.floor((Math.random() * arr.length));
	return arr[rand];
};

var _collision = function(x, y, track) {
    var i = 0;
    var point = [];
    
    for (i=0; i< track.length; i++) {
        point = track[i];
        if (x == point[0] && y == point[1]) {
            return true;
        }
    }
    
    return false;
};

var _player_collision = function(x, y) {
    var i = 0;
    var player = null;
    
    for (i=0; i<players.length; i++) {
        var player = players[i];
        if (_collision(x, y, player.track)) {
            return true;
        }
    }
    
    return false;
};

var _count_space = function(x, y) {
    var i = 0;
    var j = 0;
    var spaces = 0;
    
    for (i = -1; i <= 1; i++) {
        for (j = -1;j <= 1; j++) {
            if (!_player_collision(x+i, y+j)) {
                spaces++
            }
        }
    }
    
    return spaces;
};

var _best_spaces = function(dirs) {
    var max = 0;
    var i = 0;
    var dir = null;
    var nx = 0;
    var ny = 0;
    var spaces = 0;
    var best = null;
    
    for (i in dirs) {
        dir = dirs[i];
        nx = me.player.x + dir.x;
        ny = me.player.y + dir.y;
        spaces = _count_space(nx, ny);
        if (spaces >= max) {
            max = spaces;
            best = dir;
        }
    }
    
    return best;
};

// game loop
while (true) {
    _inputs();
    choice = _best_spaces(_valid_directions());
	me.direction = choice;
    print(choice.str);
}