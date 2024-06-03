define(['game/constants/CampConstants'], function (CampConstants) {
	
	var ImprovementConstants = {

		improvements: {
			beacon: {
				description: "能在大范围内发光，减少觅食的危险.",
			},
			home: {
				description: "营地的基础.",
				useActionName: "休息",
				improvementLevelsPerTechLevel: 0,
				sortScore: 10000,
			},
			campfire: {
				displayNames: ["营火","城镇之火","永恒之火"],
				description: "增加谣言生成和解锁升级.",
				useActionName: "坐下",
				improvementLevelsPerTechLevel: 5,
				improvementLevelsPerMajorLevel: 5,
				logMsgImproved: "让营火更舒适了",
			},
			house: {
				displayNames: [ "小屋", "房子" ],
				description: "给 " + CampConstants.POPULATION_PER_HOUSE + " 人待的地方.",
				improvementLevelsPerTechLevel: 0,
				sortScore: 9000,
			},
			house2: {
				description: "Houses " + CampConstants.POPULATION_PER_HOUSE2 + " people.",
				sortScore: 9000,
			},
			storage: {
				description: "增加资源存储.",
				improvementLevelsPerTechLevel: 1,
				sortScore: 8000,
			},
			hospital: {
				displayNames: [ "诊所", "医院", "医疗中心" ],
				description: "使伤口愈合.",
				useActionName: "治疗",
				useActionName2: "增加",
				improvementLevelsPerTechLevel: 1,
				improvementLevelsPerMajorLevel: 1,
			},
			market: {
				description: "使外国商人访问.",
				useActionName: "拜访",
				improvementLevelsPerTechLevel: 5,
				improvementLevelsPerMajorLevel: 5,
			},
			inn: {
				description: "增加谣言和招募追随者.",
				improvementLevelsPerTechLevel: 5,
				improvementLevelsPerMajorLevel: 5,
			},
			library: {
				description: "生成的学识.",
				improvementLevelsPerTechLevel: 5,
				logMsgImproved: "升级图书馆",
			},
			darkfarm: {
				description: "生产粮食.",
				improvementLevelsPerTechLevel: 5,
				sortScore: 10,
			},
			aqueduct: {
				description: "水基础设施，提高收集效率.",
				improvementLevelsPerTechLevel: 1,
			},
			temple: {
				description: "宗教和文化活动的中心地点.",
				useActionName: "捐赠",
				improvementLevelsPerTechLevel: 5,
			},
			shrine: {
				description: "一个能与奇怪灵魂联系的地方.",
				useActionName: "冥想",
				improvementLevelsPerTechLevel: 5,
				improvementLevelsPerMajorLevel: 5,
			},
			barracks: {
				description: "安置士兵，提高营地防御.",
				improvementLevelsPerTechLevel: 1,
			},
			apothecary: {
				description: "使药品生产成为可能.",
				improvementLevelsPerTechLevel: 5,
				sortScore: 50,
			},
			smithy: {
				description: "工具匠的工作空间.",
				improvementLevelsPerTechLevel: 5,
				sortScore: 50,
			},
			cementmill: {
				description: "能够生产一种新的建筑材料.",
				improvementLevelsPerTechLevel: 5,
				sortScore: 50,
			},
			stable: {
				description: "建立贸易商队的地方.",
 				improvementLevelsPerTechLevel: 1,
			},
			fortification: {
				description: "增加营地防御.",
				improvementLevelsPerTechLevel: 5,
				improvementLevelsPerMajorLevel: 5,
			},
			researchcenter: {
				description: "生成的证据.",
				improvementLevelsPerTechLevel: 5,
			},
			tradepost: {
				description: "将营地连接到贸易网络.",
			},
			ceiling: {},
			radiotower: {
				description: "提高声誉.",
				improvementLevelsPerTechLevel: 5,
			},
			lights: {
				description: "永远远离黑暗.",
			},
			square: {
				description: "一个放松和社交的地方.",
				improvementLevelsPerTechLevel: 1,
			},
			garden: {
				description: "混凝土沙漠中的一抹美丽.",
 				improvementLevelsPerTechLevel: 1,
			},
			generator: {
				description: "增加房屋声望奖励 (" + CampConstants.REPUTATION_PER_HOUSE_FROM_GENERATOR + "% per house).",
				improvementLevelsPerTechLevel: 10,
				logMsgImproved: "修好发电机",
			},
			collector_water: {
				improvementLevelsPerTechLevel: 1,
			},
			collector_food: {
				improvementLevelsPerTechLevel: 1,
			},
			passageUpStairs: {},
			passageUpElevator: {},
			passageUpHole: {},
			passageDownStairs: {},
			passageDownElevator: {},
			passageDownHole: {},
			spaceship1: {},
			spaceship2: {},
			spaceship3: {},
		},
		
		getDef: function (improvementID) {
			let def = this.improvements[improvementID];
			if (!def) {
				let id = this.getImprovementID(improvementID);
				def = this.improvements[id];
			}
			if (!def) {
				log.w("no improvement def found: " + improvementID);
			}
			return def;
		},
		
		getMaxLevel: function (improvementID, techLevel) {
			techLevel = techLevel || 1;
			let def = this.getDef(improvementID);
			if (!def) return 1;
			
			let improvementLevelsPerTechLevel = def.improvementLevelsPerTechLevel || 0;
			
			return Math.max(1, improvementLevelsPerTechLevel * techLevel);
		},
		
		getRequiredTechLevelForLevel: function (improvementID, level) {
			let def = this.getDef(improvementID);
			if (!def) return 1;
			
			let improvementLevelsPerTechLevel = def.improvementLevelsPerTechLevel || 0;
			if (improvementLevelsPerTechLevel < 1) {
				return 1;
			}
			
			return Math.ceil(level / improvementLevelsPerTechLevel);
		},
		
		getMajorLevel: function (improvementID, level) {
			let def = this.getDef(improvementID);
			if (!def) return 1;
			
			let improvementLevelsPerMajorLevel = def.improvementLevelsPerMajorLevel || 0;
			if (improvementLevelsPerMajorLevel < 1) {
				return 1;
			}
			
			return Math.ceil(level / improvementLevelsPerMajorLevel);
		},
		
		getImprovementID: function (improvementName) {
			for (var key in improvementNames) {
				var name = improvementNames[key];
				if (name == improvementName) return key;
			}
			return null;
		},
		
		getImprovementDisplayName: function (improvementID, level) {
			level = level || 1;
			let def = this.getDef(improvementID);
			let result = improvementNames[improvementID] || "[" + improvementID + "]";
			if (!def) return result;
			let names = def.displayNames;
			if (!names || names.length == 0) return result;
			let majorLevel = this.getMajorLevel(improvementID, level);
			let index = Math.min(majorLevel - 1, names.length - 1);
			return names[index];
		},
		
		getImproveActionName: function (improvementName) {
			let improvementID = ImprovementConstants.getImprovementID(improvementName);
			let improvementType = getImprovementType(improvementName);
			if (improvementType == improvementTypes.camp) {
				return "improve_in_" + improvementID;
			} else {
				return "improve_out_" + improvementID;
			}
		},
		
		getImprovementActionOrdinalForImprovementLevel: function (improvementLevel) {
			return improvementLevel - 1;
		},
		
		getImprovedLogMessage: function (improvementID, level) {
			let def = this.getDef(improvementID);
			return def && def.logMsgImproved ? def.logMsgImproved : "改善了 " + this.getImprovementDisplayName(improvementID, level);
		}

	};
	return ImprovementConstants;
});
