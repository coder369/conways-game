/**
 * Created by moore on 10/21/2015.
 */

/********************
 ***  Simulation  ***
 ********************/
function Simulation() {

    var iterator = null;


    /*****************
     ***  Options  ***
     *****************/
    var Options = (function(){

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

                var patternsSelect = document.getElementById('patterns');

                patternsSelect.appendChild(new Option('-- select a pattern --', 0));

                for (var i = 0, len = opts.patterns.length; i < len; i++) {
                    patternsSelect.appendChild(new Option(opts.patterns[i].name, i));
                }
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

        var cellState = 0,
            cell = {
                left: 1,
                top: 1
            };

        function getMouseLocation(e) {
            var canvasRect = canvas.getBoundingClientRect();

            return {
                x: e.clientX - canvasRect.left,
                y: e.clientY - canvasRect.top
            };
        }

        function clearCellInfo() {
            mouseCell.innerText = '';
            indexCell.innerText = '';
        }

        /***********************
         ***  Canvas Events  ***
         ***********************/
        canvas.addEventListener('mouseleave', function () {
            clearCellInfo();
        }, false);

        canvas.addEventListener('mousemove', function (evt) {
            var mouseLoc = getMouseLocation(evt);
            var cellLoc = Grid.Cell.getLocation_byMouseLocation(mouseLoc.x, mouseLoc.y);
            var cellIndex = Grid.Cell.getIndex_byLocation(cellLoc.x, cellLoc.y);

            cell = Grid.Cell.getTopLeft_byLocation(cellLoc.x, cellLoc.y);
            cellState = Grid.Cell.getState(Grid.Cell.getIndex_byTopLeft(cell.top, cell.left));

            if (cellLoc.x > Options.get.gridSize || cellLoc.x < 0
                || cellLoc.y > Options.get.gridSize || cellLoc.y < 0) {
                clearCellInfo();
            } else {
                mouseCell.innerText = '(' + cellLoc.x + ', ' + cellLoc.y + ')';
                indexCell.innerText = cellIndex.toLocaleString();
            }
        }, false);

        canvas.addEventListener('click', function (evt) {
            var mouseLoc = getMouseLocation(evt);
            var cellLoc = Grid.Cell.getLocation_byMouseLocation(mouseLoc.x, mouseLoc.y);

            if (Options.get.currentPattern === -1) return;

            for (var i = 0, len = Options.get.currentPattern.length; i < len; i++) {
                var cellIndex = Grid.Cell.getIndex_byLocation(cellLoc.x + Options.get.currentPattern[i].x, cellLoc.y + Options.get.currentPattern[i].y);
                Grid.Cell.setState(cellIndex, 1);
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
            printCell: function (cellIndex, cellState) {
                var cellLocation = Grid.Cell.getLocation_byIndex(cellIndex);

                var wh = Grid.cellSize - 1;

                ctx.fillStyle = cellState ? '#88C6DB' : '#fff';
                ctx.fillRect(cellLocation.x, cellLocation.y, wh, wh);
            },
            printGrid: function () {
                var gridCanvasSize = (Options.get.gridSize * Grid.cellSize) + (Grid.cellSize * 2);
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
            this.cells = new Int8Array(Options.get.gridSize + (Options.get.gridSize * Options.get.gridSize));
            this.lastCellIndex = this.cells.length - 1;

            for (var i = 0; i <= this.lastCellIndex; i++) {
                this.cells[i] = 0;
            }

            Screen.clearCanvas();
            Screen.printGrid();

            /**************
             ***  Cell  ***
             **************/
            this.Cell = {
                getLocation_byIndex: function (cellIndex) {
                    return {
                        x: ((cellIndex % Options.get.gridSize) * Grid.cellSize) + 1,
                        y: ((Math.floor(cellIndex / Options.get.gridSize) * Grid.cellSize)) + 1
                    }
                },
                getLocation_byMouseLocation: function (mouseX, mouseY) {
                    return {
                        x: Math.floor(mouseX / Grid.cellSize),
                        y: Math.floor(mouseY / Grid.cellSize)
                    }
                },
                getTopLeft_byLocation: function (locX, locY) {
                    return {
                        left: locX * Grid.cellSize + 1,
                        top: locY * Grid.cellSize + 1
                    }
                },
                getIndex_byTopLeft: function (top, left) {
                    return (((top + left * Options.get.gridSize) - (Options.get.gridSize)) / Grid.cellSize) + Options.get.gridSize;
                },
                getIndex_byLocation: function (x, y) {
                    return (x + y * Options.get.gridSize) - (Options.get.gridSize) + Options.get.gridSize;
                },
                getState: function (cellIndex) {
                    if (cellIndex < 0 || cellIndex > Grid.cells.length) return 0;

                    return Grid.cells[cellIndex];
                },
                setState: function (cellIndex, cellState) {
                    Grid.cells[cellIndex] = cellState;
                    Screen.printCell(cellIndex, cellState);
                },
                toggleState: function (cellIndex) {
                    var cellState = this.getState(cellIndex);
                    this.setState(cellIndex, !cellState);
                }
            };
        }
    };

    
    return {
        run: function () {
            var iterations = 0;

            this.pause();

            iterator = setInterval(function () {
                nextGeneration();
                iterations++;
            }, Options.get.milliseconds);

            function nextGeneration() {
                var toggleCells = [];

                for (var i = 0; i <= Grid.lastCellIndex; i++) {
                    if (Grid.Cell.getState(i)) {
                        var neighbors = getNeighbors(i);

                        applyDeathLaw(getLivingNeighbors(i), i);

                        for (var y = 0, len = neighbors.length; y < len; y++) {
                            var cellIndex = neighbors[y];

                            if(Grid.Cell.getState(cellIndex)){
                                applyDeathLaw(getLivingNeighbors(cellIndex), cellIndex);
                            }else{
                                applyBirthLaw(getLivingNeighbors(cellIndex), cellIndex);
                            }
                        }
                    }
                }

                for (var x = 0, len = toggleCells.length; x < len; x++) {
                    Grid.Cell.toggleState(toggleCells[x]);
                }

                function applyBirthLaw(livingNeighbors, cellIndex) {
                    if (livingNeighbors === 3) {
                        toggleCells.pushUnique(cellIndex);
                    }
                }

                function applyDeathLaw(livingNeighbors, cellIndex) {
                    if (livingNeighbors > 3 || livingNeighbors < 2) {
                        toggleCells.pushUnique(cellIndex);
                    }
                }

                function getNeighbors(centerCell) {
                    var north, west, east, south;

                    north = centerCell - Options.get.gridSize;
                    south = centerCell + Options.get.gridSize;
                    east = 1;
                    west = -1;

                    return [
                        north + west,
                        north,
                        north + east,
                        centerCell + west,
                        centerCell + east,
                        south + west,
                        south,
                        south + east
                    ];
                }

                function getLivingNeighbors(centerCell) {
                    var north, west, east, south;

                    north = centerCell - Options.get.gridSize;
                    south = centerCell + Options.get.gridSize;
                    east = 1;
                    west = -1;

                    return Grid.Cell.getState(north + west)
                        + Grid.Cell.getState(north)
                        + Grid.Cell.getState(north + east)
                        + Grid.Cell.getState(centerCell + west)
                        + Grid.Cell.getState(centerCell + east)
                        + Grid.Cell.getState(south + west)
                        + Grid.Cell.getState(south)
                        + Grid.Cell.getState(south + east);
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

/*************************
 *** Helper Prototypes ***
 *************************/
Array.prototype.pushUnique = function (item) {
    if (this.indexOf(item) == -1) {
        this.push(item);
        return true;
    }
    return false;
};






