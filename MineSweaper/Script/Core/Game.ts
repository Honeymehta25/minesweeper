class Game {

    public onStateChanged : (newState : GameState) => void;
    private _state: GameState = GameState.Unknown;
    public get state() {
        return this._state;
    }
    public set state(newValue : GameState) {
        this._state = newValue;
        if (this.onStateChanged != undefined)
            this.onStateChanged(newValue);
    }

    public bricks : Array<Array<Brick>>;

    public static _defaultSettings: GameSettings =
    {
        level: GameLevel.Easy,
        size: {
            boardWidth: 15,
            boardHeight: 20
        }
    };

    private _currentSettings : GameSettings;

     constructor() {
         this.state = GameState.NotStarted;
     }

    public setup(settings?: GameSettings): void {
        this._currentSettings = settings || Game._defaultSettings;
        
        // Create Bricks
        var newBricks = GameSetupHelper.createBricks(this._currentSettings.size);
        this.bricks = newBricks;

        // Convert some of them to bombs
        var numberOfBombs = GameSetupHelper.getNumberOfBombs(this._currentSettings);
        GameSetupHelper.addBombs(newBricks, numberOfBombs);

        // Connect bricks so that they get neighbours
        GameSetupHelper.setBrickRelations(newBricks);

        // Set "normal neghbour" count for bricks
        newBricks.forEach(row=>
            row.forEach(brick=>
                GameSetupHelper.setNeighbourCountFor(brick)
            )
        );

        this.state = GameState.Ready;
    }

    public flip(brick: Brick): void {
        // if game state is ready, start timer and start game
        if (this.state == GameState.Ready) {
            this.state = GameState.Ongoing;
        }

        if (this.state != GameState.Ongoing) {
            return;
        }

        // flip brick if not allready flipped or flagged
        if (brick.state == BrickState.FacingUp || brick.state == BrickState.Flagged)  {
            return;
        }
        brick.state = BrickState.FacingUp;
        
        // check if brick is bomb, and if so set game state to game over
        if (brick.type == BrickType.Bomb) {
            this.state = GameState.Finnished;
        }

        // flip neighbours if brick has only normal neighbours
        var hasBombNeighbour = brick.adjacentBricks
                                        .filter(neighbour=> neighbour.type == BrickType.Bomb)
                                        .length != 0;
        if (!hasBombNeighbour) {
            brick.adjacentBricks.forEach(neighbour => this.flip(neighbour));
        }

        // check if victory conditions are met, and if so change game state
        var hasUnflippedBricks = _.any(this.bricks, row=> _.any(row, b=> b.state == BrickState.FacingDown));
        if (!hasUnflippedBricks) {
            this.state = GameState.Finnished;
        }
    }

    public toggleFlag(brick: Brick) {
        switch (brick.state) {
        case BrickState.FacingDown:
            brick.state = BrickState.Flagged;
            break;
            case BrickState.Flagged:
                brick.state = BrickState.FacingDown;
            break;
        }
    }

    public expandCoveredArea(brick: Brick) {
        if (brick.state != BrickState.FacingUp) {
            return;
        }

        var numberOfFlaggedNeighbours = brick.adjacentBricks.filter(n=> n.state == BrickState.Flagged).length;
        var hasUnevaluatedNeighbours = (brick.numberOfBombNeighbours - numberOfFlaggedNeighbours) > 0;
        if (hasUnevaluatedNeighbours) {
            return;
        }

        brick.adjacentBricks.forEach(n=> this.flip(n));
    }
} 