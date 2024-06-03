// Level 13 specific text helpers

define(['ash',
	'utils/DescriptionMapper',
	'text/Text',
	'text/TextBuilder',
	'game/constants/GameConstants',
	'game/constants/EnemyConstants',
	'game/constants/ItemConstants',
	'game/constants/SectorConstants',
	'game/constants/PositionConstants',
	'game/constants/MovementConstants',
	'game/constants/TradeConstants',
	'game/constants/WorldConstants',
],
function (Ash, DescriptionMapper, Text, TextBuilder, GameConstants, EnemyConstants, ItemConstants, SectorConstants, PositionConstants, MovementConstants, TradeConstants, WorldConstants) {
	
	var TextConstants = {
		
		getActionName: function (baseActionID) {
			switch (baseActionID) {
				case "scout_locale_i":
				case "scout_locale_u":
					return "侦察";
				case "clear_waste_r": return "清理放射性废物";
				case "clear_waste_t": return "清理有毒废物";
				case "build_out_greenhouse": return "build greenhouse";
				case "build_out_tradepost_connector": "建立电梯";
				case "bridge_gap": return "消除代沟";
				default:
					return baseActionID;
			}
		},
		
		getSectorName: function (isScouted, features) {
			var template = "[a-sectortype] [n-street]";
			var params = this.getSectorTextParams(features);
			var phrase = TextBuilder.build(template, params);
			return Text.capitalize(phrase);
		},
		
		getSectorHeader: function (hasVision, features) {
			var template = "[a-street] [a-sectortype] [n-street]";
			if (features.hasCamp) {
				template = "[n-street] 有营地";
			}
			if (features.hasGrove) {
				template = "[a-street] 公园、停车场";
			}
			if (!hasVision) {
				if (features.sunlit) {
					template = "阳光照射的 [n-street]";
				} else {
					template = "黑暗的 [n-street]";
				}
			}
			var params = this.getSectorTextParams(features);
			var phrase = TextBuilder.build(template, params);
			return Text.capitalize(phrase);
		},
		
		getSectorDescription: function (hasVision, features) {
			var type = hasVision ? "sector-vision" : "sector-novision";
			var template = DescriptionMapper.get(type, features);
			if (features.hasGrove) {
				template = " [A] [a-street] 公园里植物泛滥。中间有一片成熟的树林。虽然奇怪而狂野，但它似乎也很平静";
			}
			var params = this.getSectorTextParams(features);
			var phrase = TextBuilder.build(template, params);
			return Text.capitalize(phrase);
		},
		
		getSectorTextParams: function (features) {
			// 1) Collect options for each param based on several features
			var options = {};
			var addOptions = function (param, values) {
				if (!options[param]) options[param] = [];
				for (let i = 0; i < values.length; i++) {
					options[param].push(values[i]);
				}
			};
			// - general: options always available
			addOptions("a-street", [ "安静的" ]);
			addOptions("n-building", [ "建造" ]);
			addOptions("n-buildings", [ "建筑" ]);
			addOptions("a-building", ["高耸的","高大的","阴暗的","废弃的","难以形容的","小的","典型的","不寻常的","对称的","整体的","块状的","巨大的","功能性的","巨大的","巨大的"]);
			addOptions("an-decos", ["搁浅的长凳","坏掉的电梯"]);
			addOptions("an-items", ["碎片"]);
			// - sector type: determines n-sector and affects many others
			switch (features.sectorType) {
				case SectorConstants.SECTOR_TYPE_RESIDENTIAL:
					addOptions("n-sector", ["公寓大楼"]);
					addOptions("a-street-past", ["美丽的","平静的","有序的","放松的"]);
					addOptions("n-building", ["住宅楼","公寓楼","有无数排相同阳台的住宅楼"]);
					addOptions("n-buildings", ["住宅楼","公寓","塔楼","相同的住宅楼"]);
					addOptions("an-decos", ["电车轨道"]);
					addOptions("a-building", [ "宁静", "有规律", "大量的" ]);
					addOptions("an-items", ["垃圾"]);
					break;
				case SectorConstants.SECTOR_TYPE_INDUSTRIAL:
					addOptions("n-sector", ["工业综合体"]);
					addOptions("a-street", ["平淡"]);
					addOptions("a-street-past", ["高安全性"]);
					addOptions("n-building", ["发电厂","工厂","仓库","车间"]);
					addOptions("n-buildings", ["工厂","车间","仓库","仓库","车间","精炼厂"]);
					addOptions("a-building", ["退役的","常规的","庞大的"]);
					addOptions("an-items", ["坏掉的机器"]);
					break;
				case SectorConstants.SECTOR_TYPE_MAINTENANCE:
					addOptions("n-sector", ["运输大厅","维修区","交通枢纽"]);
					addOptions("a-street", ["奇怪的","混乱的","杂乱的"]);
					addOptions("a-street-past", ["有序的"]);
					addOptions("n-building", ["维修枢纽","缆车站","公用事业大楼","水处理站"]);
					addOptions("n-buildings", ["公用事业大楼","数据中心","控制室","自动化控制单元"]);
					addOptions("a-building",["退役","无法访问"]);
					addOptions("an-decos", ["坏掉的管子","坏掉的电车"]);
					addOptions("an-items", ["电线"]);
					break;
				case SectorConstants.SECTOR_TYPE_COMMERCIAL:
					addOptions("n-sector", ["购物中心","购物中心","办公大楼"]);
					addOptions("a-street-past", ["迷人的","嗡嗡的"]);
					addOptions("n-building", ["购物中心","百货公司","办公楼","咖啡馆","酒吧"]);
					addOptions("n-buildings", ["购物塔","购物中心","商店","商店","办公室","办公大楼"]);
					addOptions("a-building", ["空的","被遗弃的","被洗劫的","巨大的"]);
					addOptions("an-decos", ["空喷泉","废弃摊位"]);
					addOptions("an-items",["碎玻璃"]);
					break;
				case SectorConstants.SECTOR_TYPE_PUBLIC:
					addOptions("n-sector", ["监狱综合体","游乐园","图书馆"]);
					addOptions("a-street", ["庄严的","庄严的","宏伟的","平凡的"]);
					addOptions("a-street-past", ["悠闲","有序","愉快"]);
					addOptions("n-building", ["图书馆","监狱","学校","大学","公园","公共广场","运动场","地铁站","研究实验室","政府大楼"]);
					addOptions("n-buildings",["公共建筑","政府建筑"]);
					addOptions("a-building", ["空的","难以接近的","巨大的"]);
					addOptions("an-decos", ["枯树"]);
					addOptions("an-items",["研究样本","垃圾"]);
					break;
				case SectorConstants.SECTOR_TYPE_SLUM:
					addOptions("n-sector", ["棚户区","堆填区"]);
					addOptions("a-street", ["破旧的","混乱的"]);
					addOptions("a-street-past", ["阴郁的","拥挤的","热闹的"]);
					addOptions("n-building", ["公寓楼"]);
					addOptions("a-building", ["遗弃的","粗略的"]);
					addOptions("n-buildings", ["棚屋","棚屋","贫民窟住宅","似乎从未连接到电网的住宅塔"]);
					addOptions("an-decos", ["倒塌的棚屋","垃圾堆"]);
					addOptions("an-items", ["生锈的管子"]);
					break;
			}
			// - building density
			if (features.buildingDensity < 3) {
				addOptions("n-street", [ "区域", "空间", "广场" ]);
				if (features.sectorType == SectorConstants.SECTOR_TYPE_RESIDENTIAL || features.sectorType == SectorConstants.SECTOR_TYPE_COMMERCIAL)
					addOptions("n-street", ["广场","庭院"]);
				addOptions("a-street", ["宽的","宽敞的","巨大的"]);
			} else if (features.buildingDensity < 6) {
				addOptions("n-street",["走廊","广场","区域","大厅"]);
				if (features.sectorType == SectorConstants.SECTOR_TYPE_RESIDENTIAL || features.sectorType == SectorConstants.SECTOR_TYPE_COMMERCIAL)
					addOptions("n-street", [ "林荫大道", "大街" ]);
				addOptions("a-street", ["宽","宽敞"]);
			} else if (features.buildingDensity < 9) {
				addOptions("n-street", ["街","街","胡同","复杂的","区域"]);
				addOptions("a-street", [ "狭窄的" ]);
			} else {
				addOptions("n-street", [ "走廊", "过道", "小巷" ]);
				addOptions("a-street", ["狭窄的","狭窄的","密集的","低的"]);
			}
			// - wear and damage
			switch (features.condition) {
				case SectorConstants.SECTOR_CONDITION_RUINED:
					addOptions("a-street", ["毁坏的","摇摇欲坠的"]);
					addOptions("n-buildings", ["摇摇欲坠的废墟"]);
					addOptions("n-buildings", ["摇摇欲坠的废墟"]);
					addOptions("a-building", [ "毁了","骨骼"]);
					break;
				case SectorConstants.SECTOR_CONDITION_DAMAGED:
					addOptions("a-street", ["损坏","毁坏","破碎"]);
					addOptions("a-building",["受损"]);
					addOptions("an-decos", ["坍塌的隧道"]);
					break;
				case SectorConstants.SECTOR_CONDITION_ABANDONED:
					addOptions("a-street", ["荒凉"]);
					addOptions("a-building",["腐朽的","荒凉的","慢慢分解的","早已废弃的","摇摇欲坠的"]);
					break;
				case SectorConstants.SECTOR_CONDITION_WORN:
					addOptions("a-building", ["荒凉的","被遗弃的","荒凉的"]);
					break;
				case SectorConstants.SECTOR_CONDITION_RECENT:
					addOptions("a-building", ["保存完好的","现代的"]);
					break;
				case SectorConstants.SECTOR_CONDITION_MAINTAINED:
					addOptions("a-street", ["现代的","圆滑的"]);
					break;
			}
			// - sunlight
			if (features.sunlit) {
				addOptions("a-street", ["阳光照射", "太阳包围 ", "眼花缭乱","明亮的", "起风的", "" ]);
				if (features.wear < 5 && features.damage < 5)
					addOptions("a-street",["闪闪发光的","闪闪发光的"]);
				addOptions("a-building", ["充满活力","阳光明媚"]);
				addOptions("an-decos", ["顽固的杂草"]);
			} else {
				addOptions("a-street", ["暗的", "暗的", "阴郁的","阴暗的","不明亮的"]);
			}
			// - hazards
			if (features.hazards.cold > 0) {
				addOptions("a-street", [ "冷" ]);
			}
			if (features.hazards.radiation > 0) {
				addOptions("a-street", [ "荒无人烟" ]);
				addOptions("n-building", ["核电站","核废料库","核废料处理装置"]);
				addOptions("a-building", [ "被遗弃的" ]);
				addOptions("na-items", ["废弃的安全设备"]);
			}
			if (features.hazards.poison > 0) {
				addOptions("a-street", [ "污染" ]);
				addOptions("n-building", ["化工厂","炼油厂","垃圾处理厂"]);
				addOptions("a-building", [ "被污染的" ]);
				addOptions("na-items", ["用过的医用口罩"]);
			}
			if (features.hazards.debris) {
				addOptions("a-street", ["毁坏","损坏","毁了"]);
				addOptions("n-building", [ "建筑物" ]);
				addOptions("a-building",["毁坏","无法辨认","掏空"]);
				addOptions("na-items", ["碎片"]);
			}
			// - level population
			if (features.populationFactor == 0) {
				addOptions("a-building", ["长期被遗弃","空的","污染的"]);
			} else if (features.populationFactor < 1) {
				addOptions("a-street", [ "冷静的" ]);
				addOptions("a-building", [ "空的" ]);
			} else {
				addOptions("a-building",["最近被洗劫一空"]);
				addOptions("na-items", ["最近食腐动物的迹象"]);
			}
			// - level raid danger factor
			if (features.raidDangerFactor > 1) {
				addOptions("a-street",["抢劫"]);
				addOptions("a-building", ["洗劫","损坏","掠夺","抢劫"]);
			}
			// - level: architectural style / age
			if (features.level < 6) {
				addOptions("a-street", ["古老的","古雅的"]);
				addOptions("a-building", ["古老的","过时的","古色古香的","历史的"]);
			} else if (features.level < 14) {
				addOptions("a-street", ["过时"]);
				addOptions("a-building", ["过时"]);
			} else if (features.level < 18) {
				addOptions("a-street", ["现代"]);
				addOptions("a-building", ["现代","时尚","实用"]);
			}
			
			// 2) Build final result by selecting from options
			let result = {};
			var rand = (features.buildingDensity + features.wear + features.damage) / 30;
			var pickRandom = function (options, excluded) {
				if (!options || options.length <= 0) return "";
				var validOptions = options.filter(option => !excluded.includes(option));
				let i = Math.floor(rand * validOptions.length);
				return validOptions[i];
			};
			var selectFromOptions = function (key, num) {
				var selection = [];
				for (let i = 0; i < num; i++) {
					var sel = pickRandom(options[key], selection);
					if (sel) {
						selection.push(sel);
					} else {
						log.w("could not select valid [" + key + "] " + (i+1) + "/" + num)
						log.w(options);
					}
				}
				return selection;
			};
			result["a-sectortype"] = features.sectorType;
			result["n-sector"] = selectFromOptions("n-sector", 1);
			result["n-street"] = selectFromOptions("n-street", 1);
			result["a-street"] = selectFromOptions("a-street", 2);
			result["a-street-past"] = selectFromOptions("a-street-past", 1);
			result["n-building"] = selectFromOptions("n-building", 2);
			result["n-buildings"] = selectFromOptions("n-buildings", 2);
			result["a-building"] = selectFromOptions("a-building", 2);
			result["an-decos"] = selectFromOptions("an-decos", 2);
			result["an-items"] = selectFromOptions("an-items", 2);
			
			return result;
		},
		
		getPassageFoundMessage: function (passageVO, direction, sunlit, isBuilt) {
			switch (passageVO.type) {
				case MovementConstants.PASSAGE_TYPE_HOLE:
					if (direction === PositionConstants.DIRECTION_UP) {
						if (sunlit)
							return "在高高的天花板上有一个洞。刺眼的阳光从里面射进来.";
						else
							return "在高高的天花板上有一个洞，一个通向黑暗的入口.";
					} else {
						if (isBuilt) {
							return "这里有一个巨大的天坑。电梯已经建好了.";
						} else {
							if (sunlit)
								return "这里有一个巨大的天坑。在下面很远很远的地方可以看到一条街道.";
							else
								return "这里有一个巨大的天坑。下面只能看到一片空旷.";
						}
					}
				case MovementConstants.PASSAGE_TYPE_BLOCKED:
					return "这里似乎曾经有过一个楼梯，但它已被毁坏，无法修复.";
				default:
					if (isBuilt) {
						return "一个 " + Text.addArticle(passageVO.name.toLowerCase()) + " 在这里.";
					} else {
						return "曾经有 " + Text.addArticle(passageVO.name.toLowerCase()) + " 在这里.";
					}
			}
		},
		
		getPassageRepairedMessage: function (passageType, direction, sectorPosVO) {
			var directionName = (direction === PositionConstants.DIRECTION_UP ? " 上" : " 下");
			switch (passageType) {
				case MovementConstants.PASSAGE_TYPE_HOLE:
					return "电梯 " + directionName + " 建在 " + sectorPosVO.getInGameFormat(true);
				case MovementConstants.PASSAGE_TYPE_ELEVATOR:
					return "电梯 " + directionName + " 修复在 " + sectorPosVO.getInGameFormat(true);
				case MovementConstants.PASSAGE_TYPE_STAIRWELL:
					return "楼梯井 " + directionName + " 修复在 " + sectorPosVO.getInGameFormat(true);
				default:
					log.w("未知通道类型: [" + passageType + "]")
					return "走廊 " + directionName + " 准备好了，在" + sectorPosVO.getInGameFormat(true);
			}
		},
				
		getPassageDescription: function (passageVO, direction, isBuilt, isShort) {
			var makeHighlight = function (content) { return "<span class='hl-functionality'>" + content + "</span>"; };
			var directionName = (direction === PositionConstants.DIRECTION_UP ? " 上" : " 下");
			if (isShort) {
				switch (passageVO.type) {
					case MovementConstants.PASSAGE_TYPE_HOLE:
						if (isBuilt) {
							return "走廊 " + directionName + " (电梯) (建造)";
						} else {
							return "这一层的洞 " + (direction === PositionConstants.DIRECTION_UP ? "天花板" : "地板");
						}
					default:
						var status = isBuilt ? "修好的" : "坏掉的";
						if (passageVO.type === MovementConstants.PASSAGE_TYPE_BLOCKED) {
							status = "不可修理的"
						}
						return "走廊 " + directionName + " (" + passageVO.name.toLowerCase() + ") (" + status + ")";
				}
			} else {
				switch (passageVO.type) {
					case MovementConstants.PASSAGE_TYPE_HOLE:
						if (isBuilt) {
							return "一个崭新的 " + makeHighlight("电梯 " + directionName) + " 建在这里. ";
						} else {
							return "一个 " + makeHighlight("洞") + " 在这一层的 " + (direction === PositionConstants.DIRECTION_UP ? "天花板" : "地面") + " 上. ";
						}
					default:
						var name = passageVO.name.toLowerCase() + " " + directionName;
						var article = Text.getArticle(name);
						var span = article + " " + makeHighlight(name);
						var state;
						if (isBuilt) {
							state = "而且已经修好了";
						} else if (passageVO.type === MovementConstants.PASSAGE_TYPE_ELEVATOR) {
							state = "但它是坏的";
						} else if (passageVO.type === MovementConstants.PASSAGE_TYPE_BLOCKED) {
							state = "但这是无法修复的";
						} else {
							state = "但它需要修理";
						}
						return "一个 " + span + " 在这里, " + state + ". ";
				}
			}
		},
		
		getReadBookMessage: function (itemVO, bookType, campOrdinal) {
			let features = {};
			features.bookType = bookType;
			features.bookName = itemVO.name;
			features.campOrdinal = campOrdinal;
			features.randomSeed = itemVO.itemID;
			let params = this.getBookTextParams(features);
			
			let template = DescriptionMapper.get("book-intro", features) + " " + DescriptionMapper.get("book-description", features);
			let phrase = TextBuilder.build(template, params);
			
			return phrase;
		},
		
		getBookTextParams: function (features) {
			var result = {};
			
			var topics = [];
			switch (features.bookType) {
				case ItemConstants.bookTypes.science:
					topics.push("破坏一个产业流程");
					topics.push("在放射性环境中生长的一种蛞蝓");
					topics.push("机器人的制造");
					topics.push("城市的基础设施");
					topics.push("大海");
					topics.push("城市通风");
					topics.push("旧武器");
					topics.push("药物");
					topics.push("粮食作物轮作");
					topics.push("电子学");
					topics.push("小苏打的多种用途");
					topics.push("如何保护自己免受阳光的有害影响");
					topics.push("生橡胶如何加工成许多有用的形式");
					topics.push("火药");
					topics.push("暗物质");
					topics.push("癌症治疗");
					topics.push("电磁学");
					topics.push("dna");
					topics.push("进化");
					topics.push("板tetonics");
					topics.push("晶体管");
					topics.push("电池");
					topics.push("地球的大气层");
					topics.push("化石");
					topics.push("钢铁生产");
					topics.push("发酵");
					topics.push("原子武器");
					topics.push("其他行星");
					topics.push("病毒");
					topics.push("核反应堆");
					topics.push("磁罗盘");
					topics.push("阳历");
					topics.push("雷达");
					topics.push("生态系统");
					topics.push("印刷机");
					topics.push("光学透镜");
					topics.push("肥料");
					topics.push("广播");

					break;
				case ItemConstants.bookTypes.fiction:
					topics.push("降落前流行音乐");
					break;
				case ItemConstants.bookTypes.history:
					topics.push("堕落前的宗教以及它们对战争的影响");
					topics.push("大地震对这个城市的影响");
					topics.push("生物战争");
					break;
			}
			result["n-topic"] = DescriptionMapper.pickRandom(topics, features);
			
			var objects = [];
			switch (features.bookType) {
				case ItemConstants.bookTypes.science:
					objects.push("飞行器");
					objects.push("大火箭");
					objects.push("驱动旧电梯的引擎");
					objects.push("秋前温室的灌溉系统");
					objects.push("跨越整个城市的信息网络");
					objects.push("你并不真正理解的机器，但它们似乎是用来稳定伦敦金融城的");
					objects.push("晶体管");
					objects.push("一个被称为天花板的平宽太阳能屏幕");
					break;
			}
			result["n-object"] = DescriptionMapper.pickRandom(objects, features);
			
			var themes = [];
			switch (features.bookType) {
				case ItemConstants.bookTypes.fiction:
					themes.push("来自另一个大陆的难民");
					themes.push("第一次看到太阳的矿工");
					themes.push("撕开城市边缘的可怕风暴");
					themes.push("大洪水");
					themes.push("可以预测天气的萨满");
					themes.push("城里不同派系之间的战争");
					themes.push("英雄领袖的崛起");
					themes.push("一个贫民窟居民克服了许多障碍，但最终在伦敦金融城获得了晋升");
					themes.push("秋季前贫民窟一个犯罪团伙的兴衰");
					themes.push("一个人放弃了城市中有人居住的地方，并试图自己寻找土地");
					themes.push("一群科学家被困在伦敦老城区的一个研究站");
					themes.push("被迫远离彼此工作的两个人之间的恋情");
					themes.push("负责评估个人对金融城贡献价值的官僚");
					themes.push("城市人民统一在一个政府之下");
					themes.push("思念远方故乡的人");
					themes.push("据说在城市废弃的地方游荡的鬼魂");
					break;
			}
			result["c-theme"] = DescriptionMapper.pickRandom(themes, features);
			
			var facts = [];
			switch (features.bookType) {
				case ItemConstants.bookTypes.science:
					facts.push("城市人口在沦陷前就已经在下降了");
					facts.push("古代文明经常使用木材作为建筑材料，因为地面上有丰富的木材");
					facts.push("城市深处有几个矿镇");
					facts.push("城市在一定水平以下的维护主要由机器人完成");
					// TODO get general facts like these in features / otherwise
					// facts.push("there are X levels in the City");
					// facts.push("the lowest level of the City is in fact number X");
					break;
				case ItemConstants.bookTypes.history:
					facts.push("少数强大的矿业公司在堕落之前拥有巨大的权力");
					facts.push("古代文明以四季为日历");
					facts.push("这座城市最初建在沼泽地上");
					facts.push("这座城市居住着来自几个古老文明的人");
					facts.push("有个叫市政府的东西");
					facts.push("伦敦历史上经历过几次饥荒");
					facts.push("这座城市大约在700年前开始建造");
					facts.push("曾经有一段时间，伦敦市内所有宗教都被禁止");
					break;
			}
			result["c-fact"] = DescriptionMapper.pickRandom(facts, features);
			
			var events = [];
			switch (features.bookType) {
				case ItemConstants.bookTypes.history:
					events.push("几百年前，伦敦城对某个遥远文明发动的战争");
					events.push("过去500年伦敦金融城的战争");
					events.push("城市第一层的建设");
					events.push("从某个遥远的岛屿移民到伦敦");
					events.push("发生在本书成书前几十年的大饥荒");
					events.push("成立全市政府");
					events.push("园丁大叛乱");
					events.push("核电站事故，废物被排放到城市的低层");
					break;
			}
			result["c-event"] = DescriptionMapper.pickRandom(events, features);
			
			return result;
		},
		
		getFoundStashMessage: function (stashVO) {
			switch (stashVO.stashType) {
				case ItemConstants.STASH_TYPE_ITEM:
					return "找到一个物品藏匿处.";
				case ItemConstants.STASH_TYPE_SILVER:
					return "Found some coins.";
				default:
					log.w("Unknown stash type: " + stashVO.stashType);
					return "找到了藏匿处.";
			}
		},
		
		getWaymarkText: function (waymarkVO, sectorFeatures) {
			let features = Object.assign({}, sectorFeatures);
			features.waymarkType = waymarkVO.type;
			features.direction = PositionConstants.getDirectionFrom(waymarkVO.fromPosition, waymarkVO.toPosition);
			
			let template = DescriptionMapper.get("waymark", features);
			let params = this.getWaymarkTextParams(waymarkVO, features);
			let phrase = TextBuilder.build(template, params);
			
			result = phrase;
			if (GameConstants.isDebugVersion) result += " [" + waymarkVO.toPosition + "]";
			
			return result;
		},
		
		getWaymarkTextParams: function (waymarkVO, features) {
			let result = {};
			
			let tradePartner = TradeConstants.getTradePartner(features.campOrdinal);
			
			result["n-target"] = "<span class='hl-functionality'>" + this.getWaymarkTargetName(waymarkVO) + "</span>";
			result["direction"] = PositionConstants.getDirectionName(features.direction, false);
			result["n-settlement-name"] = tradePartner ? tradePartner.name : null;
			return result;
		},
		
		getWaymarkTargetName: function (waymarkVO) {
			switch (waymarkVO.type) {
				case SectorConstants.WAYMARK_TYPE_SPRING: return "水";
				case SectorConstants.WAYMARK_TYPE_CAMP: return "安全";
				case SectorConstants.WAYMARK_TYPE_RADIATION: return "危险";
				case SectorConstants.WAYMARK_TYPE_POLLUTION: return "危险";
				case SectorConstants.WAYMARK_TYPE_SETTLEMENT: return "交易";
				default:
					log.w("unknown waymark type: " + waymarkVO.type);
					return "safe";
			}
		},
		
		getLogResourceText: function (resourcesVO) {
			var msg = "";
			var replacements = [];
			var values = [];
			for (var key in resourceNames) {
				var name = resourceNames[key];
				var amount = resourcesVO.getResource(name);
				msg += "$" + replacements.length + ", ";
				replacements.push("#" + replacements.length + " " + name);
				values.push(Math.round(amount));
			}
			msg = msg.slice(0, -2);
			return { msg: msg, replacements: replacements, values: values };
		},
		
		getLogItemsText: function (items) {
			var msg = "";
			var replacements = [];
			var values = [];
			var loggedItems = {};
			for (let i = 0; i < items.length; i++) {
				var item = items[i];
				if (typeof loggedItems[item.id] === 'undefined') {
					msg += "$" + replacements.length + ", ";
					replacements.push("#" + replacements.length + " " + item.name.toLowerCase());
					values.push(1);
					loggedItems[item.id] = replacements.length - 1;
				} else {
					values[loggedItems[item.id]]++;
				}
			}
			msg = msg.slice(0, -2);
			if (Object.keys(loggedItems).length > 1) {
				var lastCommaIndex = msg.lastIndexOf(",");
				msg = msg.substring(0, lastCommaIndex) + " 并且 " + msg.substring(lastCommaIndex + 1);
			}
			return {msg: msg, replacements: replacements, values: values};
		},
		
		createTextFromLogMessage: function (msg, replacements, values, includePeriod) {
			var text = msg;
			var value = 0;
			var useValues = values.length > 0;
			for (let i = 0; i < replacements.length; i++) {
				if (useValues) {
					value = values[i];
				}
				if (value > 0 || value.length > 0 || !useValues) {
					text = text.replace("$" + i, replacements[i]);
				} else {
					text = text.replace("$" + i, "");
				}
				
				if (useValues) {
					text = text.replace("#" + i, values[i]);
				}
			}
			
			text = text.trim();
			text = text.replace(/ ,/g, "");
			text = text.replace(/^,/g, "");
			text = text.replace(/,$/g, "");
			text = text.replace(/\, \./g, ".");
			if (includePeriod && text.substr(text.length - 1) !== "." && text.substr(text.length - 1) !== "!")
				text += ".";
			text = text.trim();
			return text;
		},
		
		getFightChancesText: function (probability) {
			if (probability >= 0.9) {
				return "相当无害";
			}
			if (probability > 0.8) {
				return "有点不安";
			}
			if (probability > 0.6) {
				return "令人紧张不安的";
			}
			if (probability >= 0.5) {
				return "有一点危险的";
			}
			if (probability >= 0.4) {
				return "有危险";
			}
			if (probability >= 0.2) {
				return "非常危险";
			}
			return "致命的";
		},
		
		getLocaleName: function (locale, sectorFeatures, isShort) {
			var condition = sectorFeatures.getCondition();
			var modifier = "";
			var noun = "";
			// default modifiers
			switch (condition) {
				case SectorConstants.SECTOR_CONDITION_RUINED:
					modifier = "毁灭";
					break;
				case SectorConstants.SECTOR_CONDITION_DAMAGED:
					modifier = "被损坏的";
					break;
				case SectorConstants.SECTOR_CONDITION_ABANDONED:
					modifier = "被抛弃的";
					break;
				case SectorConstants.SECTOR_CONDITION_WORN:
					modifier = "被忽视的";
					break;
				case SectorConstants.SECTOR_CONDITION_RECENT:
					modifier = "空的";
					break;
				case SectorConstants.SECTOR_CONDITION_MAINTAINED:
					modifier = "整洁的";
					break;
			}
			// nouns and special modifiers
			switch (locale.type) {
				case localeTypes.factory:
					noun = "工厂";
					break;
				case localeTypes.house:
					if (condition === SectorConstants.SECTOR_CONDITION_DAMAGED) modifier = "被毁的";
					noun = "房子";
					break;
				case localeTypes.lab:
					noun = "实验室";
					break;
				case localeTypes.grove:
					modifier = "繁荣";
					noun = "树丛";
					break;
				case localeTypes.market:
					noun = "超市";
					break;
				case localeTypes.maintenance:
					switch (condition) {
						case SectorConstants.SECTOR_CONDITION_RUINED:
							noun = "控制单元";
							break;
						case SectorConstants.SECTOR_CONDITION_DAMAGED:
							noun = "控制单元";
							break;
						case SectorConstants.SECTOR_CONDITION_ABANDONED:
							modifier = "古代的";
							noun = "网络交换机";
							break;
						case SectorConstants.SECTOR_CONDITION_WORN:
							modifier = "年老的";
							noun = "水塔";
							break;
						case SectorConstants.SECTOR_CONDITION_RECENT:
							modifier = "失灵的";
							noun = "控制单元";
							break;
						case SectorConstants.SECTOR_CONDITION_MAINTAINED:
							noun = "消防站";
							break;
						default:
					}
					break;
				case localeTypes.transport:
					noun = "车站";
					if (condition === SectorConstants.SECTOR_CONDITION_RUINED) noun = "火车站";
					if (condition === SectorConstants.SECTOR_CONDITION_WORN) modifier = "已倒闭的有轨电车";
					if (condition === SectorConstants.SECTOR_CONDITION_RECENT) modifier = "缆车";
					if (condition === SectorConstants.SECTOR_CONDITION_MAINTAINED) modifier = "火车";
					break;
				case localeTypes.sewer:
					if (condition === SectorConstants.SECTOR_CONDITION_RECENT) modifier = "轻声的";
					if (condition === SectorConstants.SECTOR_CONDITION_MAINTAINED) modifier = "安静的";
					noun = "下水道";
					break;
				case localeTypes.warehouse:
					if (condition === SectorConstants.SECTOR_CONDITION_RECENT) modifier = "结实的";
					if (condition === SectorConstants.SECTOR_CONDITION_MAINTAINED) modifier = "坚固的";
					noun = " 仓库";
					break;
				case localeTypes.camp:
				case localeTypes.tradingpartner:
					modifier = "外国的";
					noun = "营地";
					break;
				case localeTypes.hut:
				case localeTypes.hermit:
					if (condition === SectorConstants.SECTOR_CONDITION_RECENT) modifier = "新建的";
					if (condition === SectorConstants.SECTOR_CONDITION_MAINTAINED) modifier = "保管妥当的";
					noun = "小屋";
					break;
				case localeTypes.library:
					modifier = "被抛弃的";
					if (sectorFeatures.level < 10) modifier = " 古代的";
					noun = "图书馆";
					break;
				default:
					log.w("unknown locale type: " + locale.type);
					noun = "建筑";
					break;
			}
			
			return isShort ? noun : (modifier + " " + noun).trim();
		},
		
		getWorkshopName: function (resource) {
			switch (resource) {
					case resourceNames.fuel: return "提炼厂";
					case resourceNames.rubber: return "种植地";
					default: return "车间";
			}
		},
		
		getSpringName: function (featuresComponent) {
			let hasHazards = featuresComponent.hazards.hasHazards();
			let type = featuresComponent.sectorType;
			if (featuresComponent.ground && featuresComponent.buildingDensity < 6
				 && !hasHazards && type != SectorConstants.SECTOR_TYPE_INDUSTRIAL) {
				return "小溪";
			}
			if (type == SectorConstants.SECTOR_TYPE_SLUM && featuresComponent.damage < 3 && featuresComponent.buildingDensity < 8) {
				return "老井";
			}
			if (type != SectorConstants.SECTOR_TYPE_SLUM && type != SectorConstants.SECTOR_TYPE_MAINTENANCE && featuresComponent.wear < 5 && featuresComponent.damage < 3) {
				return "饮水机";
			}
			if (featuresComponent.wear > 6 || featuresComponent.damage > 3) {
				return "漏水水管";
			}
			return "水塔";
		},
		
		getEnemyText: function (enemyList, sectorControlComponent) {
			let result = "";
			var enemyActiveV = this.getEnemyActiveVerb(enemyList);
			var enemyNounSector = this.getEnemyNoun(enemyList, true);
			result += enemyActiveV + " " + enemyNounSector;
			return result;
		},
		
		getEnemyNoun: function (enemyList, detailed) {
			var baseNoun = this.getCommonText(enemyList, "nouns", detailed? "name" : "", "某人或某事", true, true);
			if (detailed) {
				return baseNoun;
			} else {
				var parts = baseNoun.split(" ");
				return parts[parts.length - 1];
			}
		},
		
		getEnemyGroupNoun: function (enemyList) {
			return this.getCommonText(enemyList, "groupN", "", "group", false)
		},
		
		getEnemyActiveVerb: function(enemyList) {
			return this.getCommonText(enemyList, "activeV", "", "occupied by", false);
		},
		
		getEnemeyDefeatedVerb: function (enemyList) {
			return this.getCommonText(enemyList, "defeatedV", "", "defeated", false);
		},
		
		getScaResourcesString: function (discoveredResources, resourcesScavengable) {
			var s = "";
			 for(var key in resourceNames) {
				var name = resourceNames[key];
				var amount = resourcesScavengable.getResource(name);
				if (amount > 0 && discoveredResources.indexOf(name) >= 0) {
					var amountDesc = "scarce";
					if (amount == WorldConstants.resourcePrevalence.RARE) amountDesc = "相当稀罕的1";
					if (amount == WorldConstants.resourcePrevalence.DEFAULT) amountDesc = "缺乏的2";
					if (amount == WorldConstants.resourcePrevalence.COMMON) amountDesc = "常见的3";
					if (amount == WorldConstants.resourcePrevalence.ABUNDANT) amountDesc = "大量的4";
					if (GameConstants.isDebugVersion) amountDesc += " " + Math.round(amount);
					s += key + " (" + amountDesc + "), ";
				}
			}
			if (s.length > 0) return s.substring(0, s.length - 2);
			else if (resourcesScavengable.getTotal() > 0) return "Unknown";
			else return "None";
		},
		
		getScaItemString: function (discoveredItems, itemsScavengeable) {
			var validItems = [];
			for (let i = 0; i < discoveredItems.length; i++) {
				var id = discoveredItems[i];
				if (itemsScavengeable.indexOf(id) < 0) continue;
				validItems.push(ItemConstants.getItemByID(id).name);
			}
			if (validItems.length == 0) return "None";
			return validItems.join(", ");
		},
		
		getMovementBlockerName: function (blockerVO, enemiesComponent, gangComponent) {
			switch (blockerVO.type) {
				case MovementConstants.BLOCKER_TYPE_GANG:
					let enemies = this.getAllEnemies(null, gangComponent);
					var groupNoun = this.getEnemyGroupNoun(enemies);
					var enemyNoun = this.getEnemyNoun(enemies);
					return groupNoun + " of " + Text.pluralify(enemyNoun);
				default:
					return blockerVO.name;
			}
			return "";
		},
		
		getMovementBlockerAction: function (blockerVO, enemiesComponent, gangComponent) {
			switch (blockerVO.type) {
				case MovementConstants.BLOCKER_TYPE_GAP: return "桥接";
				case MovementConstants.BLOCKER_TYPE_WASTE_TOXIC: return "Clear waste";
				case MovementConstants.BLOCKER_TYPE_WASTE_RADIOACTIVE: return "Clear waste";
				case MovementConstants.BLOCKER_TYPE_GANG:
					let enemies = this.getAllEnemies(null, gangComponent);
					return "战斗 " + this.getEnemyNoun(enemies);
			}
		},
		
		getAllEnemies: function (enemiesComponent, gangComponent) {
			let enemies = [];
			if (enemiesComponent && enemiesComponent.possibleEnemies) {
				enemies = enemiesComponent.possibleEnemies.concat();
			}
			if (gangComponent) {
				for (let i = 0; i < gangComponent.enemyIDs.length; i++) {
					var gangEnemy = EnemyConstants.getEnemy(gangComponent.enemyIDs[i]);
					enemies.push(gangEnemy);
				}
			}
			return enemies;
		},
		
		getUnblockedVerb: function (blockerType) {
			switch (blockerType) {
				case MovementConstants.BLOCKER_TYPE_GAP: return "bridged";
				case MovementConstants.BLOCKER_TYPE_WASTE_TOXIC: return "cleared";
				case MovementConstants.BLOCKER_TYPE_WASTE_RADIOACTIVE: return "cleared";
				case MovementConstants.BLOCKER_TYPE_GANG: return "defeated";
				case MovementConstants.BLOCKER_TYPE_DEBRIS: return "cleared";
			}
		},
		
		// get common description word for a list of objects that contain possible words are in arrays named objectAttribute
		// if nothing common is found, defaultWord is returned
		// is allowSeveral, two common words can be returned if one doesn't cover all objects
		getCommonText: function (objectList, objectAttribute, objectDetailAttribute, defaultWord, allowSeveral, pluralify) {
			var allWords = [];
			var allDetails = [];
			var minimumWords = [];
			for (var i1 in objectList) {
				var o = objectList[i1];
				if (!o) continue;
				for (var j1 in o[objectAttribute]) {
					var word = o[objectAttribute][j1];
					var detail = objectDetailAttribute ? o[objectDetailAttribute] : "";
					if (!word) continue;
					if ($.inArray(word, allWords) < 0) allWords.push(word);
					if (objectDetailAttribute && $.inArray(detail, allDetails) < 0) allDetails.push(detail);
					if (j1 == 0 && $.inArray(word, minimumWords) < 0) minimumWords.push(word);
				}
			}
			
			var validWords = [];
			for (var i2 in allWords) {
				var word = allWords[i2];
				var valid = true;
					for (var j2 in objectList) {
					var o = objectList[j2];
					if ($.inArray(word, o[objectAttribute]) < 0) valid = false;
				}
				if (valid) validWords.push(word);
			}
			
			var validDetail = "";
			if (objectDetailAttribute) {
			for (var i3 in allDetails) {
				var detail = allDetails[i3];
				var valid = true;
				for (var j3 in objectList) {
					var o = objectList[j3];
					if (o[objectDetailAttribute] != detail) valid = false;
					}
					if (valid) validDetail = detail;
				}
			}
			
			// log.i("getCommonText " + objectAttribute + " | " + validDetail + " | " + validWords.join(",") + " | " + minimumWords.join(",") + " | " + defaultWord);
			// log.i(objectList)
			
			if (validDetail.length > 0) {
				return pluralify ? Text.pluralify(validDetail) : validDetail;
			} else if (validWords.length > 0) {
				return pluralify ? Text.pluralify(validWords[0]) : validWords[0];
			} else if (allowSeveral && minimumWords.length > 1) {
				return pluralify ? (Text.pluralify(minimumWords[0]) + " 和 " + Text.pluralify(minimumWords[1])) : (minimumWords[0] + " 并且 " + minimumWords[1]);
			} else {
				return defaultWord;
			}
		},
		
		getListText: function (list) {
			if (!list || list.length == 0) {
				return "none";
			} else if (list.length == 1) {
				return list[0];
			} else if (list.length == 2) {
				return list[0] + " 和 " + list[1];
			} else {
				return list.join(", ");
			}
		},
		
	};
		
	function initSectorTexts() {
		var wildcard = DescriptionMapper.WILDCARD;
		
		var t_R = SectorConstants.SECTOR_TYPE_RESIDENTIAL;
		var t_I = SectorConstants.SECTOR_TYPE_INDUSTRIAL;
		var t_M = SectorConstants.SECTOR_TYPE_MAINTENANCE;
		var t_C = SectorConstants.SECTOR_TYPE_COMMERCIAL;
		var t_P = SectorConstants.SECTOR_TYPE_PUBLIC;
		var t_S = SectorConstants.SECTOR_TYPE_SLUM;
		
		// brackets for values like building density, wear, damage
		var b0 = [0, 0];
		var bfull = [10, 10];
		var b12 = [0, 5];
		var b22 = [5, 10];
		var b13 = [0, 3];
		var b23 = [4, 6];
		var b33 = [7, 10];
		
		var lmodern = [15, 100];
		var lold = [10, 18];
		
		// default descriptions (player has vision)
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [n-street] 在前面看起来像 [A] [a-building] [n-building]");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [a-street] [n-street] 在两个 [a-building] [n-buildings]");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [a-street] [n-street] 这两个 [n-buildings] 并且一些 [a-building] [n-buildings] 在两侧");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [a-sectortype] [n-street] 有一些 [a-building] [n-buildings]");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [a-street] [n-sector] 散落着 [an-items] 和 [an-items]");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [a-street] [n-street] 处于同水平 [a-building] [n-buildings]");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [a-street] [n-street] 被 [n-buildings]围绕着");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [a-street] [n-street] 被 [a-building] [n-buildings]围绕着");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [n-street] 有一些 [an-decos] 和 [a-building] [n-buildings]");
		DescriptionMapper.add("sector-vision", { sectorType: wildcard }, "[A] [a-street] [n-street] 在一些 [n-buildings]中间");
		DescriptionMapper.add("sector-vision", { isSurfaceLevel: false }, "[A] [n-street] 在一个巨大的支柱的底部支撑着上面的水平");
		DescriptionMapper.add("sector-vision", { isSurfaceLevel: false, wear: b12, sunlit: false, debris: b0 }, "[A] [a-street] [n-street] 废弃已久的建筑上长满了奇怪的苔藓");
		DescriptionMapper.add("sector-vision", { buildingDensity: b0, isGroundLevel: false }, "一个连接几座建筑的桥梁和通道系统，围绕着一个令人眼花缭乱的开口通向下面一层");
		DescriptionMapper.add("sector-vision", { buildingDensity: b12, isGroundLevel: false, campable: false }, "[A] [a-street] 下面一层的桥梁与电车轨道、公用设施和行人分开");
		DescriptionMapper.add("sector-vision", { buildingDensity: b22 }, "某种 [A] [a-sectortype] 这里有几个狭窄的通道");
		DescriptionMapper.add("sector-vision", { buildingDensity: b13 }, "一个宽大的广场 [A] [a-building] [n-building] 一边是看起来像是剩余 [A] [a-building] [n-building] 在其他地方");
		DescriptionMapper.add("sector-vision", { buildingDensity: b23, isSurfaceLevel: false }, "[A] [a-street] [n-street] 在巨大的 [n-building]");
		DescriptionMapper.add("sector-vision", { buildingDensity: b23 }, "一条有多层通道的街道沿着周围的墙壁爬行 [a-sectortype] 建筑物");
		DescriptionMapper.add("sector-vision", { buildingDensity: b33 }, "某种类型的 [A] [a-sectortype] 在两大走廊之间 [n-buildings] 并且几乎没有足够的空间走路");
		DescriptionMapper.add("sector-vision", { buildingDensity: b33 }, "[A] [a-street] [n-street] 装得满满的 [a-building] [n-buildings] 和 [an-decos] 几乎没有足够的空间通过");
		DescriptionMapper.add("sector-vision", { buildingDensity: b33 }, "[A] [a-street] 两道之间的小巷 [a-building] [n-buildings]");
		DescriptionMapper.add("sector-vision", { wear: b13, sunlit: false, level: lmodern, debris: b0 }, "[A] [a-street] [n-street] 在高 [n-buildings]之间, 两旁是枯萎的树木，这些树木直到最近才在人工光照下茁壮成长");
		DescriptionMapper.add("sector-vision", { wear: b13, level: lmodern, isSurfaceLevel: false }, "一个 [n-street] 在一些骨架建筑之间，这些建筑似乎在建造过程中就被遗弃了");
		DescriptionMapper.add("sector-vision", { wear: b23, damage: b0 }, "从前的 [n-sector] 有 [A] [a-street-past] 气氛");
		DescriptionMapper.add("sector-vision", { wear: b23, damage: b0 }, "曾经是[a-street-past] [n-sector]，中间有一些[an-decos]和[A] [a-building] [n-building].");
		DescriptionMapper.add("sector-vision", { wear: b33 }, "[A] [a-building] 建筑物的原始用途难以确定，被剥离成裸露的混凝土");
		DescriptionMapper.add("sector-vision", { buildingDensity: b22, wear: b33 }, "[A] [a-street] 走廊上散落着早已离去的居民留下的垃圾");
		DescriptionMapper.add("sector-vision", { wear: b33 }, "[A] [a-street] [a-sectortype] [n-street] 几个巨大的无法辨认的废墟隐约可见");
		DescriptionMapper.add("sector-vision", { wear: b33 }, "一个完全毁了的 [a-sectortype] [n-street]");
		DescriptionMapper.add("sector-vision", { wear: b33 }, "一条被瓦砾覆盖的[n-street] 被[a-sectortype]建筑残垣断壁所包围");
		DescriptionMapper.add("sector-vision", { damage: b22 }, "以前的 [a-sectortype] 区域  [n-buildings] 和 [n-buildings] 成为了废墟");
		DescriptionMapper.add("sector-vision", { damage: b33 }, "一个完全被摧毁的 [a-sectortype] [n-street]");
		DescriptionMapper.add("sector-vision", { damage: b22, buildingDensity: b12 }, "[a-street] [n-street] 两侧是被摧毁的建筑物的炮弹");
		DescriptionMapper.add("sector-vision", { damage: b22, buildingDensity: b22 }, "[n-street] 到处都是碎石，很难通过");
		DescriptionMapper.add("sector-vision", { sectorType: t_R }, "一个小 [n-street] 在一些 [a-building] 公寓大楼中");
		DescriptionMapper.add("sector-vision", { sectorType: t_R, buildingDensity: b23, isSurfaceLevel: false }, "[a-street] [n-street] 沿着一堵巨大的墙一直延伸到天花板，上面点缀着[a-building]公寓");
		DescriptionMapper.add("sector-vision", { sectorType: t_R, buildingDensity: b12, level: [6, 100] }, "[n-street]两侧是几座相同的狭窄住宅楼");
		DescriptionMapper.add("sector-vision", { sectorType: t_R, buildingDensity: b23 }, "[n-street] 在有令人眼花缭乱的几何形状阳台的[a-building]外面");
		DescriptionMapper.add("sector-vision", { sectorType: t_R, level: lmodern }, "广场周围一定曾经是相当舒适的公寓大楼");
		DescriptionMapper.add("sector-vision", { sectorType: t_I }, "一个大型[a-building]工业综合体外面的街道");
		DescriptionMapper.add("sector-vision", { sectorType: t_I, buildingDensity: b13 }, "空荡荡的广场上有一些破损的集装箱和巨大的生锈的机械臂");
		DescriptionMapper.add("sector-vision", { sectorType: t_I, buildingDensity: b23 }, "[A] [n-street] 在两个看起来像[a-building]的控制室和办公室之间");
		DescriptionMapper.add("sector-vision", { sectorType: t_M }, "[A] [a-street] [n-street] 在 [A] [n-building] 后面, 低矮的天花板上布满了旧电线和管道");
		DescriptionMapper.add("sector-vision", { sectorType: t_M }, "一条荒凉的[n-street]，纵横交错着残破的电缆系统和维修管道");
		DescriptionMapper.add("sector-vision", { sectorType: t_M }, "一座大桥下面被水淹没的通道，远处隐约可见[a-building]");
		DescriptionMapper.add("sector-vision", { sectorType: t_M }, "在机器运行的城市设施中，一个被遗忘的空间，光滑的表面只被管道和管道破坏");
		DescriptionMapper.add("sector-vision", { sectorType: t_M, level: lold, buildingDensity: b13 }, "一个宽敞的广场，中间有一个控制室，旧的电缆系统线路消失在各个方向");
		DescriptionMapper.add("sector-vision", { sectorType: t_C }, "[A] [a-street] 购物街有各种商店和咖啡馆的遗迹");
		DescriptionMapper.add("sector-vision", { sectorType: t_C }, "在一些商业建筑之间的一条[n-street]，它们的[a-building]上覆盖着一块块死屏");
		DescriptionMapper.add("sector-vision", { sectorType: t_C, wear: b12 }, "A [n-street] [n-street] 拥挤的小商店，广告牌和亭在多个层面");
		DescriptionMapper.add("sector-vision", { sectorType: t_C, buildingDensity: b12, isSurfaceLevel: false }, "A [n-street] 建筑像巨大的钟乳石一样附着在天花板上");
		DescriptionMapper.add("sector-vision", { sectorType: t_C, buildingDensity: b12, isSurfaceLevel: false }, "一个围绕着一个巨大雕像而建的广场，四面都是 [a-building] 商店的门面");
		DescriptionMapper.add("sector-vision", { sectorType: t_C, buildingDensity: b13 }, "一个高架建筑下的广场，中间一定曾经是一个瀑布");
		DescriptionMapper.add("sector-vision", { sectorType: t_C, buildingDensity: b13 }, "[A] 宽阔的有栅栏的露台连接着一座巨大的塔楼，俯瞰着下面的[a-street]");
		DescriptionMapper.add("sector-vision", { sectorType: t_C, buildingDensity: b13 }, "由 [a-building] 包围的圆形庭院");
		DescriptionMapper.add("sector-vision", { sectorType: t_C, buildingDensity: b22, wear: b33 }, "[A] [a-building] 建筑最初的用途很难确定，被剥离成混凝土，中间有一个令人印象深刻的螺旋楼梯");
		DescriptionMapper.add("sector-vision", { sectorType: t_P }, "[A] [n-street] 主要是巨大的建筑，看起来曾经是某种公共设施");
		DescriptionMapper.add("sector-vision", { sectorType: t_P }, "一段废弃的高速公路，路边有一些较小的建筑" );
		DescriptionMapper.add("sector-vision", { sectorType: t_P, buildingDensity: b12 }, "[A] [a-street] [n-street] 占据了一排庄严的雕像" );
		DescriptionMapper.add("sector-vision", { sectorType: t_P, buildingDensity: b12, wear: b22 }, "一个装饰大厅，似乎曾经是一个大车站，有一个圆顶屋顶，巨大的枝形吊灯和两侧的小摊位" );
		DescriptionMapper.add("sector-vision", { sectorType: t_P, buildingDensity: b13 }, "一个开放的空间，看起来可能曾经是某种运动的专用空间");
		DescriptionMapper.add("sector-vision", { sectorType: t_P, buildingDensity: b33}, "[A] [a-street] [n-street] 在两个巨大的[n-buildings] 之间，几乎没有足够的空间通过 ");
		DescriptionMapper.add("sector-vision", { sectorType: t_S, buildingDensity: b33, wear: b22 }, "[A] [a-street] [n-street] 被废弃了一段时间的 [a-building]住宅包围(或部分覆盖) ");
		DescriptionMapper.add("sector-vision", { sectorType: t_S, buildingDensity: b13 }, "一个宽阔的广场，它的墙壁支撑着几个临时棚屋");
		DescriptionMapper.add("sector-vision", { level: 14, buildingDensity: b13 }, "一个巨大的大厅，看起来像是被用作储藏区，天花板上的自动机械手生锈了");
		DescriptionMapper.add("sector-vision", { level: 14, buildingDensity: b23 }, "[A] [a-street] 两个已废弃的、封闭的核反应堆之间的通道");
		DescriptionMapper.add("sector-vision", { level: 14, buildingDensity: b23 }, "[A] [a-street] [n-street] 在一个巨大的工业加工园区外，所有的入口都被紧紧地关上了");
		DescriptionMapper.add("sector-vision", { level: 14, buildingDensity: b33 }, "[A] [a-street] 通道，似乎已被用来运输货物之间的各种设施在这一层");
		DescriptionMapper.add("sector-vision", { level: 14, buildingDensity: b33 }, "[A] [a-sectortype] 这条走廊曾经看起来一定是无菌的，但现在到处都是碎片");
		DescriptionMapper.add("sector-vision", { level: 14, buildingDensity: b33 }, "一处核设施废墟上方有窗户的走廊");
		DescriptionMapper.add("sector-vision", { isGroundLevel: true, buildingDensity: b13 }, "城市下面的一片开阔的空地，泥土、草和其他植物从混凝土地板的裂缝中挤出来");
		DescriptionMapper.add("sector-vision", { isGroundLevel: true, buildingDensity: b13 }, "一个古老的广场，早已被人遗忘，两侧的巨大柱子支撑着城市");
		DescriptionMapper.add("sector-vision", { isGroundLevel: true, buildingDensity: b13 }, "一个开放的空间，也许曾经是一个公园，现在到处都是奇怪的植物和蘑菇");
		DescriptionMapper.add("sector-vision", { isGroundLevel: true, buildingDensity: b23 }, "[A] [a-street] 街道之间的摇摇欲坠的古代 [a-sectortype] 建筑");
		DescriptionMapper.add("sector-vision", { isGroundLevel: true, buildingDensity: b23 }, "一条没有天花板的开放街道，城市的下一层在上面盘旋，两边都是废墟");
		DescriptionMapper.add("sector-vision", { isGroundLevel: true, buildingDensity: b33 }, "穿过古建筑的通道");
		DescriptionMapper.add("sector-vision", { isGroundLevel: true, buildingDensity: b33 }, "有裂缝的狭窄街道");
		DescriptionMapper.add("sector-vision", { isSurfaceLevel: true, buildingDensity: b13 }, "一个曾经 [a-street-past] 的广场，周围是玻璃圆顶的通道和小店面");
		DescriptionMapper.add("sector-vision", { isSurfaceLevel: true, buildingDensity: b13 }, "一个大广场，中间有一座华丽的公共建筑");
		DescriptionMapper.add("sector-vision", { isSurfaceLevel: true, buildingDensity: b23 }, "  被广告牌和死机屏幕点缀着的[a-street]，周围都是高楼大厦");
		DescriptionMapper.add("sector-vision", { isSurfaceLevel: true, buildingDensity: b23 }, "这是一条多层街道，下面是有轨电车，下面是行人和小商店");
		DescriptionMapper.add("sector-vision", { isSurfaceLevel: true, buildingDensity: b33 }, "[A] [a-street] [n-street] 高大之间，华丽 [n-buildings]");
		DescriptionMapper.add("sector-vision", { isSurfaceLevel: true, buildingDensity: b33 }, "[A] [a-street] 过去是两个购物中心之间的通道");
		DescriptionMapper.add("sector-vision", { debris: b22 }, " [n-street] 满是残骸");
		DescriptionMapper.add("sector-vision", { debris: b22, sectorType: t_R }, "[A] [n-street] 两侧是几座完全毁坏的居民楼");

		// descriptions when player has no vision (lamp/sunglasses)
		DescriptionMapper.add("sector-novision", { sunlit: false, buildingDensity: b0 }, "城内罕有的空地;没有地板，没有墙壁，没有建筑，什么都没有。只有浩瀚空虚的黑暗");
		DescriptionMapper.add("sector-novision", { sunlit: false, buildingDensity: b13 }, "宽阔的街道或走廊在茫茫的黑暗中很难找到任何东西");
		DescriptionMapper.add("sector-novision", { sunlit: false, buildingDensity: b23, wear: b22 }, "被遗弃的街道或走廊细节在黑暗中逐渐消失");
		DescriptionMapper.add("sector-novision", { sunlit: false, buildingDensity: b23, wear: b12 }, "安静的街道或走廊细节在黑暗中逐渐消失");
		DescriptionMapper.add("sector-novision", { sunlit: false, buildingDensity: b33 }, "一条密密的通道，几乎没有足够的行走空间。你在黑暗中摸索着前进");
		DescriptionMapper.add("sector-novision", { sunlit: false }, "城市里的一个空间，隐藏在黑暗中");
		DescriptionMapper.add("sector-novision", { sunlit: true, buildingDensity: b0 }, "城内罕有的空地;没有地板，没有墙壁，没有建筑，什么都没有。只有浩瀚的虚空");
		DescriptionMapper.add("sector-novision", { sunlit: true, buildingDensity: b13 }, "宽阔的街道或走廊在刺眼的阳光下很难找到任何东西");
		DescriptionMapper.add("sector-novision", { sunlit: true, buildingDensity: b23, wear: b22 }, "被遗弃的街道或走廊在刺眼的光线下，细节变得模糊了");
		DescriptionMapper.add("sector-novision", { sunlit: true, buildingDensity: b23, wear: b12 }, "安静的街道或走廊细节在阳光下褪色了");
		DescriptionMapper.add("sector-novision", { sunlit: true, buildingDensity: b33 }, "一条密密的通道，几乎没有足够的行走空间。你在眩目的光芒中摸索着前进");
		DescriptionMapper.add("sector-novision", { sunlit: true }, "城市里的一个空间，在炫目的灯光下模糊不清");
	}
	
	function initWaymarkTexts() {
		var wildcard = DescriptionMapper.WILDCARD;
		
		var t_R = SectorConstants.SECTOR_TYPE_RESIDENTIAL;
		var t_I = SectorConstants.SECTOR_TYPE_INDUSTRIAL;
		var t_M = SectorConstants.SECTOR_TYPE_MAINTENANCE;
		var t_C = SectorConstants.SECTOR_TYPE_COMMERCIAL;
		var t_P = SectorConstants.SECTOR_TYPE_PUBLIC;
		var t_S = SectorConstants.SECTOR_TYPE_SLUM;
		
		var wt_C = SectorConstants.WAYMARK_TYPE_CAMP;
		var wt_W = SectorConstants.WAYMARK_TYPE_SPRING;
		var wt_P = SectorConstants.WAYMARK_TYPE_POLLUTION;
		var wt_R = SectorConstants.WAYMARK_TYPE_RADIATION;
		var wt_S = SectorConstants.WAYMARK_TYPE_SETTLEMENT;
		
		// brackets for values like building density, wear, damage
		var b0 = [0, 0];
		var b12 = [0, 5];
		var b22 = [5, 10];
		
		var lt1 = [ 0, 0.999 ];
		var gte1 = [ 1, 100 ];
		
		DescriptionMapper.add("waymark", { sectorType: wildcard }, "通往 [direction] 的走廊旁的墙上画着一个大大的[n-target]符号");
		DescriptionMapper.add("waymark", { sectorType: wildcard }, "有一个涂鸦，上面写着[n-target]和一个指向 [direction] 的箭头");
		DescriptionMapper.add("waymark", { buildingDensity: b12 }, "一些砖块被排列成指向 [direction] 的箭头形状和一个粗糙的符号，可能意味着[n-target]。");
		DescriptionMapper.add("waymark", { waymarkType: wt_C }, "你会发现一些用箭头指向 [direction] 的涂鸦，还有“安全”和“庇护所”之类的词'.");
		DescriptionMapper.add("waymark", { waymarkType: wt_R }, "当朝 [direction] 前进时，墙上有多个骷髅标志");
		DescriptionMapper.add("waymark", { waymarkType: wt_P }, "当朝 [direction] 前进时，墙上有多个骷髅标志");
		DescriptionMapper.add("waymark", { waymarkType: wt_S }, "在通往 [direction] 的通道旁边的墙上有一块金属牌匾，上面写着“[n-settlement-name]”");
		DescriptionMapper.add("waymark", { waymarkType: wt_W }, "画在街上的一个蓝色箭头指向 [direction] .");
		DescriptionMapper.add("waymark", { sectorType: t_C }, "一个商店的广告牌被涂上了一个指向 [direction] 的箭头和一个[n-target]字。");
		DescriptionMapper.add("waymark", { sectorType: t_I }, "路标被涂上了油漆。朝着 [direction] 写着[n-target]");
		DescriptionMapper.add("waymark", { sectorType: t_M }, "靠近天花板的管子上画着箭头。一个指向 [direction] 的是[n-target]的符号旁边");
		DescriptionMapper.add("waymark", { sectorType: t_P }, "一座雕像举着一块粗糙的牌子，上面写着[n-target]指向 [direction] ");
		DescriptionMapper.add("waymark", { sectorType: t_S }, "有几张破旧的海报表明 [direction] 有[n-target]");
	}
	
	function initBookTexts() {
		var wildcard = DescriptionMapper.WILDCARD;
		
		let t_S = ItemConstants.bookTypes.science;
		let t_F = ItemConstants.bookTypes.fiction;
		let t_H = ItemConstants.bookTypes.history;
		
		DescriptionMapper.add("book-intro", { bookType: wildcard }, "你读了这本书.");
		DescriptionMapper.add("book-intro", { bookType: t_S }, "你把书翻了一遍.");
		DescriptionMapper.add("book-intro", { bookType: t_F }, "你检查这本书.");
		DescriptionMapper.add("book-intro", { bookType: t_H }, "你学习书本.");
		
		DescriptionMapper.add("book-description", { bookType: wildcard }, "一篇描述[n-topic]的文章引起了你的注意。");
		DescriptionMapper.add("book-description", { bookType: wildcard }, "描述[n-topic]的部分似乎很有趣.");
		
		DescriptionMapper.add("book-description", { bookType: t_S }, "你可以找到关于[n-topic]的细节。");
		DescriptionMapper.add("book-description", { bookType: t_S }, "有大量关于[n-topic]的信息。.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "你了解了[n-topic].");
		DescriptionMapper.add("book-description", { bookType: t_S }, "关于[n-topic]有许多有趣的文章。");
		DescriptionMapper.add("book-description", { bookType: t_S }, "它描述了[n-topic]。");
		DescriptionMapper.add("book-description", { bookType: t_S }, "这是一篇[n-topic]相当枯燥的文章。.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "它包含对[n-topic]的描述.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "它包含了一篇关于[n-topic]的论文.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "这里有一个有趣的[n-object]图表.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "有[n-object]的废弃计划.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "有一个图表详细解释了[n-object]是如何工作的.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "它包含[n-object]的详细描述.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "有[n-object]的技术图纸");
		DescriptionMapper.add("book-description", { bookType: t_S }, "你知道[c-fact].");
		DescriptionMapper.add("book-description", { bookType: t_S }, "对精炼过程的描述提供了一些线索，让我们了解大堕落之前普遍使用的材料种类.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "你被对地面上丰富植物的描述迷住了.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "它包含了“黑暗层次”中已知动物生命的目录。你能认出几个.");
		DescriptionMapper.add("book-description", { bookType: t_S }, "你会注意到以前的人口普查数据关于每天暴露在阳光下的人和不暴露在阳光下的人.");
		
		DescriptionMapper.add("book-description", { bookType: t_H }, "你可以找到[n-topic]的详细信息.");
		DescriptionMapper.add("book-description", { bookType: t_H }, "它描述了[n-topic].");
		DescriptionMapper.add("book-description", { bookType: t_H }, "这是一篇相当枯燥的[n-topic]。.");
		DescriptionMapper.add("book-description", { bookType: t_H }, "你知道[c-fact].");
		DescriptionMapper.add("book-description", { bookType: t_H }, "似乎[c-fact].");
		DescriptionMapper.add("book-description", { bookType: t_H }, "你了解了[c-event].");
		DescriptionMapper.add("book-description", { bookType: t_H }, "你找到了[c-event]的时间轴。");
		DescriptionMapper.add("book-description", { bookType: t_H }, "关于[c-event]的一章引起了你的注意.");
		DescriptionMapper.add("book-description", { bookType: t_H }, "有一大段关于[c-event].");
		DescriptionMapper.add("book-description", { bookType: t_H }, "这里有几个对[c-event]的引用。");
		DescriptionMapper.add("book-description", { bookType: t_H }, "参考城市的“目前无人居住的水平”，提供了一个关于降落之前的城市的视角.");
		
		DescriptionMapper.add("book-description", { bookType: t_F }, "关于[c-theme]的故事会一直伴随着你.");
		DescriptionMapper.add("book-description", { bookType: t_F }, "你被一首关于[c-theme]的诗感动了。");
		DescriptionMapper.add("book-description", { bookType: t_F }, "有一个关于[c-theme]的故事.");
		DescriptionMapper.add("book-description", { bookType: t_F }, "这是一个关于[c-theme]的故事.");
		
	}
	
	initSectorTexts();
	initWaymarkTexts();
	initBookTexts();
	
	return TextConstants;
	
});
