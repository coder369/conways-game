/*********************************************
 * Created by:      Benjamin Moore
 * Date Created:    10/21/2015
 * Email:           Benjamin@MooreSof.com
 ********************************************/

/********************
 ***  Simulation  ***
 ********************/
function Simulation() {

    var iterator = null;


    /*****************
     ***  Options  ***
     *****************/
    var Options = (function () {

        var opts = {
            gridSize: 350,
            milliseconds: 50,
            patterns: null,
            currentPattern: -1
        };

        if (opts.patterns !== null) return patterns;

        var request = new XMLHttpRequest();
        var url = window.location.origin + (window.location.port.length > 0 ? '/source' : '') + '/data/patterns.json';

        request.open('GET', url, true);
        request.onload = loadPatterns;
        request.onerror = function () {
            opts.patterns = [];
        };
        request.send();

        function loadPatterns() {
            if (request.status >= 200 && request.status < 400) {
                var data = JSON.parse(request.responseText);
                opts.patterns = data.patterns;

                var patternsSelect = document.getElementById('patterns'),
                    docFrag = document.createDocumentFragment();

                docFrag.appendChild(new Option('-- select a pattern --', 0));

                for (var i = 0, len = opts.patterns.length; i < len; i++) {
                    docFrag.appendChild(new Option(opts.patterns[i].name, i));
                }

                patternsSelect.appendChild(docFrag);
            } else {
                opts.patterns = [];
            }
        }

        return {
            setGridSize: function (gridSize) {
                opts.gridSize = parseInt(gridSize);
            },
            setRefreshDelayInterval: function (milliseconds) {
                opts.milliseconds = parseInt(milliseconds);
            },
            setPattern: function (patternIndex) {
                if (patternIndex === 0) {
                    opts.currentPattern = -1;
                    return;
                }
                opts.currentPattern = opts.patterns[patternIndex - 1].points;
            },
            get: opts
        }
    })();


    /****************
     ***  Canvas  ***
     ****************/
    var Screen = (function () {
        var mouseCell = document.getElementById('mouseCell');
        var indexCell = document.getElementById('mouseIndex');
        var canvas = document.getElementById('theBoard');
        var ctx = canvas.getContext('2d');

        /***********************
         ***  Canvas Events  ***
         ***********************/
        canvas.addEventListener('mouseleave', function () {
            mouseCell.innerText = '';
            indexCell.innerText = '';
        }, false);

        canvas.addEventListener('mousemove', function (e) {
            var canvasRect = canvas.getBoundingClientRect();

            var x = Math.floor((e.clientX - canvasRect.left) / Grid.cellSize),
                y = Math.floor((e.clientY - canvasRect.top) / Grid.cellSize);

            var cellIndex =  x + y * Options.get.gridSize;

            if (cellIndex < 0 || cellIndex > Grid.lastCellIndex){
                mouseCell.innerText = '';
                indexCell.innerText = '';
            }else{
                mouseCell.innerText = '(' + x + ', ' + y + ')';
                indexCell.innerText = cellIndex;
            }
        }, false);

        canvas.addEventListener('click', function (e) {
            var canvasRect = canvas.getBoundingClientRect();

            var x = Math.floor((e.clientX - canvasRect.left) / Grid.cellSize),
                y = Math.floor((e.clientY - canvasRect.top) / Grid.cellSize);

            var cellIndex = x + y * Options.get.gridSize;

            var cell = Grid.cells[cellIndex];

            if (Options.get.currentPattern === -1) return;

            var pattern = Options.get.currentPattern;

            for (var i = 0, l = pattern.length; i < l; i++) {
                var patternCell = pattern[i];
                cell.toggleRelativeCell(patternCell.x, patternCell.y);
            }
        }, false);

        return {
            setCanvasSize: function (size) {
                canvas.width = size;
                canvas.height = size;
            },
            clearCanvas: function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            },
            printCell: function (cell) {
                var cellCanvasLocation = cell.getCanvasLocation();

                var wh = Grid.cellSize - Grid.borderWidth;

                ctx.fillStyle = cell.state ? '#88C6DB' : '#fff';
                ctx.fillRect(cellCanvasLocation.left, cellCanvasLocation.top, wh, wh);
            },
            printGrid: function () {
                var gridCanvasSize = (Options.get.gridSize * Grid.cellSize) + Grid.cellOffset;
                this.setCanvasSize(gridCanvasSize);

                for (var x = Grid.cellOffset; x < gridCanvasSize; x += Grid.cellSize) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, gridCanvasSize - Grid.cellSize);
                }

                for (var y = Grid.cellOffset; y < gridCanvasSize; y += Grid.cellSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(gridCanvasSize - Grid.cellSize, y);
                }

                ctx.strokeStyle = '#ccc';
                ctx.stroke();
            }
        }
    })();


    /**************
     ***  Grid  ***
     **************/
    var Grid = {
        init: function () {
            this.cellSize = 4;
            this.cellOffset = .5;
            this.borderWidth = this.cellOffset * 2;
            this.cells = new Array(Options.get.gridSize + (Options.get.gridSize * Options.get.gridSize));
            this.lastCellIndex = this.cells.length - 1;

            for (var i = 0; i <= this.lastCellIndex; i++) {
                this.cells[i] = new GridCell(i);
            }

            Screen.clearCanvas();
            Screen.printGrid();
        }
    };

    /******************
     ***  GridCell  ***
     ******************/
    var GridCell = function (cellIndex) {
        this.state = 0;
        this.cellIndex = cellIndex;
    };

    GridCell.prototype.getLocation = function(){
        return {
            x: this.cellIndex % Options.get.gridSize,
            y: Math.floor(this.cellIndex / Options.get.gridSize)
        }
    };

    GridCell.prototype.getCanvasLocation = function(){
        var cellLocation = this.getLocation();
        return {
            left: cellLocation.x * Grid.cellSize + Grid.borderWidth,
            top: cellLocation.y * Grid.cellSize + Grid.borderWidth
        }
    };

    GridCell.prototype.getNeighbors = function(){
        var north, west, east, south;

        north = this.cellIndex - Options.get.gridSize;
        south = this.cellIndex + Options.get.gridSize;
        east = 1;
        west = -1;

        return [
            north + west,
            north,
            north + east,
            this.cellIndex + west,
            this.cellIndex + east,
            south + west,
            south,
            south + east
        ];
    };

    GridCell.prototype.getLivingNeighborsCount = function () {
        var neighbors = this.getNeighbors(),
            neighborsCount = 8,
            livingNeighbors = 0,
            lastCellIndex = Grid.lastCellIndex;

        while (neighborsCount--) {
            var neighborCellIndex = neighbors[neighborsCount];

            livingNeighbors += neighborCellIndex > 0 && neighborCellIndex < lastCellIndex && Grid.cells[neighborCellIndex].state ? 1 : 0;
        }

        return livingNeighbors;
    };

    GridCell.prototype.toggleRelativeCell = function (xOffset, yOffset) {
        var gridSize = Options.get.gridSize;
        var cellLocation = this.getLocation();
        var cellIndex = (cellLocation.x+xOffset) + (cellLocation.y+yOffset) * gridSize;
        var cell = Grid.cells[cellIndex];

        cell.state = !cell.state;

        Screen.printCell(cell);
    };

    GridCell.prototype.toggleCell = function () {
        this.state = !this.state;

        Screen.printCell(this);
    };

    GridCell.prototype.doesBirthLawApply = function() {
        var livingNeighbors = this.getLivingNeighborsCount();

        return (livingNeighbors === 3);
    };

    GridCell.prototype.doesDeathLawApply = function() {
        var livingNeighbors = this.getLivingNeighborsCount();

        return (livingNeighbors > 3 || livingNeighbors < 2);
    };

    return {
        run: function () {
            var iterations = 0;

            this.pause();

            iterator = setInterval(nextGeneration, Options.get.milliseconds);

            function nextGeneration() {
                var toggleCells = [],
                    gridCellsCount = Grid.lastCellIndex + 1,
                    gridLastCellIndex = Grid.lastCellIndex;


                iterations++;

                while (gridCellsCount--) {
                    var currentCell = Grid.cells[gridCellsCount];
                    if (currentCell.state) {

                        if(currentCell.doesDeathLawApply()){
                            if(toggleCells.indexOf(currentCell) === -1) {
                                toggleCells.push(currentCell);
                            }
                        }

                        var neighbors = currentCell.getNeighbors();
                        var neighborCellsCount = 8;

                        while (--neighborCellsCount) {
                            var cellIndex = neighbors[neighborCellsCount];

                            if(cellIndex > 0 && cellIndex < gridLastCellIndex) {

                                var neighborCell = Grid.cells[cellIndex];
                                var toggle = neighborCell.state ? neighborCell.doesDeathLawApply() : neighborCell.doesBirthLawApply();

                                if (toggle) {
                                    if (toggleCells.indexOf(neighborCell) === -1) {
                                        toggleCells.push(neighborCell);
                                    }
                                }
                            }
                        }
                    }
                }

                var toggledCellsCount = toggleCells.length;
                while (toggledCellsCount--) {
                    toggleCells[toggledCellsCount].toggleCell();
                }
            }
        },
        pause: function () {
            clearInterval(iterator);
        },
        clear: function () {
            this.pause();
            Grid.init();
        },
        Options: Options
    }
}





