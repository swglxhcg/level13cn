define([
	'ash',
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/constants/CampConstants',
	'game/constants/GameConstants',
	'game/components/player/DeityComponent',
	'game/components/sector/improvements/SectorImprovementsComponent',
	'game/nodes/player/PlayerStatsNode',
	'game/nodes/tribe/TribeUpgradesNode',
	'game/nodes/sector/CampNode',
], function (Ash, GameGlobals, GlobalSignals, CampConstants, GameConstants, DeityComponent, SectorImprovementsComponent, PlayerStatsNode, TribeUpgradesNode, CampNode) {
	
	var FavourSystem = Ash.System.extend({

		constructor: function () {},

		addToEngine: function (engine) {
			this.engine = engine;
			this.campNodes = engine.getNodeList(CampNode);
			this.tribeUpgradesNodes = engine.getNodeList(TribeUpgradesNode);
			this.playerStatsNodes = engine.getNodeList(PlayerStatsNode);
			
			GlobalSignals.add(this, GlobalSignals.improvementBuiltSignal, this.onImprovementBuilt);
		},

		removeFromEngine: function (engine) {
			GlobalSignals.removeAll(this);
			
			this.campNodes = null;
			this.tribeUpgradesNodes = null;
			this.playerStatsNodes = null;
			this.engine = null;
		},

		update: function (time) {
			if (GameGlobals.gameState.isPaused) return;
			if (!this.campNodes.head) return;
			
			var deityComponent = this.playerStatsNodes.head.entity.get(DeityComponent);
			if (!deityComponent) return;
			
			deityComponent.accSources = [];
			deityComponent.accumulation = 0;
			
			for (var campNode = this.campNodes.head; campNode; campNode = campNode.next) {
				var improvementsComponent = campNode.entity.get(SectorImprovementsComponent);
				
				var accTemple = GameGlobals.campHelper.getTempleFavourGenerationPerSecond(improvementsComponent) * GameConstants.gameSpeedCamp;
				var numClerics = campNode.camp.assignedWorkers.cleric || 0;
				var accClerics = GameGlobals.campHelper.getFavourProductionPerSecond(numClerics, improvementsComponent);
				var accCamp = accTemple + accClerics;
				
				deityComponent.addChange("Temples", accTemple, campNode.position.level);
				deityComponent.addChange("Clerics", accClerics, campNode.position.level);
				deityComponent.favour += time * accCamp;
				deityComponent.accumulation += accCamp;
				deityComponent.accumulationPerCamp[campNode.position.level] = accCamp;
			}
		},
		
		setDeityName: function (name) {
			let deityComponent = this.playerStatsNodes.head.entity.get(DeityComponent);
			deityComponent.name = name;
		},
		
		isValidDeityName: function (name) {
			if (!name || name.length < 1) {
				return false;
			}
			return true;
		},
		
		showDeityNamePopup: function () {
			let sys = this;
			GameGlobals.uiFunctions.showInput(
				"神的名字",
				"既然你已经建造了一座神庙，你就应该给你的人民取一个名字来称呼这个神.",
				"",
				false,
				function (input) {
					sys.setDeityName(input);
				},
				function (input) {
					return sys.isValidDeityName(input);
				},
			);
		},
		
		onImprovementBuilt: function () {
			let hasTemple = false;
			for (var campNode = this.campNodes.head; campNode; campNode = campNode.next) {
				var improvementsComponent = campNode.entity.get(SectorImprovementsComponent);
				hasTemple = hasTemple || improvementsComponent.getCount(improvementNames.temple) > 0;
			}
			if (!hasTemple) {
				return;
			}
			let deityComponent = this.playerStatsNodes.head.entity.get(DeityComponent);
			if (this.isValidDeityName(deityComponent.name)) {
				return;
			}
			this.showDeityNamePopup();
		},
		
	});
	
	return FavourSystem;
	
});
