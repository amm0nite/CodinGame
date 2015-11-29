var inputs = readline().split(' ');
var width = parseInt(inputs[0]); // width of the firewall grid
var height = parseInt(inputs[1]); // height of the firewall grid

printErr(width)
printErr("----")
printErr(height)
printErr("\n")

function _dump(tab) {
    for (var i=0; i<width; i++) {
        for (var j=0; j<height; j++) {
            printErr(i+","+j+"=>"+tab[i][j]);
            printErr(", ");
        }
        printErr("\n");
    }
}

function _initVector() {
    var tab = [];
    for (var i=0; i<width; i++) {
        if (!tab[i]) {
            tab[i] = [];
        }
        for (var j=0; j<height; j++) {
            tab[i][j] = false;
        }
    }
    return tab;
}

var time = 0;
var last = -10;
var targets = _initVector();
var walls = _initVector();
var bombDone = _initVector();
var bombingDates = _initVector();

for (var i = 0; i < height; i++) { // FUCKING AXE INVERSé
    var mapRow = readline(); // one line of the firewall grid
    for (var j=0; j<mapRow.length; j++) {
        var char = mapRow.charAt(j);
        if (char == '@') {
            targets[j][i] = true;
        }
        else if (char == '#') {
            walls[j][i] = true;
        }
    }
}

function _findBombingSites(tx, ty) {
    var sites = _initVector();
    
    // verticalement
    for (var i=1; i<4; i++) {
        var nx = tx;
        var ny = ty + i;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || walls[nx][ny]) {
            break;
        }
        sites[nx][ny] = true;
    }
    for (var i=1; i<4; i++) {
        var nx = tx;
        var ny = ty - i;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || walls[nx][ny]) {
            break;
        }
        sites[nx][ny] = true;
    }
    // horizontalement
    for (var i=1; i<4; i++) {
        var nx = tx + i;
        var ny = ty;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || walls[nx][ny]) {
            break;
        }
        sites[nx][ny] = true;
    }
    for (var i=1; i<4; i++) {
        var nx = tx - i;
        var ny = ty;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || walls[nx][ny]) {
            break;
        }
        sites[nx][ny] = true;
    }
    
    // filtrage dans bestsite
    return sites;
}

function _siteEntities(sx, sy) {
    var list = [];
    var tx = sx;
    var ty = sy;
        
    // verticalement
    for (var i=1; i<4; i++) {
        var nx = tx;
        var ny = ty + i;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || walls[nx][ny]) {
            break;
        }
        if (targets[nx][ny] && !bombDone[nx][ny]) {
            list.push([nx, ny]);
        }
    }
    for (var i=1; i<4; i++) {
        var nx = tx;
        var ny = ty - i;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || walls[nx][ny]) {
            break;
        }
        if (targets[nx][ny] && !bombDone[nx][ny]) {
            list.push([nx, ny]);
        }
    }
    // horizontalement
    for (var i=1; i<4; i++) {
        var nx = tx + i;
        var ny = ty;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || walls[nx][ny]) {
            break;
        }
        if (targets[nx][ny] && !bombDone[nx][ny]) {
            list.push([nx, ny]);
        }
    }
    for (var i=1; i<4; i++) {
        var nx = tx - i;
        var ny = ty;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height || walls[nx][ny]) {
            break;
        }
        if (targets[nx][ny] && !bombDone[nx][ny]) {
            list.push([nx, ny]);
        }
    }
    
    return list;
}

function _mergeSites(s1, s2) {
    var site = _initVector();
    for (var i=0; i<width; i++) {
        for (var j=0; j<height; j++) {
            site[i][j] = (s1[i][j] || s2[i][j]);
        }
    }
    return site;
}

function _bestSite(sites) {
    var mindist = 1000;
    var max = 0;
    var best = null;
    for (var i=0; i<width; i++) {
        for (var j=0; j<width; j++) {
            if (sites[i][j] && !targets[i][j]) { // ameliorer detection dispariotion bombe
                var ents = _siteEntities(i, j);
                var cc = ents.length;
                if (cc >= max) {
                    max = cc;
                    best = [i, j];
                }
            }
        }
    }
    return best;
}

// chercher les meilleurs emplacement de bombs
// a partir d'une cible, trouver toutes les positions de bombe
// qui font mouche
// l'endroit le meilleur implique le max d'autres cibles/bombes

// game loop
while (true) {
    var inputs = readline().split(' ');
    var rounds = parseInt(inputs[0]); // number of rounds left before the end of the game
    var bombs = parseInt(inputs[1]); // number of bombs left

    // Write an action using print()
    // To debug: printErr('Debug messages...');
    
    time++;
    var sites = _initVector();
    
    for (var i=0; i<width; i++) {
        for (var j=0; j<height; j++) {
            //expired targets
            if (bombingDates[i][j] && targets[i][j]) {
                var date = bombingDates[i][j];
                if ((time - date) >= 3) {
                    targets[i][j] = false;
                }
            }
            
            //bombing sites
            if (targets[i][j] && !bombDone[i][j]) {
                var temps = _findBombingSites(i, j);
                sites = _mergeSites(sites, temps);
            }
        }
    }
    
    if (last > 0 && rounds > (bombs * 4)) {
       print("WAIT");
    }
    else if (sites.length > 0) {
        var best = _bestSite(sites);
        if (best) {
            var entities = _siteEntities(best[0], best[1])
            for (index in entities) {
                var e = entities[index];
                if (targets[e[0]][e[1]]) {
                    bombDone[e[0]][e[1]] = true;
                    bombingDates[e[0]][e[1]] = time;
                }
            }
            last = time;
            print(best[0]+' '+best[1]);
        }
        else {
            print("WAIT");
        }
    }
    else {
        print("WAIT");
    }
}