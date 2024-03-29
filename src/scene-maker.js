const { assert } = require('console');
const fs = require('fs');
const { rootPath } = require('./config')
const { getCompoentByType} = require('./utils')

// const getCompoentByType = (comps, type, nodeId) => {
//     for (const comp of comps) {
//         if (comp["__type__"] === type && (!nodeId || comp["node"]["__id__"] == nodeId)) {
//             return comp;
//         }
//     }
// }

const gameFishTypes = new Map();
const allFishTypes = new Set();

const gameBgs = new Map();
const allBgs = new Set();
const allBgMusic = new Map();

const fishPrefabUuid = new Map();
const bgImageUuid = new Map();
const timelinesUuid = new Map();

{
    const nameReg = /game(\d+).json.txt$/;
    const nameMetaReg = /game(\d+).json.txt.meta$/;
    const gameConfigDir = `${rootPath}/assets/fish/config/game`;
    const sceneDir = `${rootPath}/assets/fish/scenes/fish`;

    const gameConfigFilter = (gameId) => {
        return Number.parseInt(gameId) < 1000;
    }

    for (const file of fs.readdirSync(gameConfigDir)) {
        {
            const ret = file.match(nameMetaReg);
            if (ret instanceof Array && ret.length > 0) {
                const gameId = ret[1];
                if (!gameConfigFilter(gameId)) {
                    continue;
                }
                const path1 = `${gameConfigDir}/${file}`;
                const content = fs.readFileSync(path1);
                const {uuid} = JSON.parse(content);
                timelinesUuid.set(gameId, uuid);
                if (gameId === "1") {
                    timelinesUuid.set("standalone", uuid);
                }
                // console.log(`bg index:${bgIndex}, uuid:${uuid}`);
            }
        }
        const ret = file.match(nameReg);
        if (ret instanceof Array && ret.length > 0) {       
            const gameId = ret[1];
            if (!gameConfigFilter(gameId)) {
                continue;
            }
            const fishTypeSet = new Set();
            const bgs = new Set();
            const path = `${gameConfigDir}/${file}`;
            const content = fs.readFileSync(path);
            const jsonObj = JSON.parse(content);
            const { bgMusic } = jsonObj;
            console.log(`bg music:${bgMusic}`);
            allBgMusic.set(gameId, bgMusic);
            // console.log(path, file, gameId);

            for (const scene of jsonObj.scenes) {
                for (const timeline of scene.timelines) {
                    const fishTypes = timeline.info.fishType;
                    // console.log(fishTypes);
                    fishTypes.map((type) => {
                        fishTypeSet.add(type);
                        allFishTypes.add(type);
                    });
                }
                const {bgIndex} = scene;
                bgs.add(bgIndex);
                allBgs.add(bgIndex);
            }
            gameFishTypes.set(gameId, fishTypeSet);
            gameBgs.set(gameId, bgs);
            // console.log(fishTypeSet);
        }
    }
    gameFishTypes.set("standalone", allFishTypes);
    gameBgs.set("standalone", allBgs);
}


const musicDir = `${rootPath}/assets/fish/music`;
const musicInfos = new Map();
{
    const nameReg = /(\w+).(mp3|m4a).meta/;
    for (const file of fs.readdirSync(musicDir)) {
        const ret = file.match(nameReg);
        if (ret instanceof Array && ret.length > 1) {       
            const name = ret[1];
            // console.log(file, name);
            const path = `${musicDir}/${file}`;
            const fileContent = fs.readFileSync(path);
            const meta = JSON.parse(fileContent);
            // console.log(meta);
            // const comp = getCompoentByType(meta, "cc.AudioSource", 1);
            const {uuid} = meta;
            musicInfos.set(name, uuid);
            // console.log(name, uuid);
        }
    }
}

