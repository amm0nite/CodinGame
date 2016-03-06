// use only lib.core.d.ts to remove all DOM stuff
// in tsconfig set noLib to true to use only lib.core.d.ts
// use "declare" keyword to declare variables
// that may not have originated from a TypeScript file
declare var readline;
declare var print;
declare var printErr;

class Dict<T> {
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

class Vector {
  private x: number;
  private y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  str(): string {
    return this.x + ' ' + this.y;
  }

  distance(v: Vector): number {
    return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2));
  }

  dotproduct(v: Vector): number {
    // TODO
    return 0;
  }

  angle(v: Vector): number {
    // TODO
    return 0;
  }
}

class Entity {
  protected position: Vector;

  constructor(position: Vector) {
    this.setPosition(position);
  }

  getPosition(): Vector {
    return this.position;
  }

  setPosition(position: Vector) {
    this.position = position;
  }

  str(): string {
    return this.position.str();
  }
}

class Checkpoint extends Entity {
  static rayon: number = 600;

  private index: number;

  constructor(index: number, position: Vector) {
    super(position);
    this.index = index;
  }

  getIndex(): number {
    return this.index;
  }
}

class Order extends Entity {
  private thrust: number;

  constructor(position, thrust) {
    super(position);
    this.thrust = thrust;
  }

  str(): string {
    var command = 'SHIELD';
    if (this.thrust > 0) {
      command = this.thrust.toString();
    }
    return this.getPosition().str() + ' ' + command;
  }
}

class Pod extends Entity {
  static rayon: number = 400;

  private speed: Vector;
  private angle: number;
  private nextCheckPoint: Checkpoint;
  private order: Order;

  private previousPosition: Vector;
  private previousAngle: number;

  constructor() {
    super(new Vector(0, 0));
    this.speed = new Vector(0, 0);
    this.nextCheckPoint = new Checkpoint(-1, new Vector(8000, 4500));
    this.order = new Order(new Vector(8000, 4500), 100);

    this.previousPosition = this.position;
    this.previousAngle = this.angle;
  }

  setPosition(position: Vector) {
    this.previousPosition = this.position;
    super.setPosition(position);
  }

  setSpeed(speed: Vector) {
    this.speed = speed;
  }

  setAngle(angle: number) {
    this.previousAngle = this.angle;
    this.angle = angle;
  }

  setNextCheckPoint(checkpoint: Checkpoint) {
    this.nextCheckPoint = checkpoint;
  }

  setOrder(order: Order) {
    this.order = order;
  }

  getPreviousPosition(): Vector {
    return this.previousPosition;
  }

  getNextCheckpoint(): Checkpoint {
    return this.nextCheckPoint;
  }

  getOrder(): Order {
    return this.order;
  }

  getAngleDifference(): number {
    return Math.abs(this.angle - this.previousAngle);
  }
}

class Game {
  private checkpoints: Checkpoint[];
  private blufor: Pod[];
  private redfor: Pod[];

  constructor() {
    this.checkpoints = [];

    var laps = parseInt(readline());
    var checkpointCount = parseInt(readline());
    for (var i = 0; i < checkpointCount; i++) {
        var inputs = readline().split(' ');
        var checkpointX = parseInt(inputs[0]);
        var checkpointY = parseInt(inputs[1]);

        this.checkpoints.push(new Checkpoint(i, new Vector(checkpointX, checkpointY)));
    }

    this.blufor = [];
    this.blufor.push(new Pod());
    this.blufor.push(new Pod());

    this.redfor = [];
    this.redfor.push(new Pod());
    this.redfor.push(new Pod());
  }

  tick(): void {
    this.init();
    this.act();
  }

  private init() {
    var inputs;
    var x, y, vx, vy, angle, nextCheckPointId: number;
    var position, speed: Vector;

    for (let teamIndex = 0; teamIndex < 2; teamIndex++) {
      var team: Pod[] = (teamIndex === 0) ? this.blufor : this.redfor;
      for (let podIndex = 0; podIndex < 2; podIndex++) {
          var pod: Pod = team[podIndex];

          inputs = readline().split(' ');
          x = parseInt(inputs[0]);
          y = parseInt(inputs[1]);
          vx = parseInt(inputs[2]);
          vy = parseInt(inputs[3]);
          angle = parseInt(inputs[4]);
          nextCheckPointId = parseInt(inputs[5]);

          position = new Vector(x, y);
          speed = new Vector(vx, vy);
          pod.setPosition(position);
          pod.setSpeed(speed);
          pod.setAngle(angle);
          pod.setNextCheckPoint(this.checkpoints[nextCheckPointId]);
      }
    }
  }

  private act() {
    this.think();
    for (let i in this.blufor) {
      print(this.blufor[i].getOrder().str());
    }
  }

  private think() {
    //var alpha = this.blufor[0];
    //var beta = this.blufor[1];

    for (let i = 0; i < this.blufor.length; i++) {
      let pod: Pod = this.blufor[i];
      let speed = 100;
      let target = pod.getNextCheckpoint();



      pod.setOrder(new Order(target.getPosition(), speed));
    }
  }
}

var game = new Game();
while (true) {
  game.tick();
}
