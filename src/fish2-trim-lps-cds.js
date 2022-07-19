const { fish2ResRootPath } = require("./config");
const fs = require('fs');

const infoEquals = (item1, item2) => {
    if (item1.x != item2.x || item1.y != item2.y || item1.r != item2.r) {
        return false;
    }
    return true;
}

const infosEquals = (a, b) => {
    const [len1, len2] = [a.length, b.length];
    if (len1 != len2) {
        return false;
    }
    for (let i = 0; i < len1; i++) {
        const [item1, item2] = [a[i], a[i]];
        if (!infoEquals(item1, item2)) {
            return false;
        }
    }
    return true;
};

const lpEquals = (a, b) => {
    if (!infoEquals(a.mainLockPoint, b.mainLockPoint)) {
        return false;
    }
    if (!infosEquals(a.lockPoints, b.lockPoints)) {
        return false;
    }
    return true;
}

const cdEquals = (a, b) => {
    if (!infoEquals(a.maxCDCircle, b.maxCDCircle)) {
        return false;
    }
    if (!infosEquals(a.cdCircles, b.cdCircles)) {
        return false;
    }
    return true;
}

const dealPath = function(path) {
    const nameReg = /(.*).(anims)/;
    for (const file of fs.readdirSync(path)) {
        const filepath = `${path}/${file}`;
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            dealPath(filepath);
        } else if (stat.isFile()) {
            const ret = file.match(nameReg);
            if (ret instanceof Array && ret.length > 1) {
                const content = fs.readFileSync(filepath);
                const objAnims = JSON.parse(content);
                const anims = objAnims.anims;
                if (anims) {
                    for (const anim of anims) {
                        if (anim.lps) {
                            let l = 1;
                            while (l < anim.lps.length) {
                                const [cur, prev] = [l, l - 1];
                                const [curItem, prevItem] = [anim.lps[cur], anim.lps[prev]];
                                if (lpEquals(curItem, prevItem)) {
                                    anim.lps.splice(cur, 1);
                                } else {
                                    ++l;
                                }
                            }
                        }
                        if (anim.cds) {
                            let l = 1;
                            while (l < anim.cds.length) {
                                const [cur, prev] = [l, l - 1];
                                const [curItem, prevItem] = [anim.cds[cur], anim.cds[prev]];
                                if (cdEquals(curItem, prevItem)) {
                                    anim.cds.splice(cur, 1);
                                } else {
                                    ++l;
                                }
                            }
                        }
                    }
                }
                fs.writeFileSync(filepath, JSON.stringify(objAnims, null, 4));
            }
        }
    }
}

dealPath(fish2ResRootPath)
