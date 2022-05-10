const fs = require('fs');

const getCompoentByType = (comps, type, nodeId) => {
    for (const comp of comps) {
        if (comp["__type__"] === type && comp["node"]["__id__"] == nodeId) {
            return comp;
        }
    }
}

{
    const nameReg = /game(\d+).json.txt.meta/;
    const gameConfigDir = "/Users/tangs/Documents/fish_h5/assets/fish/config/game";
    const sceneDir = "/Users/tangs/Documents/fish_h5/assets/fish/scenes/fish";
    for (const file of fs.readdirSync(gameConfigDir)) {
        const ret = file.match(nameReg);
        if (ret instanceof Array && ret.length > 0) {       
            const gameId = ret[1];
            console.log(file, gameId);
        }
    }
}