// Functions to respond to player actions parsed by the UIFunctions
define(['ash',
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/constants/GameConstants',
	'game/constants/CampConstants',
	'game/constants/FollowerConstants',
	'game/constants/LogConstants',
	'game/constants/ImprovementConstants',
	'game/constants/PositionConstants',
	'game/constants/MovementConstants',
	'game/constants/PlayerActionConstants',
	'game/constants/PlayerStatConstants',
	'game/constants/ItemConstants',
	'game/constants/PerkConstants',
	'game/constants/FightConstants',
	'game/constants/TradeConstants',
	'game/constants/UpgradeConstants',
	'game/constants/TextConstants',
	'game/vos/PositionVO',
	'game/vos/LocaleVO',
	'game/vos/ResultVO',
	'game/nodes/PlayerPositionNode',
	'game/nodes/FightNode',
	'game/nodes/player/PlayerStatsNode',
	'game/nodes/player/PlayerResourcesNode',
	'game/nodes/PlayerLocationNode',
	'game/nodes/NearestCampNode',
	'game/nodes/LastVisitedCampNode',
	'game/nodes/sector/CampNode',
	'game/nodes/tribe/TribeUpgradesNode',
	'game/components/common/PositionComponent',
	'game/components/common/ResourcesComponent',
	'game/components/player/BagComponent',
	'game/components/player/ExcursionComponent',
	'game/components/player/ItemsComponent',
	'game/components/player/DeityComponent',
	'game/components/player/PlayerActionComponent',
	'game/components/player/PlayerActionResultComponent',
	'game/components/common/CampComponent',
	'game/components/common/CurrencyComponent',
	'game/components/type/LevelComponent',
	'game/components/sector/improvements/BeaconComponent',
	'game/components/sector/improvements/SectorImprovementsComponent',
	'game/components/sector/improvements/SectorCollectorsComponent',
	'game/components/sector/improvements/WorkshopComponent',
	'game/components/sector/ReputationComponent',
	'game/components/sector/SectorFeaturesComponent',
	'game/components/sector/SectorLocalesComponent',
	'game/components/sector/SectorStatusComponent',
	'game/components/sector/LastVisitedCampComponent',
	'game/components/sector/PassagesComponent',
	'game/components/sector/OutgoingCaravansComponent',
	'game/components/sector/events/CampEventTimersComponent',
	'game/components/sector/events/TraderComponent',
	'game/components/common/LogMessagesComponent',
	'game/systems/ui/UIOutHeaderSystem',
	'game/systems/ui/UIOutTabBarSystem',
	'game/systems/ui/UIOutLevelSystem',
	'game/systems/FaintingSystem',
	'game/systems/PlayerPositionSystem',
	'text/Text',
	'utils/StringUtils'
], function (Ash, GameGlobals, GlobalSignals,
	GameConstants, CampConstants, FollowerConstants, LogConstants, ImprovementConstants, PositionConstants, MovementConstants, PlayerActionConstants, PlayerStatConstants, ItemConstants, PerkConstants, FightConstants, TradeConstants, UpgradeConstants, TextConstants,
	PositionVO, LocaleVO, ResultVO,
	PlayerPositionNode, FightNode, PlayerStatsNode, PlayerResourcesNode, PlayerLocationNode,
	NearestCampNode, LastVisitedCampNode, CampNode, TribeUpgradesNode,
	PositionComponent, ResourcesComponent,
	BagComponent, ExcursionComponent, ItemsComponent, DeityComponent, PlayerActionComponent, PlayerActionResultComponent,
	CampComponent, CurrencyComponent, LevelComponent, BeaconComponent, SectorImprovementsComponent, SectorCollectorsComponent, WorkshopComponent,
	ReputationComponent, SectorFeaturesComponent, SectorLocalesComponent, SectorStatusComponent, LastVisitedCampComponent,
	PassagesComponent, OutgoingCaravansComponent, CampEventTimersComponent, TraderComponent,
	LogMessagesComponent,
	UIOutHeaderSystem, UIOutTabBarSystem, UIOutLevelSystem, FaintingSystem, PlayerPositionSystem,
	Text, StringUtils
) {
	var PlayerActionFunctions = Ash.System.extend({

		playerPositionNodes: null,
		playerLocationNodes: null,
		nearestCampNodes: null,
		lastVisitedCamps: null,
		campNodes: null,
		fightNodes: null,
		playerStatsNodes: null,
		playerResourcesNodes: null,
		tribeUpgradesNodes: null,

		engine: null,

		constructor: function (engine) {
			this.engine = engine;
			this.playerPositionNodes = engine.getNodeList(PlayerPositionNode);
			this.playerLocationNodes = engine.getNodeList(PlayerLocationNode);
			this.nearestCampNodes = engine.getNodeList(NearestCampNode);
			this.lastVisitedCamps = engine.getNodeList(LastVisitedCampNode);
			this.campNodes = engine.getNodeList(CampNode);
			this.fightNodes = engine.getNodeList(FightNode);
			this.playerStatsNodes = engine.getNodeList(PlayerStatsNode);
			this.playerResourcesNodes = engine.getNodeList(PlayerResourcesNode);
			this.tribeUpgradesNodes = engine.getNodeList(TribeUpgradesNode);
		},

		addLogMessage: function (msgID, msg, replacements, values, pendingPosition) {
			var playerPosition = this.playerPositionNodes.head.position;
			var logComponent = this.playerPositionNodes.head.entity.get(LogMessagesComponent);
			if (pendingPosition && !pendingPosition.equals(playerPosition)) {
				logComponent.addMessage(msgID, msg, replacements, values, pendingPosition.level, pendingPosition.sectorId(), pendingPosition.inCamp);
			} else {
				logComponent.addMessage(msgID, msg, replacements, values);
			}
		},

		startAction: function (action, param) {
			// log.i("start action: " + action + " | " + param);
			
			if (this.currentAction && !this.isSubAction(action)) {
				log.w("有一个未完成的动作: " + this.currentAction + " (试图启动: " + action + ")");
				return;
			}
			
			var otherSector = this.getActionSector(action, param);
			if (!GameGlobals.playerActionsHelper.checkAvailability(action, true, otherSector)) {
				return false;
			}
			
			GlobalSignals.actionStartingSignal.dispatch(action, param);
			var deductedCosts = GameGlobals.playerActionsHelper.deductCosts(action);

			var baseId = GameGlobals.playerActionsHelper.getBaseActionID(action);
			var duration = PlayerActionConstants.getDuration(baseId);
			if (duration > 0) {
				this.startBusy(action, param, deductedCosts);
			} else {
				this.performAction(action, param, deductedCosts);
			}
			GlobalSignals.actionStartedSignal.dispatch(action, param);
			return true;
		},

		startBusy: function (action, param, deductedCosts) {
			var baseId = GameGlobals.playerActionsHelper.getBaseActionID(action);
			var duration = PlayerActionConstants.getDuration(baseId);
			if (duration > 0) {
				var isBusy = PlayerActionConstants.isBusyAction(baseId);
				var endTimeStamp = this.playerStatsNodes.head.entity.get(PlayerActionComponent).addAction(action, duration, param, deductedCosts, isBusy);

				switch (baseId) {
					case "send_caravan":
						var tradePartnerOrdinal = parseInt(param);
						var caravansComponent = this.playerLocationNodes.head.entity.get(OutgoingCaravansComponent);
						if (!caravansComponent.pendingCaravan) {
							log.w("无法启动商队车. 没有找到有效的待定商队.");
							return;
						}
						
						// TODO fix the time so it responds to time cheat
						caravansComponent.pendingCaravan.returnTimeStamp = endTimeStamp;
						caravansComponent.pendingCaravan.returnDuration = duration;
						caravansComponent.outgoingCaravans.push(caravansComponent.pendingCaravan);
						caravansComponent.pendingCaravan = null;
						this.addLogMessage(LogConstants.MSG_ID_START_SEND_CAMP, "一队商队出发了.");
						GlobalSignals.caravanSentSignal.dispatch();
						break;
						
					case "use_in_home":
						var perksComponent = this.playerStatsNodes.head.perks;
						var hasStaminaPerk = perksComponent.hasPerk(PerkConstants.perkIds.staminaBonus);
						if (hasStaminaPerk) {
							perksComponent.removePerkById(PerkConstants.perkIds.staminaBonus);
							this.playerStatsNodes.head.stamina.isPendingPenalty = true;
						}
						break;
				}
			}
		},

		performAction: function (action, param, deductedCosts) {
			var baseId = GameGlobals.playerActionsHelper.getBaseActionID(action);
			
			switch (baseId) {
				// Out improvements
				case "build_out_collector_water": this.buildBucket(param); break;
				case "build_out_collector_food": this.buildTrap(param); break;
				case "build_out_beacon": this.buildBeacon(param); break;
				case "use_out_collector_water": this.collectWater(param); break;
				case "use_out_collector_water_one": this.collectWater(param, 1); break;
				case "use_out_collector_food": this.collectFood(param); break;
				case "use_out_collector_food_one": this.collectFood(param, 1); break;
				case "build_out_camp": this.buildCamp(param); break;
				case "build_out_passage_down_stairs": this.buildPassageDownStairs(param); break;
				case "build_out_passage_down_elevator": this.buildPassageDownElevator(param); break;
				case "build_out_passage_down_hole": this.buildPassageDownHole(param); break;
				case "build_out_passage_up_stairs": this.buildPassageUpStairs(param); break;
				case "build_out_passage_up_elevator": this.buildPassageUpElevator(param); break;
				case "build_out_passage_up_hole": this.buildPassageUpHole(param); break;
				case "build_out_greenhouse": this.buildGreenhouse(param); break;
				case "build_out_tradepost_connector": this.buildTradeConnector(param); break;
				case "build_out_spaceship1": this.buildSpaceShip1(param); break;
				case "build_out_spaceship2": this.buildSpaceShip2(param); break;
				case "build_out_spaceship3": this.buildSpaceShip3(param); break;
				case "improve_out": this.improveOutImprovement(param); break;
				// In improvements
				case "build_in_campfire": this.buildCampfire(param); break;
				case "build_in_house": this.buildHouse(param); break;
				case "build_in_house2": this.buildHouse2(param); break;
				case "build_in_storage": this.buildStorage(param); break;
				case "build_in_generator": this.buildGenerator(param); break;
				case "build_in_darkfarm": this.buildDarkFarm(param); break;
				case "build_in_hospital": this.buildHospital(param); break;
				case "build_in_ceiling": this.buildCeiling(param); break;
				case "build_in_inn": this.buildInn(param); break;
				case "build_in_tradepost": this.buildTradingPost(param); break;
				case "build_in_library": this.buildLibrary(param); break;
				case "build_in_market": this.buildMarket(param); break;
				case "build_in_fortification": this.buildFortification(param); break;
				case "build_in_aqueduct": this.buildAqueduct(param); break;
				case "build_in_stable": this.buildStable(param); break;
				case "build_in_barracks": this.buildBarracks(param); break;
				case "build_in_apothecary": this.buildApothecary(param); break;
				case "build_in_smithy": this.buildSmithy(param); break;
				case "build_in_cementmill": this.buildCementMill(param); break;
				case "build_in_radiotower": this.buildRadioTower(param); break;
				case "build_in_lights": this.buildLights(param); break;
				case "build_in_square": this.buildSquare(param); break;
				case "build_in_garden": this.buildGarden(param); break;
				case "build_in_shrine": this.buildShrine(param); break;
				case "build_in_temple": this.buildTemple(param); break;
				case "build_in_researchcenter": this.buildResearchCenter(param); break;
				case "use_in_home": this.useHome(param); break;
				case "use_in_campfire": this.useCampfire(param); break;
				case "use_in_market": this.useMarket(param); break;
				case "use_in_hospital": this.useHospital(param); break;
				case "use_in_hospital_2": this.useHospital2(param); break;
				case "use_in_temple": this.useTemple(param); break;
				case "use_in_shrine": this.useShrine(param); break;
				case "improve_in": this.improveBuilding(param); break;
				// Item actions
				case "craft": this.craftItem(param); break;
				case "equip": this.equipItem(param); break;
				case "unequip": this.unequipItem(param); break;
				case "discard": this.discardItem(param); break;
				case "use_item": this.useItem(param, deductedCosts); break;
				case "use_item_fight": this.useItemFight(param); break;
				// Non-improvement actions
				case "enter_camp": this.enterCamp(param); break;
				case "scavenge": this.scavenge(param); break;
				case "scout": this.scout(param); break;
				case "scout_locale_i": this.scoutLocale(param); break;
				case "scout_locale_u": this.scoutLocale(param); break;
				case "clear_workshop": this.clearWorkshop(param); break;
				case "clear_waste_t": this.clearWaste(action, param); break;
				case "clear_waste_r": this.clearWaste(action, param); break;
				case "bridge_gap": this.bridgeGap(param); break;
				case "clear_debris": this.clearDebris(param); break;
				case "use_spring": this.useSpring(param); break;
				case "fight_gang": this.fightGang(param); break;
				case "send_caravan": this.sendCaravan(param); break;
				case "trade_with_caravan": this.tradeWithCaravan(); break;
				case "recruit_follower": this.recruitFollower(param); break;
				case "dismiss_recruit": this.dismissRecruit(param); break;
				case "dismiss_follower": this.dismissFollower(param); break;
				case "select_follower": this.selectFollower(param); break;
				case "deselect_follower": this.deselectFollower(param); break;
				case "nap": this.nap(param); break;
				case "wait": this.wait(param); break;
				case "despair": this.despair(param); break;
				case "unlock_upgrade": this.unlockUpgrade(param); break;
				case "create_blueprint": this.createBlueprint(param); break;
				case "launch": this.launch(param); break;
				// Mapped directly in UIFunctions
				case "leave_camp": break;
				case "fight": break;
				// Movement
				case "move_level_up": this.moveTo(PositionConstants.DIRECTION_UP); break;
				case "move_level_down": this.moveTo(PositionConstants.DIRECTION_DOWN); break;
				case "move_camp_level": this.moveTo(PositionConstants.DIRECTION_CAMP); break;
				case "move_sector_north": this.moveTo(PositionConstants.DIRECTION_NORTH); break;
				case "move_sector_east": this.moveTo(PositionConstants.DIRECTION_EAST); break;
				case "move_sector_south": this.moveTo(PositionConstants.DIRECTION_SOUTH); break;
				case "move_sector_west": this.moveTo(PositionConstants.DIRECTION_WEST); break;
				case "move_sector_ne": this.moveTo(PositionConstants.DIRECTION_NE); break;
				case "move_sector_se": this.moveTo(PositionConstants.DIRECTION_SE); break;
				case "move_sector_sw": this.moveTo(PositionConstants.DIRECTION_SW); break;
				case "move_sector_nw": this.moveTo(PositionConstants.DIRECTION_NW); break;
				case "move_camp_global": this.moveToCamp(param); break;
				default:
					log.w("没有函数映射到动作 " + action + " 上，在 PlayerActionFunctions.performAction");
					break;
			}
		},
		
		completeAction: function (action) {
			if (this.currentAction == action)
				this.currentAction = null;
			GameGlobals.uiFunctions.completeAction(action);
			GlobalSignals.actionCompletedSignal.dispatch();
		},
		
		getPositionVO: function (sectorPos) {
			var l = parseInt(sectorPos.split(".")[0]);
			var sX = parseInt(sectorPos.split(".")[1]);
			var sY = parseInt(sectorPos.split(".")[2]);
			return new PositionVO(l, sX, sY);
		},

		getActionSector: function (action, param) {
			if (!param) return null;
			var position = this.getPositionVO(param);
			return GameGlobals.levelHelper.getSectorByPosition(position.level, position.sectorX, position.sectorY);
		},

		moveTo: function (direction) {
			var playerPos = this.playerPositionNodes.head.position;
			switch (direction) {
				case PositionConstants.DIRECTION_WEST:
					playerPos.sectorX--;
					break;
				case PositionConstants.DIRECTION_NORTH:
					playerPos.sectorY--;
					break;
				case PositionConstants.DIRECTION_SOUTH:
					playerPos.sectorY++;
					break;
				case PositionConstants.DIRECTION_EAST:
					playerPos.sectorX++;
					break;
				case PositionConstants.DIRECTION_NE:
					playerPos.sectorX++;
					playerPos.sectorY--;
					break;
				case PositionConstants.DIRECTION_SE:
					playerPos.sectorX++;
					playerPos.sectorY++;
					break;
				case PositionConstants.DIRECTION_SW:
					playerPos.sectorX--;
					playerPos.sectorY++;
					break;
				case PositionConstants.DIRECTION_NW:
					playerPos.sectorX--;
					playerPos.sectorY--;
					break;
				case PositionConstants.DIRECTION_UP:
					playerPos.level++;
					break;
				case PositionConstants.DIRECTION_DOWN:
					playerPos.level--;
					break;
				case PositionConstants.DIRECTION_CAMP:
					if (this.nearestCampNodes.head) {
						var campSector = this.nearestCampNodes.head.entity;
						var campPosition = campSector.get(PositionComponent);
						playerPos.level = campPosition.level;
						playerPos.sectorX = campPosition.sectorX;
						playerPos.sectorY = campPosition.sectorY;
						this.enterCamp(true);
					}
					break;

				default:
					log.w("未知控制方向: " + direction);
					break;
			}
		},

		moveToCamp: function (param) {
			let campOrdinal = parseInt(param);
			let campSector = null;
			for (var node = this.campNodes.head; node; node = node.next) {
				let campPosition = node.position;
				let foundCampOrdinal = GameGlobals.gameState.getCampOrdinal(campPosition.level);
				if (foundCampOrdinal == campOrdinal) {
					campSector = node.entity;
					break;
				}
			}
			
			if (!campSector) {
				log.w("没有在这层发现营地 " + level);
				return;
			}

			var playerPos = this.playerPositionNodes.head.position;
			campPosition = campSector.get(PositionComponent);
			playerPos.level = campPosition.level;
			playerPos.sectorX = campPosition.sectorX;
			playerPos.sectorY = campPosition.sectorY;
			this.engine.getSystem(PlayerPositionSystem).update();
			this.enterCamp(true);
			GlobalSignals.playerMovedSignal.dispatch(playerPos);
		},

		moveResFromCampToBag: function (resourcesVO) {
			var playerLevelCamp = this.nearestCampNodes.head !== null ? this.nearestCampNodes.head.entity : null;
			if (playerLevelCamp) {
				var playerResources = this.playerResourcesNodes.head.resources.resources;
				var campResourcesSource = GameGlobals.resourcesHelper.getCurrentStorage().resources;
				this.moveResourcesFromVOToVO(resourcesVO, campResourcesSource, playerResources);
			}
		},

		moveResFromBagToCamp: function () {
			var playerLevelCamp = this.nearestCampNodes.head !== null ? this.nearestCampNodes.head.entity : null;
			var playerResources = this.playerResourcesNodes.head.resources.resources;
			var campResourcesSource = playerLevelCamp.get(ResourcesComponent).resources;
			this.moveResourcesFromVOToVO(playerResources, playerResources, campResourcesSource);
		},

		moveCurrencyFromBagToCamp: function (campSector) {
			var playerLevelCamp = this.nearestCampNodes.head !== null ? this.nearestCampNodes.head.entity : null;
			campSector = campSector || this.nearestCampNodes.head.entity;
			var playerCurrency = this.playerResourcesNodes.head.entity.get(CurrencyComponent);
			var campCurrency = campSector.get(CurrencyComponent);
			campCurrency.currency += playerCurrency.currency;
			playerCurrency.currency = 0;
		},

		moveResourcesFromVOToVO: function (amountsVO, fromResVO, toResVO) {
			for (var key in resourceNames) {
				var name = resourceNames[key];
				var amount = Math.min(amountsVO.getResource(name), fromResVO.getResource(name));
				if (amount > 0) {
					toResVO.addResource(name, amount);
					fromResVO.addResource(name, -amount);
				}
			}
		},

		updateCarriedItems: function (selectedItems) {
			var itemsComponent = this.playerPositionNodes.head.entity.get(ItemsComponent);
			var allItems = itemsComponent.getAll(true);
			for (let i = 0; i < allItems.length; i++) {
				var item = allItems[i];
				if (item.equipped) {
					item.carried = true;
				} else if (item.type === ItemConstants.itemTypes.uniqueEquipment) {
					item.carried = true;
				} else {
					var countCarried = selectedItems[item.id];
					if (countCarried > 0) {
						item.carried = true;
						selectedItems[item.id]--;
					} else {
						item.carried = false;
					}
				}
			}
			
			itemsComponent.uniqueItems = null;
			itemsComponent.uniqueItemsCarried = null;
		},

		enterCamp: function (logMessage) {
			var playerPos = this.playerPositionNodes.head.position;
			var campNode = this.nearestCampNodes.head;
			if (campNode && campNode.position.level === playerPos.level && campNode.position.sectorId() === playerPos.sectorId()) {
				if (!playerPos.inCamp) {
					playerPos.inCamp = true;
					if (GameGlobals.resourcesHelper.hasCampStorage()) {
						this.moveResFromBagToCamp();
					}
					this.moveCurrencyFromBagToCamp();
					
					this.playerPositionNodes.head.entity.remove(ExcursionComponent);

					if (logMessage) this.addLogMessage(LogConstants.MSG_ID_ENTER_CAMP, "进入营地.");
					GameGlobals.uiFunctions.showTab(GameGlobals.uiFunctions.elementIDs.tabs.in);
				}
				GlobalSignals.playerMovedSignal.dispatch(playerPos);
				GlobalSignals.playerEnteredCampSignal.dispatch();
				this.forceTabUpdate();
				this.save();
				this.updateLastVisitedCamp(campNode.entity);
			} else {
				playerPos.inCamp = false;
				log.w("没有找到有效的营地.");
			}
		},

		enterOutTab: function () {
			var playerPos = this.playerPositionNodes.head.position;
			if (playerPos.inCamp && !GameGlobals.resourcesHelper.hasCampStorage()) this.leaveCamp();
		},

		leaveCamp: function () {
			var playerPos = this.playerPositionNodes.head.position;
			var campNode = this.nearestCampNodes.head;
			if (campNode && campNode.position.level === playerPos.level && campNode.position.sectorId() === playerPos.sectorId()) {
				var sunlit = campNode.entity.get(SectorFeaturesComponent).sunlit;
				playerPos.inCamp = false;
				this.playerPositionNodes.head.entity.add(new ExcursionComponent());
				var msg = "离开营地. " + (sunlit ? "阳光是锐利而无情的." : "城市的黑暗笼罩着你.");
				this.addLogMessage(LogConstants.MSG_ID_LEAVE_CAMP, msg);
				GameGlobals.uiFunctions.showTab(GameGlobals.uiFunctions.elementIDs.tabs.out);
				GlobalSignals.playerLeftCampSignal.dispatch();
				GlobalSignals.playerMovedSignal.dispatch(playerPos);
				this.forceTabUpdate();
				this.save();
			} else {
				log.w("没有找到有效的营地. (玩家位置: " + playerPos + ")");
			}
		},

		scavenge: function () {
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			var efficiency = GameGlobals.playerActionResultsHelper.getCurrentScavengeEfficiency();
			GameGlobals.gameState.unlockedFeatures.scavenge = true;

			var logMsg = "";
			var playerMaxVision = this.playerStatsNodes.head.vision.maximum;
			var sector = this.playerLocationNodes.head.entity;
			var sunlit = sector.get(SectorFeaturesComponent).sunlit;
			
			if (playerMaxVision <= PlayerStatConstants.VISION_BASE) {
				if (sunlit) logMsg = "盲目地寻找战利品. ";
				else logMsg = "在黑暗中翻找. ";
			} else {
				logMsg = "去清理. ";
			}

			var logMsgSuccess = logMsg;
			var logMsgFlee = logMsg + "一无所得地逃走.";
			var logMsgDefeat = logMsg + "打了一架，被打败了.";
			let sys = this;
			var successCallback = function () {
				let scavengedPercentBefore = sectorStatus.getScavengedPercent();
				sectorStatus.scavenged = true;
				sectorStatus.weightedNumScavenges += Math.min(1, efficiency);
				let scavengedPercentAfter = sectorStatus.getScavengedPercent();
				let warningThreshold = 75;
				if (scavengedPercentBefore < warningThreshold && scavengedPercentAfter >= warningThreshold) {
					sys.addLogMessage(LogConstants.getUniqueID(), "这里没有多少东西可以吃了.");
				}
			};
			this.handleOutActionResults("scavenge", LogConstants.MSG_ID_SCAVENGE, logMsgSuccess, logMsgFlee, logMsgDefeat, true, null, successCallback);
		},

		scout: function () {
			var sector = this.playerLocationNodes.head.entity;
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			var featuresComponent = this.playerLocationNodes.head.entity.get(SectorFeaturesComponent);
			var improvements = this.playerLocationNodes.head.entity.get(SectorImprovementsComponent);
			
			if (sectorStatus.scouted) {
				log.w("已勘察过的区域.");
				return;
			}
			
			if (!GameGlobals.gameState.unlockedFeatures.evidence) {
				GameGlobals.gameState.unlockedFeatures.evidence = true;
				GlobalSignals.featureUnlockedSignal.dispatch();
			}

			if (!GameGlobals.gameState.unlockedFeatures.scout) {
				GameGlobals.gameState.unlockedFeatures.scout = true;
				GlobalSignals.featureUnlockedSignal.dispatch();
			}
			
			var level = sector.get(PositionComponent).level;

			var logMsg = "考察了该地区.";
			var found = false;
			var sunlit = featuresComponent.sunlit;
			if (featuresComponent.hasSpring) {
				found = true;
				logMsg += "<br/>找到 " + Text.addArticle(TextConstants.getSpringName(featuresComponent)) + ".";
			}
			
			if (featuresComponent.hasTradeConnectorSpot && !GameGlobals.levelHelper.getFirstScoutedSectorWithFeatureOnLevel(level, "hasTradeConnectorSpot")) {
				found = true;
				logMsg += "<br/>找了个好地方来做更大的建筑工程.";
			}
			
			var workshopComponent = sector.get(WorkshopComponent);
			if (workshopComponent && workshopComponent.isClearable) {
				found = true;
				logMsg += "<br/>找到 " + Text.addArticle(TextConstants.getWorkshopName(workshopComponent.resource));
			}
			
			if (featuresComponent.campable) {
				if (!this.nearestCampNodes.head || this.nearestCampNodes.head.position.level != this.playerLocationNodes.head.position.level) {
					found = true;
					logMsg += "<br/>这里似乎是个露营的好地方.";
				}
			}

			let passagesComponent = this.playerLocationNodes.head.entity.get(PassagesComponent);
			if (passagesComponent.passageUp) {
				let passageUpBuilt = improvements.getCount(improvementNames.passageUpStairs) +
					improvements.getCount(improvementNames.passageUpElevator) +
					improvements.getCount(improvementNames.passageUpHole) > 0;
				found = true;
				logMsg += "<br/>" + TextConstants.getPassageFoundMessage(passagesComponent.passageUp, PositionConstants.DIRECTION_UP, sunlit, passageUpBuilt) + " ";
			}

			if (passagesComponent.passageDown) {
				let passageDownBuilt = improvements.getCount(improvementNames.passageDownStairs) +
					improvements.getCount(improvementNames.passageDownElevator) +
					improvements.getCount(improvementNames.passageDownHole) > 0;
				found = true;
				logMsg += "<br/>" + TextConstants.getPassageFoundMessage(passagesComponent.passageDown, PositionConstants.DIRECTION_DOWN, sunlit, passageDownBuilt) + " ";
			}

			var sectorLocalesComponent = sector.get(SectorLocalesComponent);
			if (sectorLocalesComponent.locales.length > 0) {
				found = true;
				var locale = sectorLocalesComponent.locales[0];
				if (sectorLocalesComponent.locales.length > 1)
					logMsg += "<br/>这里有一些有趣的建筑.";
				else
					logMsg += "<br/>这是一个" + TextConstants.getLocaleName(locale, featuresComponent, true).toLowerCase() + " ， 这一点似乎值得研究.";
			}
			
			if (featuresComponent.waymarks.length > 0) {
				let sectorFeatures = GameGlobals.sectorHelper.getTextFeatures(sector);
				for (let i = 0; i < featuresComponent.waymarks.length; i++) {
					logMsg += "<br/>" + TextConstants.getWaymarkText(featuresComponent.waymarks[i], sectorFeatures);
				}
			}

			var playerActionFunctions = this;
			var successCallback = function () {
				sectorStatus.scouted = true;
				sectorStatus.scoutedTimestamp = new Date().getTime() / 1000;
				GlobalSignals.sectorScoutedSignal.dispatch();
				playerActionFunctions.completeAction("scout");
				playerActionFunctions.engine.getSystem(UIOutLevelSystem).rebuildVis();
				playerActionFunctions.save();
			};
			

			var logMsgId = found ? LogConstants.MSG_ID_SCOUT_FOUND_SOMETHING : LogConstants.MSG_ID_SCOUT;
			this.handleOutActionResults("scout", logMsgId, logMsg, logMsg, logMsg, true, found, successCallback);
		},

		scoutLocale: function (i) {
			if (!this.playerLocationNodes.head) return;
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			var sectorLocalesComponent = this.playerLocationNodes.head.entity.get(SectorLocalesComponent);
			var sectorFeaturesComponent = this.playerLocationNodes.head.entity.get(SectorFeaturesComponent);
			var localeVO = sectorLocalesComponent.locales[i];
			if (!localeVO) {
				log.w("没有这样的地区 " + i + "/" + sectorLocalesComponent.locales.length);
				return;
			}
			var action = "scout_locale_" + localeVO.getCategory() + "_" + i;

			// TODO add more interesting log messages - especially for trade partners
			var localeName = TextConstants.getLocaleName(localeVO, sectorFeaturesComponent);
			localeName = localeName.split(" ")[localeName.split(" ").length - 1];
			var baseMsg = "选定 " + localeName + ". ";
			var logMsgSuccess = baseMsg;
			var logMsgFlee = baseMsg + " 惊讶而逃.";
			var logMsgDefeat = baseMsg + " 惊讶且被击败.";
			
			var tradingPartner = null;
			if (localeVO.type === localeTypes.tradingpartner) {
				var playerPos = this.playerPositionNodes.head.position;
				var level = playerPos.level;
				var campOrdinal = GameGlobals.gameState.getCampOrdinal(level);
				if (GameGlobals.gameState.foundTradingPartners.indexOf(campOrdinal) < 0) {
					var partner = TradeConstants.getTradePartner(campOrdinal);
					if (partner) {
						var partnerName = partner.name;
						logMsgSuccess += "<br/>找到 一个新 <span class='hl-functionality'>贸易伙伴</span>. 他们称这个地方为 " + partnerName + ".";
						tradingPartner = campOrdinal;
					}
				}
			}
			if (localeVO.type == localeTypes.grove) {
				GameGlobals.gameState.unlockedFeatures.favour = true;
				GlobalSignals.featureUnlockedSignal.dispatch();
				if (!this.playerStatsNodes.head.entity.has(DeityComponent)) {
					this.playerStatsNodes.head.entity.add(new DeityComponent())
				}
				this.playerStatsNodes.head.stamina.stamina += PlayerStatConstants.STAMINA_GAINED_FROM_GROVE;
				logMsgSuccess += "这些树好像是活的。他们窃窃私语，但言语却听不懂. 你已经找到了 <span class='hl-functionality'>上古之力</span>的来源.";
			}

			var playerActionFunctions = this;
			var successCallback = function () {
				sectorStatus.localesScouted[i] = true;
				if (tradingPartner) {
					GameGlobals.gameState.foundTradingPartners.push(tradingPartner);
					if (!GameGlobals.gameState.unlockedFeatures.trade) {
						GameGlobals.gameState.unlockedFeatures.trade = true;
						GlobalSignals.featureUnlockedSignal.dispatch();
					}
				}
				playerActionFunctions.engine.getSystem(UIOutLevelSystem).rebuildVis();
				playerActionFunctions.save();
			};

			this.handleOutActionResults(action, LogConstants.MSG_ID_SCOUT_LOCALE, logMsgSuccess, logMsgFlee, logMsgDefeat, true, tradingPartner != null, successCallback);
		},

		useSpring: function () {
			var sector = this.playerLocationNodes.head.entity;
			var sectorFeatures = sector.get(SectorFeaturesComponent);
			var springName = TextConstants.getSpringName(sectorFeatures);

			var logMsgSuccess = "把水重新加满 " + springName + ".";
			var logMsgFailBase = "接近了 " + springName + ", 但是被攻击了. ";
			var logMsgFlee = logMsgFailBase + "一无所得地逃走.";
			var logMsgDefeat = logMsgFailBase + "输掉了战斗.";

			this.handleOutActionResults("use_spring", LogConstants.MSG_ID_USE_SPRING, logMsgSuccess, logMsgFlee, logMsgDefeat, true, false);
		},

		clearWorkshop: function () {
			let playerPosition = this.playerPositionNodes.head.position;
			let workshopComponent = this.playerLocationNodes.head.entity.get(WorkshopComponent);
			
			let currentLevel = playerPosition.level;
			let campOrdinal = GameGlobals.gameState.getCampOrdinal(currentLevel);
			let campLevel = GameGlobals.gameState.getLevelForCamp(campOrdinal);
			
			let name = TextConstants.getWorkshopName(workshopComponent.resource);
			let action = "clear_workshop";
			let logMsgSuccess = "车间清理好了。工人们现在可以使用它了.";
			let logMsgFlee = "逃离 " + name + ".";
			let logMsgDefeat = "被赶出了 " + name + ".";

			if (campLevel != currentLevel) {
				logMsgSuccess = "车间清理好了。 " + campLevel + " 层的工人现在可以使用了.";
			}

			let playerActionFunctions = this;
			let successCallback = function () {
				GameGlobals.gameState.unlockedFeatures.resources[workshopComponent.resource] = true;
				playerActionFunctions.engine.getSystem(UIOutLevelSystem).rebuildVis();
			};

			this.handleOutActionResults(action, LogConstants.MSG_ID_WORKSHOP_CLEARED, logMsgSuccess, logMsgFlee, logMsgDefeat, true, true, successCallback);
		},

		clearWaste: function (action, direction) {
			log.i("clear waste " + direction);
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			var positionComponent = this.playerLocationNodes.head.entity.get(PositionComponent);
			var passagesComponent = this.playerLocationNodes.head.entity.get(PassagesComponent);
			var blocker = passagesComponent.getBlocker(direction);
			
			if (!blocker) {
				log.w("不能清除废物-这里没有阻滞剂");
				return;
			}

			var logMsgSuccess = "清理垃圾。该地区现在可以安全通行了.";
			var logMsgFailBase = "试图清理垃圾，但被攻击了. ";
			var logMsgFlee = logMsgFailBase + "Feld 操作完成前.";
			var logMsgDefeat = logMsgFailBase + "输掉了战斗.";

			var sys = this;
			var successCallback = function () {
				var sectorPos = positionComponent.level + "." + positionComponent.sectorId() + "." + direction;
				sys.clearBlocker(action, blocker.type, sectorPos);
			};

			this.handleOutActionResults(action, LogConstants.MSG_ID_CLEAR_WASTE, logMsgSuccess, logMsgFlee, logMsgDefeat, true, false, successCallback);
		},

		bridgeGap: function (sectorPos) {
			this.clearBlocker("bridge_gap", MovementConstants.BLOCKER_TYPE_GAP, sectorPos);
			this.addLogMessage(LogConstants.MSG_ID_BRIDGED_GAP, "建好了一座桥.");
		},
		
		clearDebris: function (sectorPos) {
			this.clearBlocker("clear_debris", MovementConstants.BLOCKER_TYPE_DEBRIS, sectorPos);
			this.addLogMessage(LogConstants.MSG_ID_CLEAR_DEBRIS, "派了一队人去清理残骸.");
		},
		
		clearBlocker: function (action, blockerType, sectorPos) {
			// parse sector pos
			var direction = parseInt(sectorPos.split(".")[3]);
			var sector = this.getActionSector(action, sectorPos);
			var positionComponent = sector.get(PositionComponent);
			
			// find neighbour
			var oppositeDirection = PositionConstants.getOppositeDirection(direction);
			var neighbourPos = PositionConstants.getPositionOnPath(positionComponent.getPosition(), direction, 1);
			var neighbour = GameGlobals.levelHelper.getSectorByPosition(neighbourPos.level, neighbourPos.sectorX, neighbourPos.sectorY);
			
			// set status
			var sectorStatus = sector.get(SectorStatusComponent);
			sectorStatus.setBlockerCleared(direction, blockerType);
			var neighbourStatus = neighbour.get(SectorStatusComponent);
			neighbourStatus.setBlockerCleared(oppositeDirection, blockerType);
		
			// complete
			this.completeAction(action);
			GlobalSignals.movementBlockerClearedSignal.dispatch();
		},

		nap: function () {
			var sys = this;
			var excursionComponent = sys.playerStatsNodes.head.entity.get(ExcursionComponent);
			GameGlobals.uiFunctions.setGameElementsVisibility(false);
			GameGlobals.uiFunctions.showInfoPopup(
				"休息",
				"找了个长凳睡觉，试着恢复体力.",
				"继续",
				null,
				() => {
					GameGlobals.uiFunctions.hideGame(false);
					this.passTime(60, function () {
						setTimeout(function () {
							GameGlobals.uiFunctions.showGame();
							GameGlobals.uiFunctions.onPlayerMoved(); // reset cooldowns
							if (excursionComponent) excursionComponent.numNaps++;
							sys.playerStatsNodes.head.vision.value = Math.min(sys.playerStatsNodes.head.vision.value, PlayerStatConstants.VISION_BASE);
							var logMsgSuccess = "找了个长凳睡觉。几乎没有休息过.";
							var logMsgFlee = "想休息，但被攻击了.";
							var logMsgDefeat = logMsgFlee;
							sys.handleOutActionResults("nap", LogConstants.MSG_ID_NAP, logMsgSuccess, logMsgFlee, logMsgDefeat, false, false,
								function () {
									sys.playerStatsNodes.head.stamina.stamina += PlayerStatConstants.STAMINA_GAINED_FROM_NAP;
								},
							);
						}, 300);
					});
				}
			);
		},
		
		wait: function () {
			var sys = this;
			GameGlobals.uiFunctions.setGameElementsVisibility(false);
			GameGlobals.uiFunctions.showInfoPopup(
				"等待",
				"在等待中度过了一段时间.",
				"继续",
				null,
				() => {
					GameGlobals.uiFunctions.hideGame(false);
					this.passTime(60, function () {
						setTimeout(function () {
							GameGlobals.uiFunctions.showGame();
							GameGlobals.uiFunctions.onPlayerMoved(); // reset cooldowns
							var logMsgSuccess = "等了一段时间.";
							var logMsgFlee = "安定下来打发时间，却被袭击了.";
							var logMsgDefeat = logMsgFlee;
							sys.handleOutActionResults("wait", LogConstants.MSG_ID_WAIT, logMsgSuccess, logMsgFlee, logMsgDefeat, false, false,
								function () {},
							);
						}, 300);
					});
				}
			);
		},

		handleOutActionResults: function (action, logMsgId, logMsgSuccess, logMsgFlee, logMsgDefeat, showResultPopup, hasCustomReward, successCallback, failCallback) {
			this.currentAction = action;
			var playerActionFunctions = this;
			var baseActionID = GameGlobals.playerActionsHelper.getBaseActionID(action);
			showResultPopup = showResultPopup && !GameGlobals.gameState.uiStatus.isHidden;
			GameGlobals.fightHelper.handleRandomEncounter(action, function () {
				var rewards = GameGlobals.playerActionResultsHelper.getResultVOByAction(action, hasCustomReward);
				var player = playerActionFunctions.playerStatsNodes.head.entity;
				var sector = playerActionFunctions.playerLocationNodes.head.entity;
				var sectorStatus = sector.get(SectorStatusComponent);
				if (!GameGlobals.gameState.isAutoPlaying) player.add(new PlayerActionResultComponent(rewards));
				
				if (rewards && rewards.foundStashVO) {
					sectorStatus.stashesFound++;
					logMsgSuccess += TextConstants.getFoundStashMessage(rewards.foundStashVO);
				}
				
				var discoveredGoods = GameGlobals.playerActionResultsHelper.saveDiscoveredGoods(rewards);
				if (discoveredGoods.items && discoveredGoods.items.length > 0) {
					logMsgSuccess += " 找到了 " + TextConstants.getListText(discoveredGoods.items.map(item => ItemConstants.getItemDisplayName(item).toLowerCase())) + "的来源.";
				}
				
				let popupMsg = logMsgSuccess;
				
				var resultPopupCallback = function (isTakeAll) {
					GameGlobals.playerActionResultsHelper.collectRewards(isTakeAll, rewards);
					if (!GameGlobals.gameState.isAutoPlaying && logMsgSuccess) playerActionFunctions.addLogMessage(logMsgId, logMsgSuccess);
					GameGlobals.playerActionResultsHelper.logResults(rewards);
					playerActionFunctions.forceTabUpdate();
					player.remove(PlayerActionResultComponent);
					if (successCallback) successCallback();
					GlobalSignals.inventoryChangedSignal.dispatch();
					GlobalSignals.sectorScavengedSignal.dispatch();
					playerActionFunctions.completeAction(action);
				};
				
				if (showResultPopup) {
					GameGlobals.uiFunctions.showResultPopup(TextConstants.getActionName(baseActionID), popupMsg, rewards, resultPopupCallback);
				} else {
					resultPopupCallback();
				}
			}, function () {
				playerActionFunctions.completeAction(action);
				if (logMsgFlee) playerActionFunctions.addLogMessage(logMsgId, logMsgFlee);
				if (failCallback) failCallback();
			}, function () {
				playerActionFunctions.completeAction(action);
				if (logMsgDefeat) playerActionFunctions.addLogMessage(logMsgId, logMsgDefeat);
				if (failCallback) failCallback();
			});
		},

		sendCaravan: function (tradePartnerOrdinal) {
			var campOutgoingCaravansComponent;
			var campSector;
			var caravan;
			var caravanI;
			
			// TODO fix this so that if several camps send a caravan to the same destination they don't get mixed
			// make a proper system for outgoing caravans instead of relying on action duration & action params
			for (var node = this.campNodes.head; node; node = node.next) {
				campOutgoingCaravansComponent = node.entity.get(OutgoingCaravansComponent);
				for (let i in campOutgoingCaravansComponent.outgoingCaravans) {
					var caravanVO = campOutgoingCaravansComponent.outgoingCaravans[i];
					if (caravanVO.tradePartnerOrdinal == tradePartnerOrdinal) {
						campSector = node.entity;
						caravan = caravanVO;
						caravanI = i;
						break;
					}
				}
				if (campSector && caravan) {
					break;
				}
			}

			if (!campSector || !caravan) {
				log.w("没有找到匹配的商车.");
				return;
			}

			var tradePartnerOrdinal = caravan.tradePartnerOrdinal;
			var tradePartner = TradeConstants.getTradePartner(parseInt(tradePartnerOrdinal));

			if (!tradePartner) {
				log.w("没有找到匹配的贸易伙伴.");
				log.i(caravan);
				return;
			}
			
			let result = TradeConstants.makeResultVO(caravan);
			var logMsg = GameGlobals.playerActionResultsHelper.getRewardsMessage(result, "贸易商队从 " + tradePartner.name + "来了. ");
			var pendingPosition = campSector.get(PositionComponent).clone();
			pendingPosition.inCamp = true;

			campOutgoingCaravansComponent.outgoingCaravans.splice(caravanI, 1);

			GameGlobals.playerActionResultsHelper.collectRewards(true, result, campSector);
			this.moveCurrencyFromBagToCamp(campSector);
			this.completeAction("send_caravan");

			this.addLogMessage(LogConstants.MSG_ID_FINISH_SEND_CAMP, logMsg.msg, logMsg.replacements, logMsg.values, pendingPosition);
			GlobalSignals.inventoryChangedSignal.dispatch();
		},

		tradeWithCaravan: function () {
			GameGlobals.uiFunctions.popupManager.closePopup("incoming-caravan-popup");

			var traderComponent = this.playerLocationNodes.head.entity.get(TraderComponent);
			var caravan = traderComponent.caravan;

			// items
			var itemsComponent = this.playerPositionNodes.head.entity.get(ItemsComponent);
			for (var itemID in caravan.traderSelectedItems) {
				var amount = caravan.traderSelectedItems[itemID];
				for (let i = 0; i < amount; i++) {
					for (let j = 0; j < caravan.sellItems.length; j++) {
						if (caravan.sellItems[j].id == itemID) {
							caravan.sellItems.splice(j, 1);
							break;
						}
					}
					GameGlobals.playerHelper.addItem(ItemConstants.getItemByID(itemID));
				}
			}

			for (var itemID in caravan.campSelectedItems) {
				var amount = caravan.campSelectedItems[itemID];
				for (let i = 0; i < amount; i++) {
					caravan.sellItems.push(ItemConstants.getItemByID(itemID));
					itemsComponent.discardItem(itemsComponent.getItem(itemID, null, true, false), false);
				}
			}

			// resources
			var campStorage = GameGlobals.resourcesHelper.getCurrentStorage();
			for (var key in resourceNames) {
				var name = resourceNames[key];
				var traderSelectedAmount = caravan.traderSelectedResources.getResource(name);
				if (traderSelectedAmount > 0) {
					caravan.sellResources.addResource(name, -traderSelectedAmount);
					campStorage.resources.addResource(name, traderSelectedAmount);
				}
				var campSelectedAmount = caravan.campSelectedResources.getResource(name);
				if (campSelectedAmount > 0) {
					caravan.sellResources.addResource(name, campSelectedAmount);
					campStorage.resources.addResource(name, -campSelectedAmount);
				}
			}

			// currency
			var currencyComponent = GameGlobals.resourcesHelper.getCurrentCurrency();
			if (caravan.traderSelectedCurrency > 0) {
				caravan.currency -= caravan.traderSelectedCurrency;
				currencyComponent.currency += caravan.traderSelectedCurrency;
				GameGlobals.gameState.unlockedFeatures.currency = true;
			}

			if (caravan.campSelectedCurrency) {
				caravan.currency += caravan.campSelectedCurrency;
				currencyComponent.currency -= caravan.campSelectedCurrency;
			}

			caravan.clearSelection();
			caravan.tradesMade++;
			
			GlobalSignals.inventoryChangedSignal.dispatch();
			this.addLogMessage(LogConstants.MSG_ID_TRADE_WITH_CARAVAN, "与商队交易.");
		},
		
		recruitFollower: function (followerId) {
			let recruitComponent = GameGlobals.campHelper.findRecruitComponentWithFollowerId(followerId);
			
			if (!recruitComponent) {
				log.w("未找到新成员: " + followerId);
				return;
			}
			
			this.playerStatsNodes.head.followers.addFollower(recruitComponent.follower);
			recruitComponent.isRecruited = true;
			
			GameGlobals.gameState.unlockedFeatures.followers = true;
			GlobalSignals.followersChangedSignal.dispatch();
			
			this.addLogMessage(LogConstants.MSG_ID_RECRUIT, "招募了一个新的追随者.");
		},
		
		dismissRecruit: function (followerId) {
			log.i("解雇成员: " + followerId);
			let recruitComponent = GameGlobals.campHelper.findRecruitComponentWithFollowerId(followerId);
			
			if (!recruitComponent) {
				log.w("未找到新成员: " + followerId);
				return;
			}
			
			recruitComponent.isDismissed = true;
		},
		
		dismissFollower: function (followerID) {
			let followersComponent = this.playerStatsNodes.head.followers;
			let follower = followersComponent.getFollowerByID(followerID);
			
			if (!follower) {
				log.w("没有这样的追随者: " + followerID);
				return;
			}
			
			let sys = this;
			GameGlobals.uiFunctions.showConfirmation(
				"你确定要解雇吗 " + follower.name + "?",
				function () {
					followersComponent.removeFollower(follower);
					sys.addLogMessage(LogConstants.getUniqueID(), follower.name + " 离开了.");
					GlobalSignals.followersChangedSignal.dispatch();
				}
			);
		},
		
		selectFollower: function (followerID) {
			let followersComponent = this.playerStatsNodes.head.followers;
			let follower = followersComponent.getFollowerByID(followerID);
			
			if (follower.inParty) {
				log.w("追随者已在party里");
				return;
			}
			
			if (!follower) {
				log.w("没有这样的追随者: " + followerID);
				return;
			}
			
			let followerType = FollowerConstants.getFollowerTypeForAbilityType(follower.abilityType);
			let previous = followersComponent.getFollowerInPartyByType(followerType);
			if (previous) {
				followersComponent.setFollowerInParty(previous, false);
			}
			
			followersComponent.setFollowerInParty(follower, true);
			
			GlobalSignals.followersChangedSignal.dispatch();
		},
		
		deselectFollower: function (followerID) {
			let followersComponent = this.playerStatsNodes.head.followers;
			let follower = followersComponent.getFollowerByID(followerID);
			
			if (!follower) {
				log.w("没有这样的追随者: " + followerID);
				return;
			}
			
			if (!follower.inParty) {
				log.w("不能取消选择不在团队中的追随者");
				return;
			}
			
			followersComponent.setFollowerInParty(follower, false);
			GlobalSignals.followersChangedSignal.dispatch();
		},

		fightGang: function (direction) {
			var action = "fight_gang_" + direction;
			this.currentAction = action;
			var playerActionFunctions = this;
			GameGlobals.fightHelper.handleRandomEncounter(action, function () {
				playerActionFunctions.addLogMessage(LogConstants.MSG_ID_GANG_DEFEATED, "街道很干净.");
				playerActionFunctions.completeAction(action);
				playerActionFunctions.engine.getSystem(UIOutLevelSystem).rebuildVis();
			}, function () {
				// fled
				playerActionFunctions.completeAction(action);
			}, function () {
				// lost
				playerActionFunctions.completeAction(action);
			});
		},

		flee: function () {
			if (GameGlobals.playerActionsHelper.checkAvailability("flee", true)) {
				GameGlobals.playerActionsHelper.deductCosts("flee");
				this.completeAction("flee");
			}
		},

		despair: function () {
			this.engine.getSystem(FaintingSystem).despair();
			this.completeAction("despair");
		},

		buildCamp: function () {
			var sector = this.playerLocationNodes.head.entity;
			var level = GameGlobals.levelHelper.getLevelEntityForSector(sector);
			var position = sector.get(PositionComponent).getPosition();
			var campOrdinal = GameGlobals.gameState.getCampOrdinal(position.level);
			if (GameGlobals.gameFlowLogger.isEnabled) log.i("建立营地 " + position + " 按顺序 " + campOrdinal);
			var campComponent = new CampComponent(position.toString());
			campComponent.foundedTimeStamp = GameGlobals.gameState.gameTime;
			sector.add(campComponent);
			sector.add(new CampEventTimersComponent());
			sector.add(new OutgoingCaravansComponent());
			sector.add(new ReputationComponent());
			sector.add(new CurrencyComponent());

			level.add(campComponent);

			var improvementsComponent = sector.get(SectorImprovementsComponent);
			improvementsComponent.add(improvementNames.home);

			GameGlobals.gameState.unlockedFeatures.camp = true;
			gtag('event', 'build_camp', { event_category: 'progression', event_label: campOrdinal });
			gtag('event', 'build_camp_time', { event_category: 'game_time', event_label: campOrdinal, value: GameGlobals.gameState.playTime });

			this.addLogMessage(LogConstants.MSG_ID_BUILT_CAMP, "建造一个营地.");
			if (level.get(LevelComponent).populationFactor < 1) {
				this.addLogMessage(LogConstants.MSG_ID_BUILT_CAMP_LEVEL_POPULATION, "在这层几乎没有人类生命的迹象.");
			}
			if (position.level == 15) {
				this.addLogMessage(LogConstants.getUniqueID(), "从这里将很难与14层以下的营地交易资源.");
			}
			
			GlobalSignals.improvementBuiltSignal.dispatch();
			GlobalSignals.campBuiltSignal.dispatch();
			this.save();
		},

		buildPassageUpStairs: function (sectorPos) {
			this.buildPassage(sectorPos, true, MovementConstants.PASSAGE_TYPE_STAIRWELL, "build_out_passage_up_stairs", "build_out_passage_down_stairs");
		},

		buildPassageDownStairs: function (sectorPos) {
			this.buildPassage(sectorPos, false, MovementConstants.PASSAGE_TYPE_STAIRWELL, "build_out_passage_down_stairs", "build_out_passage_up_stairs");
		},

		buildPassageUpElevator: function (sectorPos) {
			this.buildPassage(sectorPos, true, MovementConstants.PASSAGE_TYPE_ELEVATOR, "build_out_passage_up_elevator", "build_out_passage_down_elevator");
		},

		buildPassageDownElevator: function (sectorPos) {
			this.buildPassage(sectorPos, false, MovementConstants.PASSAGE_TYPE_ELEVATOR, "build_out_passage_down_elevator", "build_out_passage_up_elevator");
		},

		buildPassageUpHole: function (sectorPos) {
			this.buildPassage(sectorPos, true, MovementConstants.PASSAGE_TYPE_HOLE, "build_out_passage_up_hole", "build_out_passage_down_hole");
		},

		buildPassageDownHole: function (sectorPos) {
			this.buildPassage(sectorPos, false, MovementConstants.PASSAGE_TYPE_HOLE, "build_out_passage_down_hole", "build_out_passage_up_hole");
		},

		buildPassage: function (sectorPos, up, passageType, action, neighbourAction) {
			var position = this.getPositionVO(sectorPos);
			var levelOrdinal = GameGlobals.gameState.getLevelOrdinal(position.level);
			action = action + "_" + levelOrdinal;
			var sector = this.getActionSector(action, sectorPos);
			neighbourAction = neighbourAction + "_" + levelOrdinal;

			var sectorPosVO = StringUtils.getPosition(sectorPos);
			var neighbour = GameGlobals.levelHelper.getSectorByPosition(up ? position.level + 1 : position.level - 1, position.sectorX, position.sectorY);

			if (sector && neighbour) {
				var direction = up ? PositionConstants.DIRECTION_UP : PositionConstants.DIRECTION_DOWN;
				var msg = TextConstants.getPassageRepairedMessage(passageType, direction, sectorPosVO);
				this.buildImprovement(action, GameGlobals.playerActionsHelper.getImprovementNameForAction(action), sector);
				this.buildImprovement(neighbourAction, GameGlobals.playerActionsHelper.getImprovementNameForAction(neighbourAction), neighbour, true);
				this.addLogMessage(LogConstants.MSG_ID_BUILT_PASSAGE, msg);
			} else {
				log.w("找不到建造通道的区域.");
				log.i(sector);
				log.i(neighbour);
				log.i(sectorPos);
			}
		},
		
		buildGreenhouse: function (sectorPos) {
			var action = "build_out_greenhouse";
			var position = this.getPositionVO(sectorPos);
			var sector = this.getActionSector(action, sectorPos);
			this.buildImprovement(action, improvementNames.greenhouse, sector);
			GameGlobals.gameState.unlockedFeatures.resources.herbs = true;
		},
		
		buildTradeConnector: function (sectorPos) {
			var action = "build_out_tradepost_connector";
			var position = this.getPositionVO(sectorPos);
			var sector = this.getActionSector(action, sectorPos);
			this.buildImprovement(action, improvementNames.tradepost_connector, sector);
		},
		
		improveOutImprovement: function (param) {
			let improvementID = param;
			let actionName = "improve_out_" + improvementID;
			let improvementName = improvementNames[improvementID];
			this.improveImprovement(actionName, improvementName);
		},

		buildTrap: function () {
			this.buildImprovement("build_out_collector_food", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_out_collector_food"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_TRAP, "设了个陷阱。它会捕捉食物.");
			if (!this.playerLocationNodes.head.entity.has(SectorCollectorsComponent))
				this.playerLocationNodes.head.entity.add(new SectorCollectorsComponent());
			GlobalSignals.improvementBuiltSignal.dispatch();
		},

		buildBucket: function () {
			this.buildImprovement("build_out_collector_water", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_out_collector_water"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_BUCKET, "做了一个桶。它会收集水.");
			if (!this.playerLocationNodes.head.entity.has(SectorCollectorsComponent))
				this.playerLocationNodes.head.entity.add(new SectorCollectorsComponent());
		},
		
		buildBeacon: function () {
			this.buildImprovement("build_out_beacon", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_out_beacon"));
			
			let sector = this.playerLocationNodes.head.entity;
			sector.add(new BeaconComponent());
			
			this.addLogMessage(LogConstants.MSG_ID_BUILT_BEACON, "信标已准备好.");
		},

		buildHouse: function (otherSector) {
			this.buildImprovement("build_in_house", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_house"), otherSector);
			var msg = "建了一间小屋.";
			var totalHouses = 0;
			for (var node = this.engine.getNodeList(CampNode).head; node; node = node.next) {
				var improvementsComponent = node.entity.get(SectorImprovementsComponent);
				totalHouses += improvementsComponent.getCount(improvementNames.house);
			}
			if (totalHouses < 5) msg += " 如果人们听说了这个营地，他们会来的.";
			this.addLogMessage(LogConstants.MSG_ID_BUILT_HOUSE, msg);
		},

		buildHouse2: function (otherSector) {
			this.buildImprovement("build_in_house2", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_house2"), otherSector);
			var msg = "建了一座塔楼.";
			this.addLogMessage(LogConstants.MSG_ID_BUILT_HOUSE, msg);
		},

		buildGenerator: function () {
			this.buildImprovement("build_in_generator", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_generator"));
			var msg = "设置发电机 generator.";
			this.addLogMessage(LogConstants.MSG_ID_BUILT_GENERATOR, msg);
		},

		buildLights: function () {
			this.buildImprovement("build_in_lights", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_lights"));
			var msg = "为营地安装照明设备.";
			this.addLogMessage(LogConstants.MSG_ID_BUILT_LIGHTS, msg);
		},

		buildCeiling: function () {
			this.buildImprovement("build_in_ceiling", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_ceiling"));
			var msg = "搭一个大帐篷保护营地不被太阳晒伤.";
			this.addLogMessage(LogConstants.MSG_ID_BUILT_CEILING, msg);
		},

		buildStorage: function (sector) {
			this.buildImprovement("build_in_storage", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_storage"), sector);
			this.addLogMessage(LogConstants.MSG_ID_BUILT_STORAGE, "建立了一个存储池.");
		},

		buildFortification: function () {
			this.buildImprovement("build_in_fortification", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_fortification"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_FORTIFICATION, "加固营地.");
		},

		buildAqueduct: function () {
			this.buildImprovement("build_in_aqueduct", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_aqueduct"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_AQUEDUCT, "建了一条渡槽.");
		},

		buildStable: function () {
			this.buildImprovement("build_in_stable", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_stable"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_STABLE, "建了一个商队马厩.");
		},

		buildBarracks: function () {
			this.buildImprovement("build_in_barracks", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_barracks"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_BARRACKS, "建了一个兵营.");
		},

		buildSmithy: function () {
			this.buildImprovement("build_in_smithy", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_smithy"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_SMITHY, "建了一个铁匠铺.");
		},

		buildApothecary: function () {
			this.buildImprovement("build_in_apothecary", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_apothecary"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_APOTHECARY, "建了一个药剂师.");
		},

		buildCementMill: function () {
			this.buildImprovement("build_in_cementmill", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_cementmill"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_CEMENT_MILL, "建了一座水泥厂来制造混凝土.");
		},

		buildRadioTower: function () {
			this.buildImprovement("build_in_radiotower", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_radiotower"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_RADIO, "建了一座无线电塔.");
		},

		buildCampfire: function () {
			var improvementName = GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_campfire");
			var improvementsComponent = this.playerLocationNodes.head.entity.get(SectorImprovementsComponent);
			var count = improvementsComponent.getCount(improvementName);

			this.buildImprovement("build_in_campfire", improvementName);
			if (count === 0)
				this.addLogMessage(LogConstants.MSG_ID_BUILT_CAMPFIRE, "生起营火。在这里，想法被分享和讨论.");
			else
				this.addLogMessage(LogConstants.MSG_ID_BUILT_CAMPFIRE, "改进的篝火。这会引来更多的传闻.");
		},

		buildDarkFarm: function () {
			this.buildImprovement("build_in_darkfarm", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_darkfarm"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_DARKFARM, "建了一个蜗牛养殖场.");
		},

		buildHospital: function () {
			this.buildImprovement("build_in_hospital", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_hospital"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_HOSPITAL, "建了一个诊所.");
		},

		buildLibrary: function () {
			this.buildImprovement("build_in_library", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_library"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_LIBRARY, "建了一个图书馆.");
		},

		buildMarket: function () {
			this.buildImprovement("build_in_market", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_market"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_MARKET, "建立市场.");
			if (!GameGlobals.gameState.unlockedFeatures.trade) {
				GameGlobals.gameState.unlockedFeatures.trade = true;
				GlobalSignals.featureUnlockedSignal.dispatch();
			}
		},

		buildTradingPost: function () {
			var improvementName = GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_tradepost");
			var isFirst = GameGlobals.campHelper.getTotalNumImprovementsBuilt(improvementName) == 0;
			this.buildImprovement("build_in_tradepost", improvementName);
			if (isFirst) {
				 this.addLogMessage(LogConstants.MSG_ID_BUILT_TRADING_POST, "建了一个贸易站。再建一条连接营地的.");
			} else {
				 this.addLogMessage(LogConstants.MSG_ID_BUILT_TRADING_POST, "建立了一个贸易站.");
			}
		},

		buildInn: function () {
			this.buildImprovement("build_in_inn", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_inn"));
			GameGlobals.gameState.unlockedFeatures.followers = true;
			this.addLogMessage(LogConstants.MSG_ID_BUILT_INN, "建了一个旅店。也许它会吸引游客.");
		},

		buildSquare: function () {
			this.buildImprovement("build_in_square", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_square"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_SQUARE, "建了一个广场。这个营地已经感觉更像是伦敦城里的一个小镇了.");
		},

		buildGarden: function () {
			this.buildImprovement("build_in_garden", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_garden"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_GARDEN, "建了一个花园.");
		},
		
		buildShrine: function () {
			this.buildImprovement("build_in_shrine", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_shrine"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_SHRINE, "建了一座神殿.");
		},
		
		buildTemple: function () {
			this.buildImprovement("build_in_temple", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_temple"));
			this.addLogMessage(LogConstants.MSG_ID_BUILT_TEMPLE, "建了一座寺庙.");
		},
		
		buildResearchCenter: function () {
			this.buildImprovement("build_in_researchcenter", GameGlobals.playerActionsHelper.getImprovementNameForAction("build_in_researchcenter"));
			this.addLogMessage(LogConstants.getUniqueID(), "建立了一个研究中心.");
		},

		buildSpaceShip1: function (sectorPos) {
			this.buildSpaceShip(sectorPos, "build_out_spaceship1");
		},

		buildSpaceShip2: function (sectorPos) {
			this.buildSpaceShip(sectorPos, "build_out_spaceship2");
		},

		buildSpaceShip3: function (sectorPos) {
			this.buildSpaceShip(sectorPos, "build_out_spaceship3");
		},

		buildSpaceShip: function (sectorPos, action) {
			var sectorPosVO = this.getPositionVO(sectorPos);
			var sector = this.getActionSector(action, sectorPos);
			var playerPos = this.playerPositionNodes.head.position;

			if (sector) {
				var msg = "殖民地建设工程准备就绪 " + sectorPosVO.getInGameFormat(playerPos.level === l);
				this.buildImprovement(action, GameGlobals.playerActionsHelper.getImprovementNameForAction(action), sector);
				this.addLogMessage(LogConstants.MSG_ID_BUILT_SPACESHIP, msg);
			} else {
				log.w("找不到建造宇宙飞船的区域.");
				log.i(sector);
				log.i(sectorPos);
			}
		},
		
		improveBuilding: function (param) {
			let actionName = "improve_in_" + param;
			let improvementID = param;
			var improvementName = GameGlobals.playerActionsHelper.getImprovementNameForAction(actionName);
			
			this.improveImprovement(actionName, improvementName);
		},
		
		improveImprovement: function (actionName, improvementName) {
			var sector = this.playerLocationNodes.head.entity;
			var improvementsComponent = sector.get(SectorImprovementsComponent);
			let improvementID = ImprovementConstants.getImprovementID(improvementName);
			improvementsComponent.improve(improvementName);
			let level = improvementsComponent.getLevel(improvementName);
			GlobalSignals.improvementBuiltSignal.dispatch();
			this.save();
			
			this.addLogMessage("MSG_ID_IMPROVE_" + improvementName, ImprovementConstants.getImprovedLogMessage(improvementID, level));
		},
		
		collectFood: function (param, amount) {
			this.collectCollector("use_out_collector_food", "collector_food", amount);
		},

		collectWater: function (param, amount) {
			this.collectCollector("use_out_collector_water", "collector_water", amount);
		},

		useHome: function () {
			this.playerStatsNodes.head.stamina.stamina = this.playerStatsNodes.head.stamina.health * PlayerStatConstants.HEALTH_TO_STAMINA_FACTOR;
			
			if (this.playerStatsNodes.head.stamina.isPendingPenalty) {
				var perksComponent = this.playerStatsNodes.head.perks;
				perksComponent.addPerk(PerkConstants.getPerk(PerkConstants.perkIds.staminaBonusPenalty, PerkConstants.TIMER_DISABLED, 300));
				this.playerStatsNodes.head.stamina.isPendingPenalty = false;
			}
			
			this.completeAction("use_in_home");
			this.forceStatsBarUpdate();
		},

		useCampfire: function () {
			var campSector = this.nearestCampNodes.head.entity;
			var campComponent = campSector.get(CampComponent);
			var improvementsComponent = campSector.get(SectorImprovementsComponent);
			// TODO move this check to startAction
			if (campSector) {
				if (campComponent.rumourpool >= 1) {
					campComponent.rumourpool--;
					var campfireLevel = improvementsComponent.getLevel(improvementNames.campfire);
					this.playerStatsNodes.head.rumours.value += GameGlobals.campBalancingHelper.getRumoursPerVisitCampfire(campfireLevel);
					this.addLogMessage(LogConstants.MSG_ID_USE_CAMPFIRE_SUCC, "坐在营火旁，交换关于走廊的故事.");
				} else {
					this.addLogMessage(LogConstants.MSG_ID_USE_CAMPFIRE_FAIL, "坐在营火旁交流故事，但没有什么新鲜事.");
					campComponent.rumourpoolchecked = true;
				}
			} else {
				log.w("未发现营地区域.");
			}
			this.completeAction("use_in_campfire");
			
			GlobalSignals.tribeStatsChangedSignal.dispatch();
		},
		
		useMarket: function () {
			var campSector = this.nearestCampNodes.head.entity;
			var campComponent = campSector.get(CampComponent);
			var improvementsComponent = campSector.get(SectorImprovementsComponent);
			// TODO move this check to startAction
			if (campSector) {
				var marketLevel = improvementsComponent.getLevel(improvementNames.market);
				this.playerStatsNodes.head.rumours.value += GameGlobals.campBalancingHelper.getRumoursPerVisitMarket(marketLevel);
				this.addLogMessage(LogConstants.MSG_ID_USE_MARKET, "参观了市场，听了最新的八卦.");
			} else {
				log.w("未发现营地区域.");
			}
			this.completeAction("use_in_market");
		},

		useHospital: function () {
			var perksComponent = this.playerStatsNodes.head.perks;
			perksComponent.removePerksByType(PerkConstants.perkTypes.injury);

			let maxStamina = PlayerStatConstants.getMaxStamina(perksComponent);
			this.playerStatsNodes.head.stamina.stamina = maxStamina;
			this.addLogMessage(LogConstants.MSG_ID_USE_HOSPITAL, "治愈所有创伤.");

			this.completeAction("use_in_hospital");
			GameGlobals.gameState.unlockedFeatures.fight = true;
		},

		useHospital2: function () {
			var perksComponent = this.playerStatsNodes.head.perks;
			if (perksComponent.hasPerk(PerkConstants.perkIds.healthBonus2)) {
				perksComponent.removePerkById(PerkConstants.perkIds.healthBonus2);
				perksComponent.addPerk(PerkConstants.getPerk(PerkConstants.perkIds.healthBonus3));
			} else {
				perksComponent.addPerk(PerkConstants.getPerk(PerkConstants.perkIds.healthBonus2));
			}
			this.addLogMessage(LogConstants.MSG_ID_USE_HOSPITAL2, "提高的健康指数.");
			this.completeAction("use_in_hospital_2");
		},

		useTemple: function () {
			this.playerStatsNodes.head.entity.get(DeityComponent).favour += CampConstants.FAVOUR_PER_DONATION;
			this.completeAction("use_in_temple");
			this.addLogMessage(LogConstants.MSG_ID_USE_TEMPLE, "捐赠给寺庙.");
			GlobalSignals.inventoryChangedSignal.dispatch();
			this.forceStatsBarUpdate();
		},

		useShrine: function () {
			var campSector = this.nearestCampNodes.head.entity;
			var improvementsComponent = campSector.get(SectorImprovementsComponent);
			
			if (campSector) {
				let shrineLevel = improvementsComponent.getLevel(improvementNames.shrine);
				let successChance = GameGlobals.campBalancingHelper.getMeditationSuccessRate(shrineLevel);
				log.i("meditation success chance: " + successChance)
				if (Math.random() < successChance) {
					this.playerStatsNodes.head.entity.get(DeityComponent).favour += 1;
					this.addLogMessage(LogConstants.MSG_ID_USE_SHRINE, "花了些时间倾听鬼魂的声音.");
				} else {
					this.addLogMessage(LogConstants.MSG_ID_USE_SHRINE, "试着冥想，但找不到安宁.");
				}
			}
			
			this.completeAction("use_in_shrine");
			this.forceStatsBarUpdate();
		},

		craftItem: function (itemId) {
			var actionName = "craft_" + itemId;
			var itemsComponent = this.playerPositionNodes.head.entity.get(ItemsComponent);
			var item = GameGlobals.playerActionsHelper.getItemForCraftAction(actionName);
			GameGlobals.playerHelper.addItem(item);

			if (item.type === ItemConstants.itemTypes.weapon)
				if (!GameGlobals.gameState.unlockedFeatures.fight) {
					GameGlobals.gameState.unlockedFeatures.fight = true;
					GlobalSignals.featureUnlockedSignal.dispatch();
				}

			if (item.type == ItemConstants.itemTypes.light) {
				if (!GameGlobals.gameState.unlockedFeatures.vision) {
					GameGlobals.gameState.unlockedFeatures.vision = true;
					GlobalSignals.featureUnlockedSignal.dispatch();
				}
			}

			this.addLogMessage(LogConstants.MSG_ID_CRAFT_ITEM, LogConstants.getCraftItemMessage(item));
			GlobalSignals.inventoryChangedSignal.dispatch();
			this.save();
		},

		equipItem: function (itemID) {
			var playerPos = this.playerPositionNodes.head.position;
			var itemsComponent = this.playerPositionNodes.head.entity.get(ItemsComponent);
			var item = itemsComponent.getItem(itemID, null, playerPos.inCamp, false);
			itemsComponent.equip(item);
			GlobalSignals.equipmentChangedSignal.dispatch();
		},

		unequipItem: function (itemID) {
			var playerPos = this.playerPositionNodes.head.position;
			var itemsComponent = this.playerPositionNodes.head.entity.get(ItemsComponent);
			var item = itemsComponent.getItem(itemID, null, playerPos.inCamp, true);
			itemsComponent.unequip(item);
			GlobalSignals.equipmentChangedSignal.dispatch();
		},

		discardItem: function (itemID) {
			var playerPos = this.playerPositionNodes.head.position;
			var itemsComponent = this.playerPositionNodes.head.entity.get(ItemsComponent);
			var item = itemsComponent.getItem(itemID, null, playerPos.inCamp, false) || itemsComponent.getItem(itemID, null, playerPos.inCamp, true);
			GameGlobals.uiFunctions.showConfirmation(
				"你确定要丢掉这件东西吗?",
				function () {
					itemsComponent.discardItem(item, false);
					GlobalSignals.equipmentChangedSignal.dispatch();
				}
			);
		},

		useItem: function (itemId, deductedCosts) {
			var actionName = "use_item_" + itemId;
			var sys = this;
			
			var reqs = GameGlobals.playerActionsHelper.getReqs(actionName);
			var playerPos =  this.playerPositionNodes.head.position;
			var perksComponent = this.playerStatsNodes.head.perks;
			
			var item = deductedCosts.items[0];
			if (!item) {
				log.w("试图使用项目，但在扣除成本deductedCosts中没有发现 ");
			}
			var foundPosition = item.foundPosition || playerPos;
			var foundPositionCampOrdinal = GameGlobals.gameState.getCampOrdinal(foundPosition.level);
			
			let itemConfig = ItemConstants.getItemConfigByID(itemId);
			
			switch (itemId) {
				case "first_aid_kit_1":
				case "first_aid_kit_2":
					var injuries = perksComponent.getPerksByType(PerkConstants.perkTypes.injury);
					var minValue = reqs.perkEffects.Injury[0];
					var injuryToHeal = null;
					for (let i = 0; i < injuries.length; i++) {
						if (injuries[i].effect > minValue) {
							injuryToHeal = injuries[i];
							break;
						}
					}
					if (injuryToHeal !== null) {
						perksComponent.removePerkById(injuryToHeal.id);
					} else {
						log.w("没有发现可以治愈的伤害!");
					}
					this.addLogMessage(LogConstants.MSG_ID_USE_FIRST_AID_KIT, "用了急救箱.");
					this.forceStatsBarUpdate();
					break;
				
				case "stamina_potion_1":
					perksComponent.addPerk(PerkConstants.getPerk(PerkConstants.perkIds.staminaBonus));
					this.engine.updateComplete.addOnce(function () {
						sys.addLogMessage(LogConstants.MSG_ID_USE_STAMINA_POTION, "感觉更强壮，更清醒.");
						sys.playerStatsNodes.head.stamina.stamina += PlayerStatConstants.STAMINA_GAINED_FROM_POTION_1;
						sys.engine.updateComplete.addOnce(function () {
							sys.forceStatsBarUpdate();
						});
					});
					break;

				case "glowstick_1":
					var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
					sectorStatus.glowStickSeconds = 120;
					break;
					
				case "cache_metal_1":
				case "cache_metal_2":
				case "cache_metal_3":
				case "cache_metal_4":
					let baseValue = itemConfig.configData.metalValue || 10;
					let value = baseValue + Math.round(Math.random() * 10);
					let itemNameParts = item.name.split(" ");
					let itemName = itemNameParts[itemNameParts.length - 1];
					let currentStorage = GameGlobals.resourcesHelper.getCurrentStorage();
					currentStorage.resources.addResource(resourceNames.metal, value);
					this.addLogMessage(LogConstants.MSG_ID_USE_METAL_CACHE, "拆开 " + itemName + ". 获得 " + value + " 材料.");
					break;
					
				case "cache_evidence_1":
				case "cache_evidence_2":
				case "cache_evidence_3":
					let evidence = itemConfig.configData.evidenceValue || 1;
					let message = TextConstants.getReadBookMessage(item, itemConfig.configData.bookType || ItemConstants.bookTypes.science, foundPositionCampOrdinal);
					let resultVO = new ResultVO("use_item");
					resultVO.gainedEvidence = evidence;
					GameGlobals.uiFunctions.showInfoPopup(
						item.name,
						message,
						"继续",
						resultVO
					);
					this.playerStatsNodes.head.evidence.value += evidence;
					this.addLogMessage(LogConstants.MSG_ID_USE_BOOK, "读了一本书. 获得 " + evidence + " 证据.");
					break;
					
				case "consumable_map_1":
				case "consumable_map_2":
					// TODO score and prefer unvisited sectors
					var radius = 3;
					var centerSectors = GameGlobals.levelHelper.getSectorsAround(foundPosition, 2);
					var centerSector = centerSectors[Math.floor(Math.random() * centerSectors.length)];
					var centerPosition = centerSector.get(PositionComponent);
					var sectorsToReveal = GameGlobals.levelHelper.getSectorsAround(centerPosition, radius);
					
					var revealedSomething = false;
					for (var i = 0; i < sectorsToReveal.length; i++) {
						var statusComponent = sectorsToReveal[i].get(SectorStatusComponent);
						if (statusComponent.scouted) continue;
						statusComponent.revealedByMap = true;
						revealedSomething = true;
					}
					
					log.i("reveal map around " + centerPosition + " radius " + radius);
					
					if (revealedSomething) {
						this.addLogMessage(LogConstants.MSG_ID_USE_MAP_PIECE, "从地图上记下有用的信息.");
					} else {
						this.addLogMessage(LogConstants.MSG_ID_USE_MAP_PIECE, "我查了一下地图，但没有什么有趣的东西.");
					}
					break;

				default:
					log.w("未为useItem映射的项: " + itemId);
					break;
			}
			
			GlobalSignals.inventoryChangedSignal.dispatch();
		},

		useItemFight: function (itemId) {
			log.i("使用东西攻击: " + itemId);
			var fightComponent = this.fightNodes.head.fight;
			if (!fightComponent) {
				log.w("不能在战斗中使用物品，没有战斗进行中");
				return;
			}
			var enemy = fightComponent.enemy;
			switch (itemId) {
				case "glowstick_1":
					var stunTime = 2;
					log.i("击晕敌人 " + Math.round(stunTime * 100)/100 + "秒")
					fightComponent.itemEffects.enemyStunnedSeconds = stunTime;
					break;
				case "consumable_weapon_1":
					var damage = 20;
					log.i("添加 " + damage + " 对敌人的额外伤害");
					fightComponent.itemEffects.damage = damage;
					break;
				case "consumable_weapon_bio":
					if (!fightComponent.enemy.isMechanical()) {
						var stunTime = 3;
						log.i("击晕敌人 " + Math.round(stunTime * 100)/100 + "秒")
						fightComponent.itemEffects.enemyStunnedSeconds = stunTime;
					}
					break;
				case "consumable_weapon_mechanical":
					if (fightComponent.enemy.isMechanical()) {
						var stunTime = 3;
						log.i("击晕敌人 " + Math.round(stunTime * 100)/100 + "秒")
						fightComponent.itemEffects.enemyStunnedSeconds = stunTime;
					}
					break;
				case "flee_1":
					fightComponent.itemEffects.fled = true;
					break;
				default:
					log.w("未为useItemFight映射的项: " + itemId);
					break;
			}
			fightComponent.addItemUsed(itemId);
			log.i("添加使用物品");
		},

		createBlueprint: function (upgradeID) {
			this.tribeUpgradesNodes.head.upgrades.createBlueprint(upgradeID);
			GlobalSignals.blueprintsChangedSignal.dispatch();
		},

		unlockUpgrade: function (upgradeID) {
			this.tribeUpgradesNodes.head.upgrades.useBlueprint(upgradeID);
			GlobalSignals.blueprintsChangedSignal.dispatch();
		},

		buyUpgrade: function (upgradeID, automatic) {
			if (automatic || GameGlobals.playerActionsHelper.checkAvailability(upgradeID, true)) {
				var upgradeDefinition = UpgradeConstants.upgradeDefinitions[upgradeID];
				GameGlobals.playerActionsHelper.deductCosts(upgradeID);
				this.addLogMessage(LogConstants.MSG_ID_BOUGHT_UPGRADE, "调查 " + upgradeDefinition.name);
				this.tribeUpgradesNodes.head.upgrades.addUpgrade(upgradeID);
				GlobalSignals.upgradeUnlockedSignal.dispatch(upgradeID);
				this.save();
				gtag('event', 'upgrade_bought', { event_category: 'progression', event_label: upgradeID });
			}
		},

		collectCollector: function (actionName, improvementName, amount) {
			var currentStorage = GameGlobals.resourcesHelper.getCurrentStorage();
			var bagComponent = this.playerPositionNodes.head.entity.get(BagComponent);

			var sector = this.playerLocationNodes.head.entity;
			var improvementsComponent = sector.get(SectorImprovementsComponent);
			var improvementVO = improvementsComponent.getVO(improvementNames[improvementName]);
			var resourcesVO = improvementVO.storedResources;

			var maxToCollect = Math.max(0, bagComponent.totalCapacity - bagComponent.usedCapacity);
			if (amount) {
				maxToCollect = Math.min(maxToCollect, amount);
			}
			var totalCollected = 0;
			for (var key in resourceNames) {
				var name = resourceNames[key];
				var improvementAmount = Math.floor(resourcesVO.getResource(name))
				if (improvementAmount >= 1) {
					var toCollect = Math.min(improvementAmount, maxToCollect - totalCollected);
					currentStorage.resources.addResource(name, toCollect);
					resourcesVO.addResource(name, -toCollect);
					totalCollected += toCollect;
				}
			}

			if (totalCollected < 1 && maxToCollect >= 1) {
				this.addLogMessage(LogConstants.MSG_ID_USE_COLLECTOR_FAIL, "还没有收集东西.");
			}

			GlobalSignals.inventoryChangedSignal.dispatch();
			GlobalSignals.collectorCollectedSignal.dispatch();
		},

		buildImprovement: function (actionName, improvementName, otherSector) {
			var sector = otherSector ? otherSector : this.playerLocationNodes.head.entity;
			var improvementsComponent = sector.get(SectorImprovementsComponent);
			improvementsComponent.add(improvementName);
			GlobalSignals.improvementBuiltSignal.dispatch();
			this.save();
		},

		assignWorkers: function (sector, assignment) {
			sector = sector || this.playerLocationNodes.head.entity;
			var camp = sector ? sector.get(CampComponent) : null;

			if (camp) {
				camp.assignedWorkers = {};
				for (var key in CampConstants.workerTypes) {
					var val = assignment[key] || 0;
					camp.assignedWorkers[key] = Math.max(0, Math.floor(val));
				}
				GlobalSignals.workersAssignedSignal.dispatch(sector);
			} else {
				log.w("没有找到工人分配的营地.");
			}
		},

		launch: function () {
			GameGlobals.gameState.isFinished = true;
			GlobalSignals.launcedSignal.dispatch();
		},

		getNearestCampName: function () {
			var campSector = this.nearestCampNodes.head.entity;
			if (campSector) {
				return campSector.get(CampComponent).campName;
			} else {
				return "";
			}
		},

		setNearestCampName: function (newName) {
			var newName = newName.substring(0, 20);
			var campSector = this.nearestCampNodes.head.entity;
			if (campSector) {
				campSector.get(CampComponent).campName = newName;
				GlobalSignals.campRenamedSignal.dispatch();
				this.save();
			}
		},

		// TODO util function - move somewhere else
		passTime: function (seconds, callback) {
			this.engine.updateComplete.addOnce(function () {
				GameGlobals.gameState.passTime(seconds);
				GameGlobals.uiFunctions.onPlayerMoved(); // reset cooldowns for buttons
				this.engine.updateComplete.addOnce(function () {
					if (callback) callback();
				}, this);
			}, this);
		},
		
		// TODO find better fix for overlapping actions
		isSubAction: function (action) {
			var baseActionID = GameGlobals.playerActionsHelper.getBaseActionID(action);
			switch (baseActionID) {
				case "fight": return true;
				case "use_item_fight": return true;
				default: return false;
			}
		},
		
		updateLastVisitedCamp: function (entity) {
			if (this.lastVisitedCamps.head) this.lastVisitedCamps.head.entity.remove(LastVisitedCampComponent);
			entity.add(new LastVisitedCampComponent());
			log.i("updateLastVisitedCamp: " + entity.get(PositionComponent))
		},
		
		forceStatsBarUpdate: function () {
			if (GameGlobals.gameState.uiStatus.isHidden) return;
			var system = this.engine.getSystem(UIOutHeaderSystem);
			system.updateItems(true);
			system.updatePerks(true);
			system.updatePlayerStats(true);
			system.updateDeity(true);
		},

		forceTabUpdate: function () {
			if (GameGlobals.gameState.uiStatus.isHidden) return;
			var system = this.engine.getSystem(UIOutTabBarSystem);
			system.updateTabVisibility();
		},

		save: function () {
			GlobalSignals.saveGameSignal.dispatch();
		},

	});

	return PlayerActionFunctions;
});