{
    const fishPrefabPaths = [
        `${rootPath}/assets/fish/fish/prefabs/bomb`,
        `${rootPath}/assets/fish/fish/prefabs/fish`,
        `${rootPath}/assets/fish/fish/prefabs/combination`,
    ];
    const nameReg = /fish(\d+).prefab.meta$/;
    for (const path of fishPrefabPaths) {
        for (const file of fs.readdirSync(path)) {
            const ret = file.match(nameReg);
            if (ret instanceof Array && ret.length > 0) {
                const typeId = ret[1];
                const path1 = `${path}/${file}`;
                const content = fs.readFileSync(path1);
                const {uuid} = JSON.parse(content);
                fishPrefabUuid.set(Number.parseInt(typeId), uuid);
                // console.log(`type id:${typeId}, uuid:${uuid}`);
            }
        }
    }
    // console.log(fishPrefabUuid);
}
{
    const bgImagePath = [
        `${rootPath}/assets/fish/images/bgs`,
    ];
    const nameReg = /scene(\d+).jpg.meta$/;
    for (const path of bgImagePath) {
        for (const file of fs.readdirSync(path)) {
            const ret = file.match(nameReg);
            if (ret instanceof Array && ret.length > 0) {
                const bgIndex = ret[1];
                const path1 = `${path}/${file}`;
                const content = fs.readFileSync(path1);
                const {uuid} = JSON.parse(content).subMetas.f9941;
                bgImageUuid.set(Number.parseInt(bgIndex), uuid);
                // console.log(`bg index:${bgIndex}, uuid:${uuid}`);
            }
        }
    }
}
{
    const fishSceneTmpPath = `${rootPath}/assets/fish/scenes/fish/fish.scene`;
    const sceneDestPath = `${rootPath}/assets/fish/scenes/fish/`;
    // const gameIds = Array.from(gameFishTypes.keys());
    // console.log(gameIds);
    const content = fs.readFileSync(fishSceneTmpPath);
    for (const gameId of gameBgs.keys()) {
        console.log("***************start*******************")
        const destFilePath = `${sceneDestPath}/fish-${gameId}.scene`;
        const tmpObj = JSON.parse(content);
        const fishAssetsMgr = getCompoentByType(tmpObj, "c0672QOzepOmZmIJyjc9/QY");
        const fishScript = getCompoentByType(tmpObj, "fb10c/rSnNAV7RObXxEz8ZA");
        const rootScript = getCompoentByType(tmpObj, "a783eVMAfNOpZpfy0khUhCr");
        const sceneScript = getCompoentByType(tmpObj, "cc.Scene");
        const bgMusic = allBgMusic.get(gameId);
        const bgMusicUuid = musicInfos.get(bgMusic);
        console.log(`game id:${gameId}, bg music:${bgMusic}, uuid:${bgMusicUuid}`);
        if (bgMusicUuid != undefined) {
            const audioSource = getCompoentByType(tmpObj, "cc.AudioSource");
            audioSource["_clip"]["__uuid__"] = bgMusicUuid;
        }

        const fishPrefabs = [];
        const fishTypes = Array.from(gameFishTypes.get(gameId)).sort((a, b) => a - b);
        assert(timelinesUuid.has(gameId));
        const timelineUuid = timelinesUuid.get(gameId);
        console.log(`game id:${gameId}, timeline uuid:${timelineUuid}, len:${fishTypes.length}`);
        console.log(fishTypes);

        // fishScript.timelinesJson["__uuid__"] = timelineUuid;
        fishScript.timelinesText["__uuid__"] = timelineUuid;

        sceneScript["_name"] = `fish-${gameId}`;
        rootScript.isStandalone = gameId === "standalone";

        const metaPath = `${destFilePath}.meta`;
        if (fs.existsSync(metaPath)) {
            const content1 = fs.readFileSync(metaPath);
            const tmpObj1 = JSON.parse(content1);
            sceneScript["_id"] = tmpObj1.uuid;
        }

        for (const fishType of fishTypes) {
            assert(fishPrefabUuid.has(fishType), `can't find fish type:${fishType} uuid.`);
            const uuid = fishPrefabUuid.get(fishType);
            fishPrefabs.push({
                "__uuid__": uuid,
                "__expectedType__": "cc.Prefab"
            });
        }
        if (gameId != "standalone") {
            const bgs = gameBgs.get(gameId);
            let bgUuid = "";

            for (const bg of bgs) {
                const uuid = bgImageUuid.get(bg);
                console.log(`bg:${bg}, bg uuid:${uuid}`);
                if (bgUuid == null || bgUuid == "") {
                    bgUuid = uuid;
                }
            }

            {
                let idx = 1;
                do {
                    const comp = getCompoentByType(tmpObj, "bd05459cRhHBphDYUl8v3W1", undefined, (comp) => {
                        return comp.id == idx;
                        }
                    );
                    if (comp == null) {
                        break;
                    }
                    if (!bgs.has(idx)) {
                        comp.spriteFrame.__uuid__ = bgUuid;
                    }
                    ++idx;
                } while(true);
            }

            // console.log(bgs);
            const bg = getCompoentByType(tmpObj, "cc.Sprite", "bg")
            bg._spriteFrame.__uuid__ = bgUuid
        }
        fishAssetsMgr.otherFish = fishPrefabs;
        fs.writeFileSync(destFilePath, JSON.stringify(tmpObj, null, 2));
        console.log("***************end*******************\n")
    }
}

// const allTypesArr = Array.from(allFishTypes).sort((a, b) => a - b);
// console.log(allTypesArr);
// const arr = Array.from(allBgs).sort((a, b) => a - b);
// console.log(arr);
