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

enum Direction {
  Left, Right
};

class Target {
  distance: number;
  direction: Direction;
  spaceLoop: boolean;
  spaceEncounters: number;

  constructor(distance: number, direction: Direction) {
    this.distance = distance;
    this.direction = direction;
    this.spaceLoop = false;
    this.spaceEncounters = 0;
  }
}

class Zone {
  static alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
  static count = 30;

  private letter: string;
  private pos: number;
  private locked: boolean;

  constructor(pos: number) {
    this.letter = ' ';
    this.pos = pos;
    this.locked = false;
  }

  getPos(): number {
    return this.pos;
  }

  getLetter(): string {
    return this.letter;
  }

  setLetter(letter: string): void {
    this.letter = letter;
  }

  letterDistance(token: string): Target {
    if (this.locked && token != this.letter) {
      return new Target(999, Direction.Right);
    }

    var alphaLetters: Array<string> = Zone.alpha.split('');
    var pos: number = alphaLetters.indexOf(this.letter);
    var leIndex: number = pos;
    var riIndex: number = pos;
    var distance: number = 0;

    while (alphaLetters[leIndex] != token && alphaLetters[riIndex] != token) {
      leIndex--;
      if (leIndex == -1) {
        leIndex = Zone.alpha.length - 1;
      }
      riIndex++;
      if (riIndex == Zone.alpha.length) {
        riIndex = 0;
      }
      distance++;
    }

    var result: Target = null;
    if (alphaLetters[leIndex] == token) {
      result = new Target(distance, Direction.Left);
    }
    else {
      result = new Target(distance, Direction.Right);
    }

    var cuIndex: number = 0;
    var spaceDistanceLeft: number = 0;
    var spaceDistanceRight: number = 0;
    var foundSpaceLeft: boolean = false;
    var foundSpaceRight: boolean = false;

    // LEFT LOOP
    cuIndex = pos;
    while (alphaLetters[cuIndex] != token) {
      cuIndex--;
      if (cuIndex == -1) {
        cuIndex += alphaLetters.length;
      }
      if (alphaLetters[cuIndex] == ' ') {
        spaceDistanceLeft = 3;
        foundSpaceLeft = true;
      }
      else {
        spaceDistanceLeft++;
      }
    }
    // RIGHT LOOP
    cuIndex = pos;
    while (alphaLetters[cuIndex] != token) {
      cuIndex++;
      if (cuIndex == alphaLetters.length) {
        cuIndex -= alphaLetters.length;
      }
      if (alphaLetters[cuIndex] == ' ') {
        spaceDistanceRight = 3;
        foundSpaceRight = true;
      }
      else {
        spaceDistanceRight++;
      }
    }
    if (foundSpaceLeft || foundSpaceRight) {
      if (!foundSpaceLeft) { spaceDistanceLeft = 999; }
      if (!foundSpaceRight) { spaceDistanceLeft = 999; }
      var spaceDistance: number = spaceDistanceLeft;
      var spaceDirection: Direction = Direction.Left;
      if (spaceDistanceRight < spaceDistanceLeft) {
        spaceDirection = Direction.Right;
        spaceDistance = spaceDistanceRight;
      }
      var proposal = new Target(spaceDistance, spaceDirection);
      proposal.spaceLoop = true;
      if (proposal.distance < result.distance) {
        result = proposal;
      }
    }
    return result;
  }

  zoneDistance(bilboZone: Zone): Target {
    var pos: number = bilboZone.getPos();
    var leIndex: number = pos;
    var riIndex: number = pos;
    var distance: number = 0;

    while (leIndex != this.pos && riIndex != this.pos) {
      leIndex--;
      if (leIndex == -1) {
        leIndex = Zone.count - 1;
      }
      riIndex++;
      if (riIndex == Zone.count) {
        riIndex = 0;
      }
      distance++;
    }

    var result: Target = null;
    if (leIndex == this.pos) {
      result = new Target(distance, Direction.Left);
    }
    else {
      result = new Target(distance, Direction.Right);
    }
    return result;
  }

  update(token: string): void {
    this.letter = token;
  }

  lock(): void {
    if (!this.locked) {
      this.locked = true;
    }
  }
}

class Bilbo {
  private zone: Zone;
  private spell: string;

  constructor(zone: Zone) {
    this.zone = zone;
    this.spell = '';
  }

  getZone(): Zone {
    return this.zone;
  }

  getSpell(): string {
    return this.spell;
  }

  move(target: Target): void {
    var pos = this.zone.getPos();
    for (var i=0; i<target.distance; i++) {
      if (target.direction == Direction.Left) {
        pos--;
      }
      else {
        pos++;
      }
      if (pos == -1) {
        pos = Zone.count -1;
      }
      else if (pos == Zone.count) {
        pos = 0;
      }
    }
    this.zone = World.getInstance().getZone(pos);
    this.spell += this.zone.getLetter();
  }
}

class Solution {
  private pos: number;
  private tokenTarget: Target;
  private zoneTarget: Target;

  constructor(pos:number, tokenTarget: Target, zoneTarget: Target) {
    this.pos = pos;
    this.tokenTarget = tokenTarget;
    this.zoneTarget = zoneTarget;
  }

