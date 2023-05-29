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
	path *Path
}

type Path struct {
	cells []*Cell
}

func (g *Game) initialize() {
	g.strategy = &Strategy{}
}

func (g *Game) getAntCount() int {
	total := 0
	for _, cell := range g.cells {
		total = total + cell.myAnts
	}
	return total
}

func (g *Game) findPath() *Path {
	ants := 1000
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

	return bestPath
}

func (g *Game) updateStrategy() {
	if g.strategy.path == nil {
		debug("finding initial path")
		g.strategy.path = g.findPath()
		return
	}

	count := g.strategy.path.getResourceCount()
	if count == 0 {
		debug("finding new path")
		g.strategy.path = g.findPath()
		return
	}

	//g.strategy.path = g.findPath()
}

func (g *Game) solve() []string {
	g.updateStrategy()

	orders := []string{}
	pathOrders := g.strategy.path.toOrders()
	for _, order := range pathOrders {
		orders = append(orders, order)
	}

	return orders
}

func orderLine(index1 int, index2 int, strength int) string {
	return fmt.Sprintf("LINE %d %d %d", index1, index2, strength)
}

func orderBeacon(index int, strength int) string {
	return fmt.Sprintf("BEACON %d %d", index, strength)
}

func (g *Game) randomAnt() *Path {
	maxLength := rand.Intn(g.getAntCount()) + 1

	path := &Path{}
	currentIndex := g.myBaseIndex
	path.cells = append(path.cells, g.cells[g.myBaseIndex])
	//fmt.Fprintln(os.Stderr, fmt.Sprintf("rand ant starts at %d", currentIndex))

	for {
		nextIndex := g.cells[currentIndex].randNeigh()
		cell := g.cells[nextIndex]
		path.cells = append(path.cells, cell)

		//fmt.Fprintln(os.Stderr, fmt.Sprintf("rand ant is at %d with %d res", nextIndex, cell.resources))

		length := len(path.cells)
		if length > maxLength {
			break
		}

		currentIndex = nextIndex
	}

	path.removeDupes()
	return path
}

func (p *Path) removeDupes() {
	cellMap := map[int]*Cell{}
	for _, cell := range p.cells {
		cellMap[cell.index] = cell
	}
	uniqueCells := []*Cell{}
	for _, cell := range cellMap {
		uniqueCells = append(uniqueCells, cell)
	}
	p.cells = uniqueCells
}

func (p *Path) last() *Cell {
	return p.cells[len(p.cells)-1]
}

func (p *Path) getResourceCount() int {
	totalResources := 0
	for _, cell := range p.cells {
		factor := 1
		if cell.content == 2 {
			factor = 1
		}
		totalResources = totalResources + (cell.resources * factor)
	}

	debug("len %d, tot %d", len(p.cells), totalResources)
	return totalResources
}

func (p *Path) score() int {
	return p.getResourceCount() - (len(p.cells) * 2)
}

func (p *Path) toOrders() []string {
	orders := []string{}
	for _, cell := range p.cells {
		orders = append(orders, orderBeacon(cell.index, 1))
	}
	return orders
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
