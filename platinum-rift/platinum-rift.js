var _in_array = function(needle, haystack) {
	for (var i=0; i<haystack.length; i++) {
		if (haystack[i] == needle) {
			return i;
		}
	}
	return -1;
};

var global = {};
global.time = 0;
var map = {};

var _lands = function() {
	var analyze = JSON.parse(JSON.stringify(map));
	var lands = [];

	while (Object.keys(analyze).length > 0) {
		
		var originIndex = Object.keys(analyze).pop();
		var origin = analyze[originIndex];

		var frontier = [];
		frontier.push(origin);
		var seen = {};
		seen[origin.id] = true;
		
		var current = null;
		var neighbourId = undefined;

		var currentLand = [];

		while (frontier.length > 0) {
			current = frontier.shift();
			currentLand.push(current.id);
			delete analyze[current.id];
			
			for (var i=0; i<current.links.length; i++) {
				neighbourId = current.links[i];
				if (!seen.hasOwnProperty(neighbourId)) {
					frontier.push(analyze[neighbourId]);
					seen[neighbourId] = true;
				}
			}
		}

		lands.push(currentLand);
	}

	return lands;
};

var _clusters = function() {
	var clusters = [];
	
	//collect
	(function() {
		var center = null;
		var neighbour = null;
		var prod = 0;
		var size = 0;
		var zones = [];

		for (var i in map) {
			center = map[i];
			zones = [];
			size = 0;
			prod = center.source;

			if (center.source > 0) {
				size++;
				zones.push(center.id);
			}
			for (var j=0; j<center.links.length; j++) {
				neighbour = map[center.links[j]];
				if (neighbour.source > 0) {
					size++;
					zones.push(neighbour.id);
				}
				prod += neighbour.source;
			}

			clusters.push({
				'node':center.id,
				'source':prod,
				'size':size,
				'zones':zones
			});
		}
	})();

	//sort
	clusters.sort(function(a, b) {
		return b.source - a.source;
	});

	//filter
	clusters = (function() {
		var clusterSelection = [];
		var current = null;
		var fromSelection = null;
		var touching = false;

		for (var i in clusters) {
			current = clusters[i];
			touching = false;

			for (var j in clusterSelection) {
				fromSelection = clusterSelection[j];
				touching = (function() {
					var currentNode = map[current.node];
					var fromSelectionNode = map[fromSelection.node];
					
					var nodes1 = [];
					var nodes2 = [];

					nodes1.push(current.node);
					nodes2.push(fromSelection.node);
					Array.prototype.push.apply(nodes1, currentNode.links);
					Array.prototype.push.apply(nodes2, fromSelectionNode.links);

					for (var i in nodes1) {
						for (var j in nodes2) {
							if (nodes1[i] == nodes2[j]) {
								return true;
							}
						}
					}
					return false;
				})();
				if (touching) {
					break;
				}
			}

			if (!touching) {
				clusterSelection.push(current);
			}
		}
		return clusterSelection;
	})();
	
	//sort
	clusters.sort(function(a, b) {
		return b.source - a.source;
	});

	return clusters;
};

(function() {
	var start = dateNow();

    var inputs = readline().split(' ');
    var playerCount = parseInt(inputs[0]); // the amount of players (2 to 4)
    var myId = parseInt(inputs[1]); // my player ID (0, 1, 2 or 3)
    var zoneCount = parseInt(inputs[2]); // the amount of zones on the map
    var linkCount = parseInt(inputs[3]); // the amount of links between all zones
    
    for (var i = 0; i < zoneCount; i++) {
        var inputs = readline().split(' ');
        var zoneId = parseInt(inputs[0]); // this zone's ID (between 0 and zoneCount-1)
        var platinumSource = parseInt(inputs[1]); // the amount of Platinum this zone can provide per game turn

        if (!map[zoneId]) {
            map[zoneId] = {};
        }

        map[zoneId].id = zoneId;
        map[zoneId].source = platinumSource;
        map[zoneId].links = [];
        map[zoneId].pods = {};
    }
    
    for (var i = 0; i < linkCount; i++) {
        var inputs = readline().split(' ');
        var zone1 = parseInt(inputs[0]);
        var zone2 = parseInt(inputs[1]);

        if (_in_array(zone2, map[zone1].links) == -1) {
            map[zone1].links.push(zone2);
        }
        if (_in_array(zone1, map[zone2].links) == -1) {
            map[zone2].links.push(zone1);
        }
    }
    
    global.id = myId;
    global.playerCount = playerCount;
    global.zoneCount = zoneCount;
    
    global.lands = _lands();
    global.clusters = _clusters();
    
    /*
    for (var i in global.lands) {
		printErr("land "+global.lands[i].length+" => "+global.lands[i].join(' ')+"\n");
	}
    for (var i in global.clusters) {
		printErr("cluster "+global.clusters[i].node+" => "+global.clusters[i].source+" ("+global.clusters[i].size+") => "+global.clusters[i].zones.join(' ')+"\n");
	}
	*/

    var end = dateNow();
    printErr(end - start);
    printErr("\n");
})();

