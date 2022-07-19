const fs = require('fs');
const { root2Path } = require('./config')

const FPS = 15;

const fishInfos = new Map();

const fish = /\<key\>(fish_type(\d+)_move \((\d+)\)\.png)\<\/key\>/g;
const parseFishPlist = (rootPath, plistDir, plistName, destDir, actionName) => {
    actionName = actionName || 'move';
    const path = `${rootPath}/${plistDir}/${plistName}`;
    const content = `${fs.readFileSync(path)}`;
    for (const ret of content.matchAll(fish)) {
        // const filename = ret[1];
        const typeId = Number.parseInt(ret[2]);
        const frameIdx = Number.parseInt(ret[3]);
        
        if (!fishInfos.has(typeId)) {
            fishInfos.set(typeId, []);
        }
        fishInfos.get(typeId).push(frameIdx);
    }
    for (const [typeId, frames] of fishInfos) {
        const framesFile = `fish_${typeId}.frames`;
        const animsFile = `fish_${typeId}.anims`;
        const actionsFile = `fish_${typeId}.actions`;
        const destFramesPath = `${rootPath}/${destDir}/${framesFile}`;
        const destAnimsPath = `${rootPath}/${destDir}/${animsFile}`;
        const destActionsPath = `${rootPath}/${destDir}/${actionsFile}`;

        let time = 0;
        const frames1 = frames.sort((a, b) => a - b).map((index) => {
            const info = {
                time: time,
                picName: `fish_type${typeId}_move (${index}).png`,
            }
            time += 1.0 / FPS;
            return info;
        });

        const framesInfo = {
            frameAnims: [{
                name: actionName,
                frames: frames1,
                totalSeconds: time,
            }],
            plists: [
                `${plistDir}/${plistName}`
            ],
        };
        fs.writeFileSync(destFramesPath, JSON.stringify(framesInfo, null, 4));

        // sync anims file.
        if (fs.existsSync(destAnimsPath)) {
            const info = JSON.parse(fs.readFileSync(destAnimsPath));
            info.anims[0].totalSeconds = time;
            fs.writeFileSync(destAnimsPath, JSON.stringify(info, null, 4));
        } else {
            const info = {
                resFileName: framesFile,
                anims: [
                    {
                        name: actionName,
                        skin: '',
                        totalSeconds: time,
                        nextAnim: '',
                        lps: [
                            {
                                "time": 0,
                                "mainLockPoint": {
                                    "x": 0,
                                    "y": 0
                                },
                                "lockPoints": []
                            } 
                        ],
                        cds: [
                            {
                                "time": 0,
                                "maxCDCircle": {
                                    "x": 0,
                                    "y": 0,
                                    "r": 20
                                },
                                "cdCircles": [
                                    {
                                        "x": 0,
                                        "y": 0,
                                        "r": 20
                                    }
                                ]
                            }
                        ],
                    }
                ]
            }
            fs.writeFileSync(destAnimsPath, JSON.stringify(info, null, 4));
        }

        // sync actions file.
        if (fs.existsSync(destActionsPath)) {
            const info = JSON.parse(fs.readFileSync(destActionsPath));
            info.actions[0].totalSeconds = time;
            fs.writeFileSync(destActionsPath, JSON.stringify(info, null, 4));
        } else {
            const info = {
                animsFileName: animsFile,
                actions: [
                    {
                        name: actionName,
                        totalSeconds: time,
                        baseSpeed: 100,
                        events: [
                            {
                                time: 0,
                                speed: 100,
                                animPlayRatio: 1,
                                animIndex: 0,
                            }
                        ],
                    }
                ]
            }
            fs.writeFileSync(destActionsPath, JSON.stringify(info, null, 4));
        }
    }
}

parseFishPlist(root2Path, 'fish/cs', 'cs_normal_fish_1.plist', 'actions/cs/normal_fish');
fishInfos.clear();
parseFishPlist(root2Path, 'fish/cs', 'cs_normal_fish_2.plist', 'actions/cs/normal_fish');
fishInfos.clear();
parseFishPlist(root2Path, 'fish/cs', 'cs_normal_fish_3.plist', 'actions/cs/normal_fish');

fishInfos.clear();
parseFishPlist(root2Path, 'fish/cs', 'cs_common_fish_1.plist', 'actions/cs/normal_fish');
fishInfos.clear();
parseFishPlist(root2Path, 'fish/cs', 'cs_common_fish_2.plist', 'actions/cs/normal_fish');
fishInfos.clear();
parseFishPlist(root2Path, 'fish/cs', 'cs_common_fish_3.plist', 'actions/cs/normal_fish');

fishInfos.clear();
parseFishPlist(root2Path, 'fish/cs', 'cs_bomb_fish.plist', 'actions/cs/bomb', '');

fishInfos.clear();
parseFishPlist(root2Path, 'fish/cs', 'cs_cyclone.plist', 'actions/cs/cyclone', 'show');

fishInfos.clear();
parseFishPlist(root2Path, 'fish/cs', 'cs_seaweed.plist', 'actions/cs/seaweed', 'show');


console.log('end');