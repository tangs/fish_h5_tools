const { assert } = require('console');
const fs = require('fs');

const getCompoentByType = (comps, type, nodeId) => {
    for (const comp of comps) {
        if (comp["__type__"] === type && (
            comp["_name"] === nodeId ||
            (comp["node"] && comp["node"]["__id__"] == nodeId))) {
            return comp;
        }
    }
}

const infoPath = "/Users/tangs/Documents/fish_h5/assets/fish/config/game/fishinfo.json.txt";
const fishInfos = new Map();
{
    const infos = JSON.parse(fs.readFileSync(infoPath));
    // console.log(infos);
    for (const info of infos.fishInfos) {
        // console.log(info);
        fishInfos.set(info.fishType, info);
    }
}

const musicDir = "/Users/tangs/Documents/fish_h5/assets/fish/music";
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
            console.log(name, uuid);
        }
    }
}

const make = (plistPaths, destPrefabFolder, isBomb) => {
    const nameReg = /fish_type(\d+)_move \((\d+)\)/;

    const fishInfo = {};
    
    for (const path of plistPaths) {
        const fileContent = fs.readFileSync(path);
        const subMetas = JSON.parse(fileContent).subMetas;
        for (const key in subMetas) {
            const {name, uuid, userData} = subMetas[key];
            const ret = name.match(nameReg);
            if (ret instanceof Array && ret.length > 2) {
                const [type, frame] = [ret[1], ret[2]];
                // console.log(`type:${type}, frame:${frame}, uuid:${uuid}`);
                if (!fishInfo[type]) fishInfo[type] = [];
                const {rawWidth, rawHeight} = userData
                fishInfo[type].push({
                    type: Number.parseInt(type),
                    frame: Number.parseInt(frame),
                    uuid: uuid,
                    size: {
                        w: rawWidth,
                        h: rawHeight,
                    }
                });
            }
        }
    }
    
    for (const type in fishInfo) {
        const info = fishInfo[type];
        fishInfo[type] = info.sort((a, b) => a.frame - b.frame);
    }
    
    
    const srcPrefab = "/Users/tangs/Documents/fish_h5/assets/fish/fish/prefabs/template.prefab";
    const srcPrefabContent = fs.readFileSync(srcPrefab);
    

    
    for (const fishType in fishInfo) {
        const infos = fishInfo[fishType];
        // console.log(`type:${fishType}`);
        const jsonObj = JSON.parse(srcPrefabContent);
        jsonObj[1]["_name"] = `fish${fishType}`;
        // console.log(jsonObj[1]["_name"]);
        const spriteFrames = [];
        for (const info of infos) {
            spriteFrames.push({
                "__uuid__": info.uuid,
                "__expectedType__": "cc.SpriteFrame",
            })
        }
        const fishTypeId = Number.parseInt(fishType);
        assert(fishInfos.has(fishTypeId), `can't find info with fish type id:${fishTypeId}`);
        const info = fishInfos.get(fishTypeId);
        if (!info) {
            continue;
        }
        const destPath = `${destPrefabFolder}fish${fishType}.prefab`;
        const lockPoint = {
            x: 0,
            y: 0,
        };
        if (fs.existsSync(destPath)) {
            const content = fs.readFileSync(destPath);;
            const oldJsonObj = JSON.parse(content);
            const lockNode = getCompoentByType(oldJsonObj, "cc.Node", "lock");
            // console.log(lockNode);
            if (lockNode) {
                lockPoint.x = lockNode["_lpos"].x;
                lockPoint.y = lockNode["_lpos"].y;
            }
        }
        const {value, speedRate, lockPriority, isJackpot} = info || {value: 2, speedRate: 1, lockPriority: 1, isJackpot: false};
        const {w, h} = infos[0].size;
        // console.log(`w:${w}, h:${h}`);
        const trans1 = getCompoentByType(jsonObj, "cc.UITransform", 1);
        const fishScript = getCompoentByType(jsonObj, "80ccalqirFBbZ4VTByxgkc0", 1);
        // const audioSource = getCompoentByType(jsonObj, "cc.AudioSource", 1);
        const trans2 = getCompoentByType(jsonObj, "cc.UITransform", 4);
        const fishSprite = getCompoentByType(jsonObj, "cc.Sprite", 4)
        const lockNode = getCompoentByType(jsonObj, "cc.Node", "lock");

        const deathTalk = info["deathTalk"] || "";
        const uuid = musicInfos.get(deathTalk);
        // console.log(`deathTalk:${deathTalk}, ${musicInfos.has(deathTalk)}`);
        // console.log(`uuid:${uuid}`);

        // audioSource["_clip"]["__uuid__"] = uuid;

        fishScript.typeId = fishTypeId;
        fishScript.value = value;
        fishScript.speedRate = speedRate;
        fishScript.spriteFrames = spriteFrames;
        fishScript.isBomb = isBomb;
        fishScript.lockPriority = lockPriority;
        fishScript.isJackpot = isJackpot;
        fishSprite._spriteFrame = spriteFrames[0];
        if (uuid) {
            fishScript.deathTalkClip = {
                "__uuid__": uuid,
                "__expectedType__": "cc.AudioClip",
            };
        } else {
            fishScript.deathTalkClip = null;
        }
        trans1._contentSize.width = w;
        trans1._contentSize.height = h;
        trans2._contentSize.width = w;
        trans2._contentSize.height = h;
        lockNode["_lpos"].x = lockPoint.x;
        lockNode["_lpos"].y = lockPoint.y;
        // collider box
        const colliderBox = getCompoentByType(jsonObj, "cc.BoxCollider2D", 1);
        colliderBox._offset.x = 0;
        colliderBox._offset.y = 0;
        colliderBox._size.width = w;
        colliderBox._size.height = h;
        // console.log(`len:${spriteFrames.length}`);
        const txt = JSON.stringify(jsonObj, null, 2);
        fs.writeFileSync(destPath, txt);
    }
}

const normalDir = "/Users/tangs/Documents/fish_h5/assets/fish/images/fish/normal";
const dir = fs.readdirSync(normalDir);
let metas = dir.filter((file) => file.endsWith(".plist.meta")).map((file) => `${normalDir}/${file}`);
const plistPaths = [
    "/Users/tangs/Documents/fish_h5/assets/fish/images/fish/common_fish1.plist.meta",
    "/Users/tangs/Documents/fish_h5/assets/fish/images/fish/common_fish2.plist.meta",
    ...metas
];
// console.log(`paths:${plistPaths}`);

const destPrefabFolder = "/Users/tangs/Documents/fish_h5/assets/fish/fish/prefabs/fish/";
make(plistPaths, destPrefabFolder, false);

{
    const dir = "/Users/tangs/Documents/fish_h5/assets/fish/images/fish/bomb/";
    const files = fs.readdirSync(dir);
    let metas = files.filter((file) => {
        // console.log(`file:${file}`);
        return file.endsWith(".plist.meta");
    });
    metas = metas.map((path) => `${dir}${path}`);
    console.log(metas);
    make(
        metas, 
        "/Users/tangs/Documents/fish_h5/assets/fish/fish/prefabs/bomb/",
        true);
}