# Level13cn
  
这是[Level 13](https://nroutasuo.github.io/level13/)的汉化版本。感谢原始作者的辛勤工作和无私奉献！  
  
本汉化版本旨在让中文用户更轻松地使用该项目。我们尽量保持了原意的一致性，并对文化和语境进行了适当的调整。  
  
## 使用说明  
  
请参照原始项目的使用说明，并根据需要进行适当的调整。  
  
## 贡献  
  
欢迎任何形式的贡献，包括改进翻译、报告问题或提出新功能建议。请通过GitHub的issue或pull request与我们联系。  
  
## 版权和许可  
  
本汉化版本遵循与原始项目相同的许可证。有关详细信息，请参阅[Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)。  
  
再次感谢原始作者和所有贡献者的辛勤工作！

以下是原项目的README.md内容

# Level 13
Level 13是一款基于文本的增量科幻浏览器冒险游戏，玩家必须在黑暗、腐朽的城市中生存，(重新)发现新旧科技，重建崩溃的文明。

游戏还在开发中。你可以玩最新的(半)稳定版本[在这里](https://nroutasuo.github.io/level13/)。

第13级是个人的业余项目，但也收到了一些来自社区的修复。如果您对贡献有兴趣，请先阅读[贡献指南](docs/CONTRIBUTING.md)。

如果您需要帮助或想要谈论游戏，请查看[讨论页](https://github.com/nroutasuo/level13/discussions)， [subreddit](https://www.reddit.com/r/level13/)或[不和谐服务器](https://discord.gg/BzMbATyKph)。

## 特点

* 生存和探索
* 基地建设和资源管理
* 随机生成的地图
* 物品、设备和环境危害
* 能够缓慢打开游戏新内容的技术

缺少的主要功能是故事和RPG元素。玩家的进度目前也被限制在某些层-还不可能达到游戏的实际结束。

## 代码概述

该项目使用[jQuery](https://jquery.com/)， [Require.js](http://requirejs.org/)， [Ash.js](https://github.com/brejep/ash-js)，并根据实体系统框架分为实体，组件和系统。可玩版本位于**h-pages**分支，而**master**可能包含未经测试和不平衡的功能。

## 实体和组件

所有游戏数据都存储在不同的[组件](https://github.com/nroutasuo/level13/tree/master/src/game/components)中，这些组件与玩家或扇区等实体相连。实体只是组件的容器。[EntityCreator](https://github.com/nroutasuo/level13/blob/master/src/game/EntityCreator.js)很好地概述了什么样的实体具有什么样的组件。

### 系统

各种独立的[系统](https://github.com/nroutasuo/level13/tree/master/src/game/systems)使用和更改组件上的数据，并在游戏中实现某些内容。它们生成资源，更新移动选项，解决战斗等等。UI的每个区域都由自己的[UI系统](https://github.com/nroutasuo/level13/tree/master/src/game/systems/ui)负责。

### 玩家动作

玩家在游戏中所能做的一切——主要是点击按钮——被称为“玩家行动”。每个动作都有名称、成本、要求等。[PlayerActionFunctions](https://github.com/nroutasuo/level13/blob/master/src/game/PlayerActionFunctions.js)类为每个动作包含一个函数并处理它们的结果。各种助手类负责检查需求、扣除成本、统一随机遭遇等等。

### 世界创造者

在新游戏开始时，将为游戏分配种子值。  [世界生成器](https://github.com/nroutasuo/level13/tree/master/src/worldcreator) 基于这个种子生成一个独特的世界，并且只有种子需要在会话之间保存。

![samplelevel2](/docs/samplelevel2.PNG)  ![samplelevel3](/docs/samplelevel3.PNG)

(样本水平结构)

游戏世界大致按以下步骤生成:
* [WorldGenerator](https://github.com/nroutasuo/level13/blob/master/src/worldcreator/WorldGenerator.js)确定整个世界的大致结构和重要的点，如营地和通道的位置
* [LevelGenerator](https://github.com/nroutasuo/level13/blob/master/src/worldcreator/LevelGenerator.js) 为每个Level添加更多细节
* [StructureGenerator](https://github.com/nroutasuo/level13/blob/master/src/worldcreator/StructureGenerator.js) 确定每个关卡的结构，根据前面步骤中设置的约束放置区域和路径
* [SectorGenerator](https://github.com/nroutasuo/level13/blob/master/src/worldcreator/SectorGenerator.js) 用资源、道具储存、环境危害、移动障碍等特征填充区域

平衡世界的两个重要单位是营地序数和关卡序数。玩家总是从第13关开始，关卡序号为1，营地序号为1。

## 贡献

如果您想报告错误或建议新功能，请先阅读[贡献指南](docs/CONTRIBUTING.md)。

## 链接

第13关的灵感主要来自于[A Dark Room](http://adarkroom.doublespeakgames.com/)。其他优秀的基于文本和/或增量的游戏还包括:


* [Kittens Game](http://bloodrizer.ru/games/kittens/)
* [Shark Game](http://cirri.al/sharks/)
* [Crank](https://faedine.com/games/crank/b39/)
* [CivClicker](http://civclicker.sourceforge.net/civclicker/civclicker.html)
* [Properity](http://playprosperity.ca/)

