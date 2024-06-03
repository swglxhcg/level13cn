define(['ash', 'json!game/data/UpgradeData.json', 'game/constants/PlayerActionConstants', 'game/constants/TribeConstants', 'game/constants/WorldConstants', 'game/vos/UpgradeVO'],
function (Ash, UpgradeData, PlayerActionConstants, TribeConstants, WorldConstants, UpgradeVO) {
	
	var UpgradeConstants = {
		
		BLUEPRINT_BRACKET_EARLY: "b-early",
		BLUEPRINT_BRACKET_LATE: "b-late",
		
		UPGRADE_TYPE_RUMOURS: "rumours",
		UPGRADE_TYPE_FAVOUR: "favour",
		UPGRADE_TYPE_EVIDENCE: "evidence",

		upgradeDefinitions: {},
		
		upgradeUIEffects: {
			calendar: "calendar",
		},
		
		unlockingUpgradesByWorker: {},
		unlockingUpgradesByUIEffect: {},
		improvingUpgradesByImprovement: {},
		improvingUpgradesByWorker: {},
		improvingUpgradesByEvent: {},
		
		// camp ordinal > a list of blueprints, first array is early, second is late, third is blueprints that can appear on campless levels
		blueprintsByCampOrdinal: {},
		
		upgradeDescriptions: {
			unlock_item_clothing_body_15:"能够承受最恶劣环境的增强服装。",
			unlock_item_clothing_over_15:"灵感来自军事机器人的现代装甲。",
			unlock_item_weapon_15:"制造最致命武器的知识。",
			unlock_building_ceiling:"遮阳。",
			unlock_building_spaceshi1:"建造太空殖民地的一部分。",
			unlock_building_spaceshi2:"建造太空殖民地的一部分。",
			unlock_building_spaceship3:"建造太空殖民地的一部分。",
			unlock_item_bag_4:"制作更好的皮包的皮革加工。",
			improve_building_market3:"部分恢复(传说)过去覆盖整个城市的网络。",
			improve_building_cementmill:"新型水泥混合料，用于生产更强的混凝土。",
			unlock_building_researchcenter:"产生新知识的地方，而不仅仅是收集和归档旧知识。",
			unlock_item_weapon_14:"将武器和战斗带到一个新的破坏性水平。",
			unlock_item_clothing_head_5:"制作一些严肃头盔的艺术。",
			improve_building_apothecary:"重新发现了预防和治疗疾病的现代技术。",
			unlock_item_weapon_13:"解锁一类新的致命武器。",
			unlock_building_radio:"建造无线电塔来提高你文明的声望。",
			improve_building_hospital:"修复人体的复杂程序",
			unlock_item_clothing_body_13:"更好地利用蜘蛛丝和回收材料。",
			unlock_item_weapon_12:"一种强大的武器，在近距离内具有特别的破坏性",
			unlock_item_scavenger_gear:"改进旧设计的新技术。",
			improve_worker_chemist_2:"重新发现对物质和化学反应的研究。",
			unlock_item_clothing_upper_4:"",
			improve_building_shrine:"另一种找到问题答案的方法。",
			unlock_item_weapon_11:"改进的战斧。",
			unlock_item_clothing6:"改进现有探索服装的技术",
			improve_building_storage2: "通过控制温度来改善储存。",
			improve_building_fortification_2:"更好的防御工事",
			unlock_item_clothing3h:"好的手套保证探险家的安全",
			unlock_item_clothing4he:"防止环境危害",
			unlock_item_bag_3:"打开自动行李。",
			unlock_item_weapon_10:"允许用户发射多发子弹而不重新装填的枪。",
			unlock_building_aqueduct:"利用腐朽的水利基础设施，并对其进行扩展，以有效地储存和输送水。",
			unlock_item_clothing4:"基本的防护服可以在战斗中获得优势。",
			improve_building_library2:"一种有组织的获取新知识的方法",
			unlock_building_apothecary:"制作草药的基本知识。",
			improve_worker_trapper_2:"用盐腌、烟熏和腌制食物来延长保存时间。",
			unlock_building_barracks:"专门负责保护营地的训练有素的工人。",
			improve_building_campfire_1:"把营火变成定居点的骄傲。",
			improve_building_inn:"另一种提高士气和团结团队的有效方法。",
			improve_building_market2:"通过使用更轻的货币来进一步改善贸易，这样更容易携带。",
			unlock_item_weapon_8:"更好的金属加工技术允许更好的武器和更多的工具。",
			unlock_item_clothing5:"采用新的金属加工技术进行防护。",
			unlock_item_clothing3:"提供基本保护的标准化服装。",
			improve_building_stable:"管理更大的商队，可以携带更多的货物",
			unlock_item_clothing_hands_25:"手套是拾荒者最好的工具。",
			improve_building_storage1:"为了更可靠的储存，让其他动物远离食物和材料。",
			unlock_building_passage_hole:"在没有楼梯或电梯的情况下，使建筑通道能够跨越楼层。",
			unlock_building_house2:"回收可以容纳更多人的塔楼。",
			unlock_building_smith:"铁匠可以把废金属变成工具和武器。",
			unlock_item_bag_2:"为探险家制作更好的袋子。",
			unlock_item_weapon_6:"一种用相当简单的材料制作的致命远程武器。",
			unlock_item_firstaid:"在旅途中治愈伤口。",
			improve_building_market:"共同的交易媒介使交易更有效率。",
			improve_worker_water_2:"允许使用更多水源的大规模过滤和消毒饮用水技术。",
			unlock_building_cementmill:"解锁混凝土的生产，混凝土是一种坚固而通用的建筑材料。",
			unlock_item_clothing4h:"创造和操作新的、更强的纤维，以获得更好的保护，更容易制造。",
			unlock_building_passage_elevator:"修理通往新楼层的电梯。",
			unlock_item_weapon_5:"一件为战争而制造的武器。",
			unlock_building_bridge:"在倒塌的桥上建造桥梁",
		},
		
		piecesByBlueprint: {},
		
		// caches for faster world generation / page load
		campOrdinalsByBlueprint: {},
		minCampOrdinalsByUpgrade: {},
		
		loadData: function (data) {
			for (upgradeID in data) {
				this.loadUpgradeData(data[upgradeID])
			}
		},
		
		loadUpgradeData: function (def) {
			let addUpgradeEffectToList = function (dict, key, upgradeID) {
				if (!dict[key]) dict[key] = [];
				dict[key].push(upgradeID);
			};
			let desc = UpgradeConstants.upgradeDescriptions[def.id];
			if (!desc) {
				log.w("No description found for upgrade id: " + def.id);
			}
			UpgradeConstants.upgradeDefinitions[def.id] = new UpgradeVO(def.id, def.name, desc);
			UpgradeConstants.upgradeDefinitions[def.id].campOrdinal = def.campOrdinal;
			
			if (def.blueprintPieces) {
				UpgradeConstants.piecesByBlueprint[def.id] = def.blueprintPieces;
				
				if (!UpgradeConstants.blueprintsByCampOrdinal[def.blueprintCampOrdinal])
					UpgradeConstants.blueprintsByCampOrdinal[def.blueprintCampOrdinal] = [[],[],[]];
				let index = def.blueprintIsCampless ? 2 : def.blueprintIsEarly ? 0 : 1;
				UpgradeConstants.blueprintsByCampOrdinal[def.blueprintCampOrdinal][index].push(def.id);
			}
			
			if (def.effects) {
				if (def.effects.unlocksWorker) {
					UpgradeConstants.unlockingUpgradesByWorker[def.effects.unlocksWorker] = def.id;
				}
				if (def.effects.improvesBuildings) {
					let buildings = def.effects.improvesBuildings.split(" ");
					for (let i = 0; i < buildings.length; i++) {
						let building = buildings[i];
						if (building.length < 2) continue;
						addUpgradeEffectToList(UpgradeConstants.improvingUpgradesByImprovement, building, def.id);
					}
				}
				if (def.effects.improvesWorker) {
					addUpgradeEffectToList(UpgradeConstants.improvingUpgradesByWorker, def.effects.improvesWorker, def.id);
				}
				if (def.effects.unlocksUI) {
					UpgradeConstants.unlockingUpgradesByUIEffect[def.effects.unlocksUI] = def.id;
				}
				if (def.effects.improvesOccurrence) {
					let occurrence = def.effects.improvesOccurrence.replaceAll("+", "");
					addUpgradeEffectToList(UpgradeConstants.improvingUpgradesByEvent, occurrence, def.id);
				}
			}
		},
		
		getBlueprintCampOrdinal: function (upgradeID) {
			if (this.campOrdinalsByBlueprint[upgradeID]) {
				return this.campOrdinalsByBlueprint[upgradeID];
			}
			for (var key in this.blueprintsByCampOrdinal) {
				for (let i = 0; i < 3; i++) {
					if (this.blueprintsByCampOrdinal[key][i].indexOf(upgradeID) >= 0) {
						this.campOrdinalsByBlueprint[upgradeID] = key;
						return key;
					}
				}
			}
			return 1;
		},
		
		getMaxPiecesForBlueprint: function (upgradeID) {
			if (this.piecesByBlueprint[upgradeID]) return this.piecesByBlueprint[upgradeID];
			return 3;
		},
		
		getBlueprintBracket: function (upgradeID) {
			var ordinal = this.getBlueprintCampOrdinal(upgradeID);
			if (this.blueprintsByCampOrdinal[ordinal][0].indexOf(upgradeID) >= 0) return this.BLUEPRINT_BRACKET_EARLY;
			if (this.blueprintsByCampOrdinal[ordinal][1].indexOf(upgradeID) >= 0) return this.BLUEPRINT_BRACKET_LATE;
			if (this.blueprintsByCampOrdinal[ordinal][2].indexOf(upgradeID) >= 0) return this.BLUEPRINT_BRACKET_LATE;
			return null;
		},
		
		getUpgradeType: function (upgradeID) {
			let costs = PlayerActionConstants.costs[upgradeID] || {};
			let type = UpgradeConstants.UPGRADE_TYPE_RUMOURS;
			if (costs.favour > 0) type = UpgradeConstants.UPGRADE_TYPE_FAVOUR;
			else if (costs.evidence > 0) type = UpgradeConstants.UPGRADE_TYPE_EVIDENCE;
			return type;
		},
		
		getBlueprintsByCampOrdinal: function (campOrdinal, blueprintType, levelIndex, maxLevelIndex) {
			if (!this.blueprintsByCampOrdinal[campOrdinal]) return [];
			let result = [];
			
			if (blueprintType == this.BLUEPRINT_BRACKET_EARLY || !blueprintType) {
				if (levelIndex == 0 || levelIndex == undefined) {
					result = result.concat(this.blueprintsByCampOrdinal[campOrdinal][0]);
				}
			}
			if (blueprintType == this.BLUEPRINT_BRACKET_LATE || !blueprintType) {
				if (levelIndex == 0 || levelIndex == undefined) {
					result = result.concat(this.blueprintsByCampOrdinal[campOrdinal][1]);
				}
				
				if (levelIndex == 1 || maxLevelIndex < 1 || levelIndex == undefined) {
					result = result.concat(this.blueprintsByCampOrdinal[campOrdinal][2]);
				}
			}
			
			return result;
		},
		
		getPiecesByCampOrdinal: function (campOrdinal, blueprintType, levelIndex, maxLevelIndex) {
			var pieceCount = 0;
			var blueprints = this.getBlueprintsByCampOrdinal(campOrdinal, blueprintType, levelIndex, maxLevelIndex);
			for (let i = 0; i < blueprints.length; i++) {
				pieceCount += this.getMaxPiecesForBlueprint(blueprints[i]);
			}
			return pieceCount;
		},
		
		getRequiredTech: function (upgradeID) {
			var reqs = PlayerActionConstants.requirements[upgradeID];
			if (reqs && reqs.upgrades) {
				return Object.keys(reqs.upgrades);
			}
			return [];
		},
		
		getRequiredTechAll: function (upgradeID) {
			let result = [];
			let direct = this.getRequiredTech(upgradeID);
			for (let i = 0; i < direct.length; i++) {
				result.push(direct[i])
				let indirect = this.getRequiredTechAll(direct[i]);
				for (let j = 0; j < indirect.length; j++) {
					result.push(indirect[j]);
				}
			}
			return result;
		},
		
		getMinimumCampOrdinalForUpgrade: function (upgrade, ignoreCosts) {
			if (!upgrade) return 1;
			
			// TODO also cache ignoreCosts version for each upgrade
			if (!ignoreCosts && this.getMinimumCampOrdinalForUpgrade[upgrade]) return this.getMinimumCampOrdinalForUpgrade[upgrade];
			
			if (!this.upgradeDefinitions[upgrade]) {
				log.w("no such upgrade: " + upgrade);
				this.getMinimumCampOrdinalForUpgrade[upgrade] = 99;
				return 99;
			}
			
			// required tech
			var requiredTech = this.getRequiredTech(upgrade);
			var requiredTechCampOrdinal = 0;
			for (let i = 0; i < requiredTech.length; i++) {
				requiredTechCampOrdinal = Math.max(requiredTechCampOrdinal, this.getMinimumCampOrdinalForUpgrade(requiredTech[i], ignoreCosts));
			}
			
			// blueprint
			var blueprintCampOrdinal = this.getBlueprintCampOrdinal(upgrade);
			
			// misc reqs
			var reqs = PlayerActionConstants.requirements[upgrade];
			if (reqs && reqs.deity) {
				requiredTechCampOrdinal = Math.max(requiredTechCampOrdinal, WorldConstants.CAMP_ORDINAL_GROUND);
			}
			
			// costs
			var costCampOrdinal = 1;
			var costs = PlayerActionConstants.costs[upgrade];
			if (!ignoreCosts) {
				if (!costs) {
					log.w("upgrade has no costs: " + upgrade);
				} else {
					if (costs.favour) {
						costCampOrdinal = Math.max(costCampOrdinal, WorldConstants.CAMPS_BEFORE_GROUND);
					}
				}
			}
			if (costs.favour) {
				costCampOrdinal = WorldConstants.CAMP_ORDINAL_GROUND;
			}
			
			result = Math.max(1, blueprintCampOrdinal, requiredTechCampOrdinal, costCampOrdinal);
			if (!ignoreCosts) this.getMinimumCampOrdinalForUpgrade[upgrade] = result;
			return result;
		},
	
		getMinimumCampStepForUpgrade: function (upgrade) {
			let result = 0;
			var blueprintType = this.getBlueprintBracket(upgrade);
			if (blueprintType == this.BLUEPRINT_BRACKET_EARLY)
				result = WorldConstants.CAMP_STEP_START;
			if (blueprintType == this.BLUEPRINT_BRACKET_LATE)
				result = WorldConstants.CAMP_STEP_POI_2;
				
			var requiredTech = this.getRequiredTech(upgrade);
			for (let i = 0; i < requiredTech.length; i++) {
				result = Math.max(result, this.getMinimumCampStepForUpgrade(requiredTech[i]));
			}
			
			let costs = PlayerActionConstants.costs[upgrade];
			if (costs.favour) {
				result = WorldConstants.CAMP_STEP_POI_2;
			}
			
			return result;
		},
		
		getMinimumCampAndStepForUpgrade: function (upgradeID, ignoreCosts) {
			return {
				campOrdinal: this.getMinimumCampOrdinalForUpgrade(upgradeID, ignoreCosts),
				step: this.getMinimumCampStepForUpgrade(upgradeID)
			};
		},
		
		getExpectedCampOrdinalForUpgrade: function (upgrade) {
			return UpgradeConstants.upgradeDefinitions[upgrade].campOrdinal || 1;
		},
		
		getExpectedCampAndStepForUpgrade: function (upgradeID) {
			return {
				campOrdinal: this.getExpectedCampOrdinalForUpgrade(upgradeID),
				step: this.getMinimumCampStepForUpgrade(upgradeID)
			};
		},
		
	};
	
	UpgradeConstants.loadData(UpgradeData);

	return UpgradeConstants;
	
});