var _init = function() {
    var platinum = parseInt(readline()); // my available Platinum
    
    for (var i = 0; i < global.zoneCount; i++) {
        var inputs = readline().split(' ');
        var zId = parseInt(inputs[0]); // this zone's ID
        var ownerId = parseInt(inputs[1]); // the player who owns this zone (-1 otherwise)
        var podsP0 = parseInt(inputs[2]); // player 0's PODs on this zone
        var podsP1 = parseInt(inputs[3]); // player 1's PODs on this zone
        var podsP2 = parseInt(inputs[4]); // player 2's PODs on this zone (always 0 for a two player game)
        var podsP3 = parseInt(inputs[5]); // player 3's PODs on this zone (always 0 for a two or three player game)

        map[zId].owner = ownerId;
        map[zId].pods[0] = podsP0;
        map[zId].pods[1] = podsP1;
        map[zId].pods[2] = podsP2;
        map[zId].pods[3] = podsP3;
    }

    global.platinum = platinum;
};

var _groups = function() {
	var i = 0;
	var qty = 0;
	var node = null;
	var group = null;
	var result = {};

	for (i in map) {
		node = map[i];
		qty = node.pods[global.id];
		if (qty > 0) {
			group = {};
			group.node = node.id;
			group.size = qty;

			group.enemies = 0;
			group.enemies += node.pods[0];
			group.enemies += node.pods[1];
			group.enemies += node.pods[2];
			group.enemies += node.pods[3];
			group.enemies -= node.pods[global.id];

			group.destination = -1;
			group.trailpos = 2000;

			group.split = false;

			result[node.id] = group;
		}
	}

	return result;
};

var _groups_movement = function(groups) {
	var moves = [];
	var start = dateNow();

	var movementLoop = function(movementFunction) {
		var group = null;
		var movements = null;
		
		for (var i in groups) {
			group = groups[i];
			if (group.destination == -1 && group.enemies == 0) {
				movements = movementFunction(group, groups);
				
				if (movements.length == 1) {
					//move (enable follow)
					group.destination = movements[0].destination;
					group.trailpos = movements[0].trailpos;
				}
				else if (movements.length > 1) {
					//split (disable follow)
					group.destination = 1000;
					group.trailpos = 1000;
				}

				for (var j in movements) {
					//printErr(group.node+" moves "+movements[j].size+" pods to "+movements[j].destination+" for "+movements[j].type+" ("+group.trailpos+") ["+(dateNow() - start)+"]\n");
					moves.push(movements[j].size+" "+group.node+" "+movements[j].destination);
				}
			}
		}
	};

	movementLoop(_group_movement_priority_source);
	movementLoop(_group_movement_follow);
	movementLoop(_group_movement_pathfinding_source);

	movementLoop(_group_movement_priority_all);
	movementLoop(_group_movement_follow);
	movementLoop(_group_movement_pathfinding_all);

	movementLoop(_group_movement_random);

	if (moves.length > 0) {
		return moves.join(' ');
	}
	return 'WAIT';
};

var _group_movement_priority_source = function (group, groups) {
	return _group_movement_priority(group, groups, true);
};
var _group_movement_priority_all = function (group, groups) {
	return _group_movement_priority(group, groups, false);
};

