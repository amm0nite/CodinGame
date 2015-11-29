// use only lib.core.d.ts to remove all DOM stuff
// in tsconfig set noLib to true to use only lib.core.d.ts
// use "declare" keyword to declare variables
// that may not have originated from a TypeScript file
declare var readline;
declare var print;
declare var printErr;

class Map<T> {
  private data: Object;

  constructor() {
    this.data = {};
  }

  put(key: string, value: T): void {
    this.data[key] = value;
  }

  get(key: string): T {
    if (this.data.hasOwnProperty(key)) {
      return this.data[key];
    }
    return null;
  }
}

class Point {
  public x: number;
  public y: number;

  constructor(x: number, y:number) {
    this.x = x;
    this.y = y;
  }

  distance(p: Point): number {
    return Math.sqrt(Math.pow(this.x - p.x, 2) + Math.pow(this.y - p.y, 2));
  }

  toString(): string {
    return this.x + ' ' + this.y;
  }
}

abstract class Entity {
  private id: number;
  private p: Point;

  constructor(id: number, p: Point) {
    this.id = id;
    this.p = p;
  }

  closestEntity(entities: Entity[]): Entity {
    var closest: Entity = null;
    var min: number = 999999;
    entities.forEach(function(curr: Entity, index: number, arr: Entity[]) {
      var distance: number = this.distance(curr);
      if (distance <= min) {
        min = distance;
        closest = curr;
      }
    }, this);
    return closest;
  }

  distance(entity: Entity): number {
    return this.p.distance(entity.p);
  }

  getId(): number {
    return this.id;
  }

  getP(): Point {
    return this.p;
  }

  toString(): string {
    return this.id + ' ' + this.p.toString();
  }
}

class Ash extends Entity {
  static speed: number = 1000;
}

class Human extends Entity {
  static speed: number = 0;
}

class Zombie extends Entity {
  static speed: number = 400;
  private np: Point;

  setNextPosition(p: Point) {
    this.np = p;
  }

  getNp(): Point {
    return this.np;
  }
}

class HumanAndZombie {
  public h: Human;
  public z: Zombie;

  constructor(h: Human, z: Zombie) {
    this.h = h;
    this.z = z;
  }
}

class Game {
  private ash: Ash;
  private humans: Human[];
  private zombies: Zombie[];

  constructor() {

  }

  mostThreateningSituation(): HumanAndZombie {
    // get the most threatening situation
    var humanMostDanger: Human = null;
    var zombieMostDanger: Zombie = null;
    var min: number = 999999;
    this.humans.forEach(function(curr: Human, index: number, arr: Human[]) {
      var closestZombie: Zombie = <Zombie> curr.closestEntity(this.zombies);
      var distance: number = curr.distance(closestZombie);
      if (distance <= min) {
        min = distance;
        humanMostDanger = curr;
        zombieMostDanger = closestZombie;
      }
    }, this);
    return new HumanAndZombie(humanMostDanger, zombieMostDanger);
  }

  removeHuman(h: Human) {
    var newHumans: Human[] = [];
    this.humans.forEach(function(curr: Human, index: number, arr: Human[]) {
      if (curr.getId() != h.getId()) {
        newHumans.push(curr);
      }
    });
    this.humans = newHumans;
  }

  calculateAshDestination(ashPoint: Point, zPoint: Point, distance: number): Point {
    // zPoint is the new origin
    var alpha: number = Math.atan2((ashPoint.y - zPoint.y), (ashPoint.x - zPoint.x));

    var op: number = distance * Math.sin(alpha);
    var ad: number = distance * Math.cos(alpha);

    var x = parseInt((zPoint.x + ad) + '');
    var y = parseInt((zPoint.y + op) + '');

    return new Point(x, y);
  }

  solution(): string {
    var destination: Point = null;
    var message: string = "";

    while (!destination && this.humans.length > 0) {
      var dangerHZ = this.mostThreateningSituation();
      var futureZombie = new Zombie(dangerHZ.z.getId(), dangerHZ.z.getNp());
      // we want to change the Z route in order to save the H

      // calculate distances
      var distanceToBeat = dangerHZ.h.distance(futureZombie);
      var distanceAshToZombie = this.ash.distance(futureZombie);
      if (distanceAshToZombie < distanceToBeat) {
        return this.ash.getP().toString() + ' stay in position';
      }

      // now we have to find the position to deroute the Z
      destination = this.calculateAshDestination(this.ash.getP(), futureZombie.getP(), distanceToBeat - 10);
      message = 'targeting zid ' + futureZombie.getId();
      var distanceAshToSave = this.ash.getP().distance(destination);

      printErr('destination: '+destination.toString());
      printErr('finalDistance: '+destination.distance(futureZombie.getP()));
      printErr('HtoZDistance: '+dangerHZ.h.distance(futureZombie));

      // can ash save the human
      var humanTimeRemaining = (distanceToBeat / Zombie.speed) + 1;
      var ashSprintDuration = distanceAshToSave / Ash.speed;
      printErr('humanTimeRemaining: '+humanTimeRemaining);
      printErr('ashSprintDuration: '+ashSprintDuration);

      if (ashSprintDuration >= humanTimeRemaining) {
        // well he is fucked, remove it from the human pool
        printErr("human "+dangerHZ.h.getId()+" is going to die")
        this.removeHuman(dangerHZ.h);
        destination = null;
      }
    }

    if (!destination) {
      return this.ash.getP().toString() + ' no destination';
    }
    return destination.toString() + ' ' + message;
  }

  start(): void {
    // game loop
    while (true) {
      var inputs = readline().split(' ');

      var x = parseInt(inputs[0]);
      var y = parseInt(inputs[1]);
      this.ash = new Ash(0, new Point(x, y));

      this.humans = [];
      var humanCount = parseInt(readline());
      for (var i = 0; i < humanCount; i++) {
          var inputs = readline().split(' ');
          var humanId = parseInt(inputs[0]);
          var humanX = parseInt(inputs[1]);
          var humanY = parseInt(inputs[2]);
          this.humans.push(new Human(humanId, new Point(humanX, humanY)));
      }

      this.zombies = [];
      var zombieCount = parseInt(readline());
      for (var i = 0; i < zombieCount; i++) {
          var inputs = readline().split(' ');
          var zombieId = parseInt(inputs[0]);
          var zombieX = parseInt(inputs[1]);
          var zombieY = parseInt(inputs[2]);
          var zombieXNext = parseInt(inputs[3]);
          var zombieYNext = parseInt(inputs[4]);
          var z: Zombie = new Zombie(zombieId, new Point(zombieX, zombieY));
          z.setNextPosition(new Point(zombieXNext, zombieYNext));
          this.zombies.push(z);
      }

      // Write an action using print()
      // To debug: printErr('Debug messages...');
      print(this.solution()); // Your destination coordinates
    }
  }
}

/**
 * Save humans, destroy zombies!
 **/
var game: Game = new Game();
game.start();
