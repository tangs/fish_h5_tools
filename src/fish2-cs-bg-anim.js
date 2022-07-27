const { csActionRootPath } = require("./config");
const fs = require('fs');

const dealPath = function(path) {
    const nameReg = /bg(\d*).(actions|anims)/;
    for (const file of fs.readdirSync(path)) {
        const filepath = `${path}/${file}`;
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            
        } else if (stat.isFile()) {
            const ret = file.match(nameReg);
            if (ret instanceof Array && ret.length > 1) {
                console.log(ret[1]);
                const data = fs.readFileSync(filepath);
                const obj = JSON.parse(data);
                if (obj.animsFileName) {
                    obj.animsFileName = `bg${ret[1]}.anims`;
                }
                if (obj.resFileName) {
                    obj.resFileName = `bg${ret[1]}.atlas`;
                }
                fs.writeFileSync(filepath, JSON.stringify(obj, null, 4));
            }
        }
    }
}

dealPath(`${csActionRootPath}/bg/`)