  translate(): string {
    var i: number = 0;
    var buffer: string = '';

    var zoneAmount: number = this.zoneTarget.distance;
    for (i=0; i<zoneAmount; i++) {
      buffer += (this.zoneTarget.direction == Direction.Left) ? '<' : '>';
    }

    var tokenAmount: number = this.tokenTarget.distance;
    if (this.tokenTarget.spaceLoop) {
      tokenAmount -= 3;
      buffer += '[+]';
    }
    for (i=0; i<tokenAmount; i++) {
      buffer += (this.tokenTarget.direction == Direction.Left) ? '-' : '+';
    }

    buffer += '.';
    return buffer;
  }

  getSum(): number {
    return this.tokenTarget.distance + this.zoneTarget.distance;
  }

  getPos(): number {
    return this.pos;
  }

  getTokenTarget(): Target {
    return this.tokenTarget;
  }

  getZoneTarget(): Target {
    return this.zoneTarget;
  }
}

class Situation {
  private solutions: Array<Solution>;

  constructor(solutions: Array<Solution>) {
    this.solutions = solutions;
  }

  getClosest(): Solution {
    var min: number = 999999;
    var closest: number = 0;
    for (var i=0; i<this.solutions.length; i++) {
      var distance: number = this.solutions[i].getSum();
      if (distance < min) {
        min = distance;
        closest = i;
      }
    }
    return this.solutions[closest];
  }
}

class Optimizer {
  static passes = 200;
  static maxLocks = 4;

  locks: Array<string>;

  constructor(magicPhrase: string) {
    this.locks = new Array<string>();
    var lockCount = Math.floor(Math.random() * Optimizer.maxLocks);
    for (var i=0; i<lockCount; i++) {
      this.locks.push(magicPhrase[Math.floor(Math.random() * magicPhrase.length)]);
    }
  }
}

class State {
  zones: Array<Zone>;
  bilbo: Bilbo;

  constructor() {
    this.zones = new Array<Zone>();
    for (var i=0; i<Zone.count; i++) {
      this.zones.push(new Zone(i));
    }
    this.bilbo = new Bilbo(this.zones[0]);
  }

  copy(): State {
    return JSON.parse(JSON.stringify(this));
  }
}

class World {
  private static instance: World = null;

  private magic: string;
  private state: State;
  private optim: Optimizer;
  private locking: boolean;
  private states: Array<State>;
  private stateMap: Map<number>;

  constructor() {
    this.reset();
  }

  reset() {
    this.state = new State();
    this.states = new Array<State>();
    this.stateMap = new Map<number>();

    this.magic = '';
    this.optim = null;
    this.locking = false;
  }

  parse(magicPhrase: string) {
    this.magic = magicPhrase;
    this.optim = new Optimizer(magicPhrase);

    // build answer
    var tokens: Array<string> = this.magic.split('');
    var answer: string = '';
    for (var i=0; i<tokens.length; i++) {
      var answerPiece: string = this.solve(tokens[i]);
      // extract state index
      var tab: Array<string> = answerPiece.split(':');
      var stateIndex: number = parseInt(tab[0]);
      this.stateMap.put(answer.length.toString(), stateIndex);
      // append
      answer += tab[1];
    }
    // optimize with loops
    answer = this.actionLoops(answer);
    return answer;
  }

  solve(token: string) {
    //get each zone distance to the letter
    var tokenTargets: Array<Target> = this.getTokenTargets(token);
    //get each zone distance to bilbo
    var zoneTargets: Array<Target> = this.getZoneTargets();
    //add distances for each zones
    var solutions: Array<Solution> = new Array<Solution>();
    for (var i=0; i<this.getZones().length; i++) {
      solutions.push(new Solution(i, tokenTargets[i], zoneTargets[i]));
    }
    var situation: Situation = new Situation(solutions);
    //select closest
    var solution: Solution = situation.getClosest();
    //save state
    //this.states.push(this.state.copy()); SAVING DISABLED
    var stateIndex = this.states.length - 1;
    //side effects
    this.getZone(solution.getPos()).update(token);
    this.getBilbo().move(solution.getZoneTarget());
    // locking
    if (this.locking) {
      for (var j=0; j<this.optim.locks.length; j++) {
        if (token == this.optim.locks[j]) {
          this.getZone(solution.getPos()).lock();
          this.optim.locks[j] = '$';
        }
      }
    }
    //translate
    return stateIndex + ':' + solution.translate();
  }

  getTokenTargets(token: string): Array<Target> {
    var targets: Array<Target> = new Array<Target>();
    for (var i=0; i<this.getZones().length; i++) {
      targets.push(this.getZone(i).letterDistance(token));
    }
    return targets;
  }

  getZoneTargets(): Array<Target> {
    var targets: Array<Target> = new Array<Target>();
    for (var i=0; i<this.getZones().length; i++) {
      targets.push(this.getZone(i).zoneDistance(this.getBilbo().getZone()));
    }
    return targets;
  }

  getZone(index: number) {
    return this.state.zones[index];
  }

  getZones(): Array<Zone> {
    return this.state.zones;
  }

  static getInstance(): World {
    if (!World.instance) {
      World.instance = new World();
    }
    return World.instance;
  }

  getBilbo(): Bilbo {
    return this.state.bilbo;
  }

  enableLocking() {
    this.locking = true;
  }

  actionLoops(answer: string): string {
    return answer;
  }
}

export function compile(magicPhrase: string) {
  var world: World = World.getInstance();

  world.reset();
  var best: string = world.parse(magicPhrase);

  for (var i=0; i<Optimizer.passes; i++) {
    world.reset();
    world.enableLocking();
    var res: string = world.parse(magicPhrase);
    if (res.length < best.length) {
      best = res;
    }
  }

  return best;
}

//var magicPhrase = readline();
//print(compile(magicPhrase));
