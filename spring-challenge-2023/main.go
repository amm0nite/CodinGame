package main

import (
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"
)

func debug(format string, a ...any) {
	fmt.Fprintln(os.Stderr, fmt.Sprintf(format, a...))
}

func main() {
	rand.Seed(time.Now().Unix())
	game := &Game{}

	scanner := bufio.NewScanner(os.Stdin)
	scanner.Buffer(make([]byte, 1000000), 1000000)
	var inputs []string

	// numberOfCells: amount of hexagonal cells in this map
	var numberOfCells int
	scanner.Scan()
	fmt.Sscan(scanner.Text(), &numberOfCells)
	game.numberOfCells = numberOfCells

	for i := 0; i < numberOfCells; i++ {
		// _type: 0 for empty, 1 for eggs, 2 for crystal
		// initialResources: the initial amount of eggs/crystals on this cell
		// neigh0: the index of the neighbouring cell for each direction
		var _type, initialResources, neigh0, neigh1, neigh2, neigh3, neigh4, neigh5 int
		scanner.Scan()
		fmt.Sscan(scanner.Text(), &_type, &initialResources, &neigh0, &neigh1, &neigh2, &neigh3, &neigh4, &neigh5)

		cell := &Cell{}
		cell.index = i
		cell.content = _type
		cell.initialResources = initialResources
		cell.resources = initialResources
		cell.neigh = [6]int{neigh0, neigh1, neigh2, neigh3, neigh4, neigh5}
		game.cells = append(game.cells, cell)

		//cell.debugNeighs()
	}

	var numberOfBases int
	scanner.Scan()
	fmt.Sscan(scanner.Text(), &numberOfBases)
	game.numberOfBases = numberOfBases

	scanner.Scan()
	inputs = strings.Split(scanner.Text(), " ")
	for i := 0; i < numberOfBases; i++ {
		myBaseIndex, _ := strconv.ParseInt(inputs[i], 10, 32)
		game.myBaseIndex = int(myBaseIndex)
	}

	scanner.Scan()
	inputs = strings.Split(scanner.Text(), " ")
	for i := 0; i < numberOfBases; i++ {
		oppBaseIndex, _ := strconv.ParseInt(inputs[i], 10, 32)
		game.oppBaseIndex = int(oppBaseIndex)
	}

	game.initialize()

	for {
		for i := 0; i < numberOfCells; i++ {
			// resources: the current amount of eggs/crystals on this cell
			// myAnts: the amount of your ants on this cell
			// oppAnts: the amount of opponent ants on this cell
			var resources, myAnts, oppAnts int
			scanner.Scan()
			fmt.Sscan(scanner.Text(), &resources, &myAnts, &oppAnts)

			cell := game.cells[i]
			cell.resources = resources
			cell.myAnts = myAnts
			cell.oppAnts = oppAnts
		}

		// fmt.Fprintln(os.Stderr, "Debug messages...")

		// WAIT | LINE <sourceIdx> <targetIdx> <strength> | BEACON <cellIdx> <strength> | MESSAGE <text>
		orders := game.solve()
		if len(orders) == 0 {
			fmt.Println("WAIT")
			return
		}

		fmt.Println(strings.Join(orders, ";"))
	}
}

type Cell struct {
	index            int
	content          int
	initialResources int
	resources        int
	myAnts           int
	oppAnts          int
	neigh            [6]int
}

type Game struct {
	numberOfCells int
	cells         []*Cell
	numberOfBases int
	myBaseIndex   int
	oppBaseIndex  int
	strategy      *Strategy
}

type Strategy struct {
	targetIndex int
}

type Path struct {
	cells []*Cell
}

func (g *Game) initialize() {
	g.strategy = &Strategy{}
	g.strategy.targetIndex = -1
}

func (g *Game) findResources() int {
	ants := 10
	bestScore := 0
	var bestPath *Path

	for i := 0; i < ants; i++ {
		path := g.randomAnt()
		score := path.score()
		if score > bestScore {
			bestScore = score
			bestPath = path
		}
	}

	if bestPath == nil {
		panic("no path")
	}
	if len(bestPath.cells) == 0 {
		panic("empty path")
	}

	return bestPath.cells[len(bestPath.cells)-1].index
}

func (g *Game) solve() []string {
	orders := []string{}
	//orders = append(orders, fmt.Sprintf("BEACON %d %d", index, 1))

	if g.strategy.targetIndex == -1 {
		debug("finding initial target")
		g.strategy.targetIndex = g.findResources()
	}

	target := g.cells[g.strategy.targetIndex]
	if target.resources == 0 {
		debug("finding new target")
		g.strategy.targetIndex = g.findResources()
	}

	debug("strat is %d", g.strategy.targetIndex)
	orders = append(orders, g.orderLine(g.myBaseIndex, g.strategy.targetIndex, 1))

	return orders
}

func (g *Game) orderLine(index1 int, index2 int, strength int) string {
	return fmt.Sprintf("LINE %d %d %d", index1, index2, strength)
}

func (g *Game) randomAnt() *Path {
	path := &Path{}
	currentIndex := g.myBaseIndex
	//fmt.Fprintln(os.Stderr, fmt.Sprintf("rand ant starts at %d", currentIndex))

	for {
		nextIndex := g.cells[currentIndex].randNeigh()
		cell := g.cells[nextIndex]
		path.cells = append(path.cells, cell)

		//fmt.Fprintln(os.Stderr, fmt.Sprintf("rand ant is at %d with %d res", nextIndex, cell.resources))

		if cell.resources > 0 {
			break
		}

		currentIndex = nextIndex
	}

	return path
}

func (p *Path) score() int {
	return 1000 - len(p.cells)
}

func (c *Cell) randNeigh() int {
	result := -1

	for result < 0 {
		index := rand.Intn(len(c.neigh))
		result = c.neigh[index]
	}

	//fmt.Fprintln(os.Stderr, fmt.Sprintf("%d random neigh is %d", c.index, result))
	//c.debugNeighs()

	return result
}

func (c *Cell) debugNeighs() {
	ns := []string{}
	for _, n := range c.neigh {
		ns = append(ns, fmt.Sprintf("%d", n))
	}
	fmt.Fprintln(os.Stderr, fmt.Sprintf("%d as neighs %s", c.index, strings.Join(ns, ":")))
}