var _group_movement_priority = function(group, groups, withSource) {
	var movements = [];
	var move = null;
	
	var node = map[group.node];	
	var dest = null;
	var priorities = [];
	
	var max = -1;
	var highestPriority = null;

	for (var i=0; i<node.links.length; i++) {
		dest = map[node.links[i]];

		if (dest.owner != global.id && (!withSource || dest.source > 0)) {
			// enemy or neutral neighbour
			priorities.push(dest.id);
			if (dest.source > max) {
				max = dest.source;
				highestPriority = dest.id;
			}
		}
	}

	if (priorities.length < 1) {
		return [];
	}

	priorities.sort(function(a, b) {
		return map[b].source - map[a].source;
	});

	var splitSize = Math.floor(group.size / priorities.length);
	if (splitSize < 1) {
		splitSize = 1;
	}
	var remaining = group.size;

	for (var j=0; j<priorities.length; j++) {
		if (remaining < splitSize) {
			break;
		}
			
		move = { 
			'destination':priorities[j], 
			'trailpos':0, 
			'type':(withSource) ? 'prioritySource' : 'priorityAll',
			'size':splitSize
		};
		movements.push(move);
		remaining -= splitSize;
	}
	return movements;
};

var _group_movement_follow = function(group, groups) {
	var move = null;

	var node = map[group.node];	
	var link = -1;
	var dest = null;

	var min = 1000;
	var friendlyGroup = null;
	
	for (var i=0; i<node.links.length; i++) {
		link = node.links[i];
		dest = map[link];

		if (dest.owner == global.id && groups[dest.id]) {
			friendlyGroup = groups[dest.id];
			if (friendlyGroup.trailpos < min) {
				min = friendlyGroup.trailpos;
				move = {
					'destination':friendlyGroup.node, 
					'trailpos':(friendlyGroup.trailpos + 1),
					'type':'follow',
					'size':group.size
				};
			}
		}
	}

	if (!move) {
		return [];
	}
	return [move];
};

var _group_movement_pathfinding_source = function (group, groups) {
	return _group_movement_pathfinding(group, groups, true);
};
var _group_movement_pathfinding_all = function (group, groups) {
	return _group_movement_pathfinding(group, groups, false);
};

var _group_movement_pathfinding = function (group, groups, withSource) {
	var move = null;

	var current = map[group.node];
	var next = null;
	var i = 0;
	var found = false;

	var frontier = [];
	frontier.push(current.id);
	var origin = {};
	origin[current.id] = 'start';
	
	while (frontier.length > 0) {
		current = map[frontier.shift()];
		
		// stopping
		if (current.owner != global.id) {
			if (!withSource || (withSource && current.source > 0)) {
				//printErr(group.node+" wants "+current.id+" ("+withSource+" "+current.source+")\n");
				found = true;
				break;
			}
		}

		// exploring
		for (var i=0; i<current.links.length; i++) {
			next = map[current.links[i]];
			if (!origin.hasOwnProperty(next.id)) {
				frontier.push(next.id);
				origin[next.id] = current.id;
			}
		}
	}

	if (!found) {
		return [];
	}

	var path = [];
	var step = current.id;
	while (step != group.node) {
		path.push(step);
		step = origin[step];
	}
	//printErr("path is "+path.join(' -> ')+"\n");

	move = {
		'destination':path.pop(),
		'trailpos':1000,
		'type':(withSource) ? 'pathfindingSource' : 'pathfindingAll',
		'size':group.size
	};
	return [move];
};

var _group_movement_random = function(group, groups) {
	var node = map[group.node];	
	var move = {
		'destination':node.links[Math.floor(Math.random()*node.links.length)],
		'trailpos':1000,
		'type':'random',
		'size':group.size
	};
	return [move];
};

var	_situation = function() {
	var zones = [];
	
	var node = null;
	var i = 0;
	
	for (i in map) {
		node = map[i];
		zones.push(node.id);
	}

	return zones;
};

var _select_best_neutral = function(selection) {
	// acheter dans le node le plus productif
	var node = null;
	var zones = [];

	for (var i=0; i<selection.length; i++) {
		node = map[selection[i]];
		if (node.owner == -1 && node.source > 0) {
			zones.push(node.id);
		}
	}

	zones.sort(function(a, b) {
		return map[b].source - map[a].source;
	});

	return zones;
};

