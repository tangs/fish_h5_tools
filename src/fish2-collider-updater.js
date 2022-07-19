const fs = require('fs');
const { collideRootPath, csActionRootPath } = require('./config')

const circlesInfo = new Map();
const linesInfo = new Map();

const dealPath = function(path) {
    const nameReg = /(.*) \((\d+)\)\.png\.(circles|lines)/;
    for (const file of fs.readdirSync(path)) {
        const filepath = `${path}/${file}`;
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            dealPath(filepath);
        } else if (stat.isFile()) {
            const ret = file.match(nameReg);
            if (ret instanceof Array && ret.length > 1) {
                const content = fs.readFileSync(filepath);
                const items = JSON.parse(content).items;
                const [name, index, type] = [ret[1], Number.parseInt(ret[2]), ret[3]];
                const info = type == "circles" ? circlesInfo : linesInfo;
                if (!info.has(name)) {
                    info.set(name, new Map());
                }
                info.get(name).set(index, items);
                // console.log(file, ret[1], ret[2], ret[3]);
            }
        }
    }
}

const infoEquals = (a, b) => {
    const [len1, len2] = [a.length, b.length];
    if (len1 != len2) {
        return false;
    }
    for (let i = 0; i < len1; i++) {
        const [item1, item2] = [a[i], a[i]];
        if (item1.x != item2.x || item1.y != item2.y || item1.r != item2.r) {
            return false;
        }
    }
    return true;
};

const trim = (infos) => {
    for (const [_, info] of infos) {
        const keys = Array.from(info.keys()).sort((a, b) => a - b);
        let l = 1;
        const removeKey = [];
        while (l < keys.length) {
            const [curIndex, prevIndex] = [keys[l], keys[l - 1]];
            const [cur, prev] = [info.get(curIndex), info.get(prevIndex)];
            // console.log(cur, prev);
            if (infoEquals(cur, prev)) {
                removeKey.push(curIndex);
            }
            l++;
        }
        for (const key of removeKey) {
            info.delete(key);
        }
    }
};

dealPath(collideRootPath);
trim(linesInfo);
trim(circlesInfo);

const dealActions = (path) => {
    const nameReg = /(.*)\.frames/;
    const nameReg1 = /(.*) \((\d+)\)\.png/;
    for (const file of fs.readdirSync(path)) {
        const filepath = `${path}/${file}`;
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            dealActions(filepath);
        } else if (stat.isFile()) {
            const ret = file.match(nameReg);
            if (ret instanceof Array && ret.length > 1) {
                try {
                    const animPath = `${path}/${ret[1]}.anims`;
                    const content = fs.readFileSync(filepath);
                    const contentAnims = fs.readFileSync(animPath);
                    const obj = JSON.parse(content);
                    const objAnims = JSON.parse(contentAnims);
                    for (const frameAnim of obj.frameAnims) {
                        const frames = frameAnim.frames;
                        const frameName = frames[0].picName;
                        const animName = frameAnim.name;
                        // for (const anim of objAnims.anims) {
                        //     if (anim.name == animName) {
                        const ret1 = frameName.match(nameReg1);
                        if (ret1 instanceof Array && ret1.length > 1) {
                            let timePerFrame = 0;
                            if (frames.length > 1) {
                                const ret2 = frames[1].picName.match(nameReg1);
                                if (ret2 instanceof Array && ret2.length > 1) {
                                    const count = Number.parseInt(ret2[2]) - Number.parseInt(ret1[2]);
                                    timePerFrame = (frames[1].time - frames[0].time) / count;
                                }
                            }

                            for (const anim of objAnims.anims) {
                                if (anim.name == animName) {
                                    const key = ret1[1];
                                    const lines = linesInfo.get(key);
                                    const circles = circlesInfo.get(key);

                                    const linesKeys = Array.from(lines.keys()).sort();
                                    const circlesKeys = Array.from(circles.keys()).sort();
                                    const lps = [];
                                    const cds = [];

                                    for (const key of linesKeys) {
                                        const time = (key - 1) * timePerFrame;
                                        const lineInfo = lines.get(key);
                                        const lockPoints = [];
                                        for (let i = 1; i < lineInfo.length; i++) {
                                            const {x, y} = lineInfo[i];
                                            lockPoints.push({
                                                x: x,
                                                y: y,
                                            });
                                        }
                                        lps.push({
                                            time: time,
                                            mainLockPoint: {
                                                x: lineInfo[0].x,
                                                y: lineInfo[0].y,
                                            },
                                            lockPoints: lockPoints,
                                        });
                                    }

                                    for (const key of circlesKeys) {
                                        const time = (key - 1) * timePerFrame;
                                        const cdInfo = circles.get(key);
                                        const cdCircles = [];
                                        for (let i = 1; i < cdInfo.length; i++) {
                                            const {x, y, r} = cdInfo[i];
                                            cdCircles.push({
                                                x: x,
                                                y: y,
                                                r: r,
                                            });
                                        }
                                        cds.push({
                                            time: time,
                                            maxCDCircle: {
                                                x: cdInfo[0].x,
                                                y: cdInfo[0].y,
                                                r: cdInfo[0].r,
                                            },
                                            cdCircles: cdCircles,
                                        });
                                    }
                                    anim.lps = lps;
                                    anim.cds = cds;
                                    // console.log(ret);
                                    break;
                                }
                            }

                        }
                    }
                    fs.writeFileSync(animPath, JSON.stringify(objAnims, null, 4));
                } catch(e) {
                    console.log(e);
                }
            }
        }
    }
};
dealActions(csActionRootPath);

console.log("end");
