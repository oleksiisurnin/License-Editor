//@ts-check

const AdmZip = require('adm-zip');
const JSONbig = require('json-bigint');
const { Arproj } = require('./Arproj.js');

class Arp {
    constructor(path) {
        
        this.path = path;

        let unzip = new AdmZip(path);
        this.json = JSONbig.parse(unzip.readAsText(unzip.getEntries()[0]));
        this.fileName = unzip.getEntries()[0].name;
    }

    save(path) {
        let zip = new AdmZip();

        zip.addFile(this.fileName, Buffer.from(JSONbig.stringify(this.json), "utf-8"));

        zip.writeZip(path);
    }

    getPatches() {
        let patches = [];
    
        let readPatchModel = (patchModel) => {
            patches.push(patchModel)
            let children = Arproj.getModelByModelName('patches_model', patchModel.children).children
    
            if (children !== undefined)
                children.forEach(element => {
                    readPatchModel(element);
                });
        }
    
        readPatchModel(this.json.children[0]);
        return patches;
    }
}

module.exports = { Arp }