var _select_best_friendly = function(selection) {
	//acheter près d'une zone enemie
	var node = null;
	var zoneEnemyData = {};
	
	var zones = [];
	var priorityZones = [];

	for (var i=0; i<selection.length; i++) {
		node = map[selection[i]];
		
		if (node.owner == global.id) {
			var enemySources = 0;
			var enemyZones = 0;
			var neighbourId = 0;

			for (var j=0; j<node.links.length; j++) {
				neighbourId = node.links[j];
				if (map[neighbourId].owner != global.id) {
					enemySources += map[neighbourId].source;
					enemyZones++;
				}
			}

			if (enemyZones > 0) {
				zones.push(node.id);
				zoneEnemyData[node.id] = (enemySources * 10) + enemyZones;
				if (enemySources > 0) {
					priorityZones.push(node.id);
				}
			}
		}
	}

	if (priorityZones.length > 0) {
		// spawn only on the one with source neighbor if there are
		zones = priorityZones;
		printErr("zones override!\n");
	}

	zones.sort(function(a, b) {
		return zoneEnemyData[b] - zoneEnemyData[a];
	});

	/*
	for (var j in zones) {
		var z = zones[j];
		printErr("zone "+z+" => "+zoneEnemyData[z]+"\n");
	}
	*/

	return zones;
};

var _select_custom_start = function(selection) {
	if (global.time != 0) {
		// only the first turn
		return [];
	}

	var zones = [];

	for (var i=0; i<selection.length; i++) {
		node = map[selection[i]];
		if (node.source > 1 && node.source < 5) {
			zones.push(node.id);
		}
	}

	zones.sort(function(a, b) {
		return map[a].source - map[b].source;
	});

	return zones;
};

var _what_continent = function(zone) {
	for (var i=0; i<global.lands.length; i++) {
		var continent = global.lands[i];
		if (_in_array(zone, continent) != -1) {
			return continent;
		}
	}
	return [];
};

var _select_cluster_start = function(selection) {
	if (global.time != 0) {
		// only the first turn
		return [];
	}

	var zones = [];
	var zone = undefined;
	var continent = [];
	var oneLand = false;

	var clusters = global.clusters;
	for (var i=0; i<clusters.length; i++) {
		var cluster = clusters[i];
		if (continent.length == 0) {
			// definition continent
			continent = _what_continent(cluster.node);
		}
		if (!oneLand || _in_array(cluster.node, continent) != -1) {
			// seulement si c'est le bon continent
			for (var j=0; j<cluster.zones.length; j++) {
				zones.push(cluster.zones[j]);
			}
		}
	}

	return zones;
};

var _select_smallest_island = function(selection) {
	if (global.playerCount < 3) {
		return [];
	}

	var lands = global.lands;
	var best = [];
	var max = 0;

	for (var i=0; i<lands.length; i++) {
		if (lands[i].length > max && lands[i].length < 10) {
			max = lands[i].length;
			best = lands[i];
		}
	}

	var enemies = 0;
	var blufor = 0;
	var redfor = 0;
	for (var i=0; i<best.length; i++) {
		if (map[best[i]].owner != global.id) {
			enemies++;
		}
		redfor += map[best[i]].pods[0];
		redfor += map[best[i]].pods[1];
		redfor += map[best[i]].pods[2];
		redfor += map[best[i]].pods[3];
		redfor -= map[best[i]].pods[global.id];
		blufor += map[best[i]].pods[global.id];
	}

	if (enemies == 0) {
		return [];
	}

	var remaining = Math.max((redfor + 1) - blufor, 0);
	var zones = [];

	var candidates = [];
	Array.prototype.push.apply(candidates, best);
	candidates.sort(function(a, b) {
		return map[b].source - map[a].source;
	});

	for (var i=0; i<candidates.length; i++) {
		if (remaining < 1) {
			break;
		}
		if (map[candidates[i]].owner == -1 || map[candidates[i]].owner == global.id) {
			zones.push(candidates[i]);
			remaining--;
		}
	}
	
	printErr("zones "+zones.join(' ')+"\n");
	return zones;
};

