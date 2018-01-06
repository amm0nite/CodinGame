class Util {
    static log(str) {
        if (typeof str === 'object') {
            str = JSON.stringify(str, null, 2);
        }
        printErr(str);
    }

    static copy(struct) {
        return JSON.parse(JSON.stringify(struct));
    }

    static checkPoint(point) {
        if (!point.x && point.x !== 0) {
            throw new Error('not a point');
        }
        if (!point.y && point.y !== 0) {
            throw new Error('not a point');
        }
    }

    static checkCircle(circle) {
        Util.checkPoint(circle);
        if (!circle.radius && circle.radius !== 0) {
            throw new Error('not a circle');
        }
    }

    static checkSpeed(speed) {
        if (!speed.vx && speed.vx !== 0) {
            throw new Error('not a speed');
        }
        if (!speed.vy && speed.vy !== 0) {
            throw new Error('not a speed');
        }
    }
    
    static distance(p1, p2) {
        Util.checkPoint(p1);
        Util.checkPoint(p2);
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    static isInside(point, circle) {
        Util.checkPoint(point);
        Util.checkCircle(circle);
        return (Util.distance(point, circle) <= circle.radius);
    }

    static formatSolution(point, acc) {
        Util.checkPoint(point);
        return point.x + ' ' + point.y + ' ' + acc;
    }

    static speedNorm(speed) {
        Util.checkSpeed(speed);
        return Util.distance({x: 0, y: 0}, {x: speed.vx, y: speed.vy});
    }

    static formatSkill(point) {
        Util.checkPoint(point);
        return 'SKILL ' + point.x + ' ' + point.y;
    }
}

class Game {
    constructor() {
        
    }

    updateUnit(unit, data) {
        unit.type = data.type;
        unit.player = data.player;
        unit.mass = data.mass;
        unit.radius = data.radius;
        unit.x = data.x;
        unit.y = data.y;
        unit.vx = data.vx;
        unit.vy = data.vy;
        unit.extra = data.extra;
        unit.extra2 = data.extra2;
    }

    read() {
        this.myScore = parseInt(readline());
        this.enemyScore1 = parseInt(readline());
        this.enemyScore2 = parseInt(readline());
        this.myRage = parseInt(readline());
        this.enemyRage1 = parseInt(readline());
        this.enemyRage2 = parseInt(readline());
        this.unitCount = parseInt(readline());
        this.units = [];

        for (let i = 0; i < this.unitCount; i++) {
            let inputs = readline().split(' ');
            
            let unit = {};
            unit.id = parseInt(inputs[0]);
            unit.type = parseInt(inputs[1]);
            unit.player = parseInt(inputs[2]);
            unit.mass = parseFloat(inputs[3]);
            unit.radius = parseInt(inputs[4]);
            unit.x = parseInt(inputs[5]);
            unit.y = parseInt(inputs[6]);
            unit.vx = parseInt(inputs[7]);
            unit.vy = parseInt(inputs[8]);
            unit.extra = parseInt(inputs[9]);
            unit.extra2 = parseInt(inputs[10]);

            let existing = this.getUnit(unit.id);
            if (existing) {
                this.updateUnit(existing, unit);
            } else {
                this.units.push(unit);
            }
        }
    }

    getCenter() {
        return { x: 0, y: 0, radius: 200 };
    }

    getUnit(id) {
        return this.units.find((unit) => {
            return unit.id === id;
        });
    }

    getReaper() {
        return this.units.find((unit) => {
            return unit.type === 0 && unit.player === 0;
        });
    }

    getDestroyer() {
        return this.units.find((unit) => {
            return unit.type === 1 && unit.player === 0;
        });
    }

    getDoof() {
        return this.units.find((unit) => {
            return unit.type === 2 && unit.player === 0;
        });
    }

    getWrecks() {
        return this.units.filter((unit) => {
            return unit.type === 4;
        });
    }

    getTankers() {
        return this.units.filter((unit) => {
            return unit.type === 3;
        });
    }

    getEnemyReapers() {
        return this.units.filter((unit) => {
            return unit.type === 0 && unit.player !== 0;
        });
    }

    getClosest(pos, units) {
        let min = 6000;
        let closest = null;

        for (let i in units) {
            let unit = units[i];

            let distanceFromCenter = Util.distance({x:0,y:0}, unit);
            if (distanceFromCenter >= 6000) {
                continue;
            }

            let distance = Util.distance(pos, unit);
            if (distance < min || !closest) {
                closest = unit;
                min = distance;
            }
        }
        return closest;
    }

    isInside(pos, units) {
        for (let i in units) {
            let unit = units[i];
            if (Util.isInside(pos, unit)) {
                return unit;
            }
        }
        return null;
    }

    ram(unit, circle) {
        return Util.formatSolution(circle, 300);
    }

    isGoingToStopIn(unit, circle) {
        Util.checkCircle(circle);

        let simulated = Util.copy(unit);

        while (Util.speedNorm(simulated) > 1) {
            let friction = 0.2;
            if (simulated.type == 1) {
                friction = 0.3;
            }
            simulated.vx = simulated.vx * (1 - friction);
            simulated.vy = simulated.vy * (1 - friction);
            simulated.x = simulated.x + simulated.vx;
            simulated.y = simulated.y + simulated.vy;
        }

        return Util.isInside(simulated, circle);
    }

    stopAt(unit, circle) {
        let acc = 300;
        if (this.isGoingToStopIn(unit, circle)) {
            acc = 0;
        }
        return Util.formatSolution(circle, acc);
    }

    isGrenadeAvailable() {
        return this.myRage >= 60;
    }

    getGrenadeCircle() {
        let destroyer = this.getDestroyer();
        let circle = Util.copy(destroyer);
        circle.radius = 2000;
        return circle;
    }

    solve(carIndex) {
        if (carIndex === 0) {
            return this.solveReaper();
        }
        if (carIndex === 1) {
            return this.solveDestroyer();
        }
        if (carIndex === 2) {
            return this.solveDoof();
        }
        return "WAIT";
    }

    solveReaper() {
        let reaper = this.getReaper();
        let wrecks = this.getWrecks();
        let tankers = this.getTankers();

        let inside = this.isInside(reaper, wrecks);
        if (inside) {
            return 'WAIT';
        }

        let wreck = this.getClosest(reaper, wrecks);
        if (wreck) {
            return this.stopAt(reaper, wreck);
        }

        return this.stopAt(reaper, this.getCenter());
    }

    solveDestroyer() {
        let reaper = this.getReaper();
        let destroyer = this.getDestroyer();
        let tankers = this.getTankers();
        let enemyReapers = this.getEnemyReapers();

        if (this.isGrenadeAvailable()) {
            let grenadeCircle = this.getGrenadeCircle();
            let targets = enemyReapers.map((enemy) => {
                let target = Util.copy(enemy);
                target.x += target.vx;
                target.y += target.vy;
                return target;
            });
            let target = targets.find((target) => { 
                return Util.isInside(target, grenadeCircle); 
            });
            if (target) {
                return Util.formatSkill(target);
            }
        }

        let tanker = this.getClosest(destroyer, tankers);
        if (tanker) {
            return this.ram(destroyer, tanker);
        }

        return this.stopAt(destroyer, this.getCenter());
    }

    solveDoof() {
        let doof = this.getDoof();
        let enemyReapers = this.getEnemyReapers();

        let reaper = this.getClosest(doof, enemyReapers);
        if (reaper) {
            return this.ram(doof, reaper);
        }

        return this.stopAt(destroyer, this.getCenter());
    }
}

let game = new Game();
while (true) {
    game.read();
    print(game.solve(0));
    print(game.solve(1));
    print(game.solve(2));
}