var _purchases = function() {
	var availablePods = Math.floor(global.platinum / 20);
	if (availablePods == 0) {
		return 'WAIT';
	}

	var selection = _situation();
	var zones = [];
	
	var purchaseSelection = function(selectFunction) {
		var selectZones = selectFunction(selection);
		Array.prototype.push.apply(zones, selectZones);
	};

	purchaseSelection(_select_smallest_island);
	purchaseSelection(_select_cluster_start);
	purchaseSelection(_select_custom_start);
	purchaseSelection(_select_best_neutral);
	purchaseSelection(_select_best_friendly);

	var purchases = [];
	var purchaseQty = 1;
	var purchaseZones = [];
	var zone = undefined;
	var node = null;

	var i=0;
	var j=0;

	for (i=0; i<availablePods; i++) {
		zone = zones.shift();
		if (typeof zone == 'undefined') {
			break;
		}
		purchaseZones.push(zone);
	}

	purchaseQty = Math.floor(availablePods / purchaseZones.length);
	for (j=0; j<purchaseZones.length; j++) {
		node = map[purchaseZones[j]];
		purchases.push(purchaseQty+" "+node.id);
	}
	
	return purchases.join(' ');
};

// TESTS
// spawn 1 in each cluster center
// spawner sur un seul continent
// se débarasser du follow maintent que pathfinding est war tested

/*
Qu'est ce qui donne les meilleures chances?
- spawn dispersé
- spawn groupé
=> faire des tests?
stratégies continent aware
- prioriser la conquete de continents?
*/

/*
Détruire activement les pods enemis est intéréssant en duel
du moment que ta prod est supérieure et que t'oublie pas de capturer
permett de gagner sans prendre le risque de se faire avoir
(detecter duel par continent?)
*/

// my pods all gather on the same zone once they've conquered a continent for a celebration party :)

// - considérer le territoire neutre comme territoire perso; spawn pour contrer spawn ou attaque
//      spawn de défense
// - [no] technique attendre le premier tour pour les matchs 3 et 4 players
// - chasser les enemis avec un groupe spécial?
// - bloquer les attaques avec spawn sur zone envahie?

// - choisir un grand contient pour le spawn initial biggest en duel, sinon smallest 
// - spawn le plus loin possible des autres joueurs (exploiter les trous)
// - privilégier les grands clusters et non les plus productifs?

// - ajouter le japon dans la capture d'ile? attaque totale japon en 4players?
// - défense de zones productrices, achat plus défensif
// - ne pas acheter pendant domination?
// - chasser, bloquer
// - tenir les petites iles pour améliorer le classement général? => jamais dernier

// [ok] ne pas faire priority sur les neutres tant que les sources du continent ne sont pas secured
// [ok] améliorer la capture d'ile : utiliser pas trop de pod et prends la grande
// [ok] pathfinding zones sans source avant random
// [ok] visez capture de petite ile en 4players
// [ok] refonte du spawn + spawn in clusters
// [ok] pathfinding pour position avec source plus prioritaire que capture neutre
// [ok] empêcher achat dans un continent pacifié
// [ok] diminuer achat random en faisant des achat stackés si le nombre de zones dispo cibles est < au nombre d'achat
// [ok] unstack une pile si plusieurs cibles prioritaire dans les voisins (splitting)
// [ok] pathfinding aprés les follow
// [ok] monitor time
// [ok] viser minimum 20 sources au début sur random sources, priorité sur les petites
// [ok] étendre les phéromones aux voisins de voisins
// [ok] commencer avec plus de 1 pour eviter le draw
// [ok] calcul de destination à la place de mouvement aléatoire (follow)

/*
http://www.tibslab.com:3000/stats/Ammonite
*/

// game loop
while (true) {
	(function() {
		var start = dateNow();

        _init();
        var groups = _groups();
        
        // movement
        var movements = 'WAIT';
        movements = _groups_movement(groups);
        print(movements);

        // purchases
		var purchases = 'WAIT';
		purchases = _purchases();
		print(purchases);

		global.time++;

		var end = dateNow();
		printErr(end - start);
		printErr("\n");
	})();
}