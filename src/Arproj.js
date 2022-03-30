//@ts-check

const AdmZip = require('adm-zip');
const JSONbig = require('json-bigint');
const { v4: uuidv4 } = require('uuid');
const AES = require('crypto-js/aes');
const Utf8 = require('crypto-js/enc-utf8');

class Arproj {
    constructor(path) {
        this.path = path;

        let unzip = new AdmZip(path);
        let mainJson;
        let files = [];

        unzip.getEntries().forEach(function(entry) {
            if (entry.entryName === 'main.json') {
                mainJson = unzip.readAsText(entry);
            }
            else {
                files.push(entry);
            }
        });

        this.mainJson = JSONbig.parse(mainJson);
        this.files = files;

        this.lastIndex = 0;
        this.uuid = uuidv4();

        let readObject = (object) => {
            for (var key in object) {
                if (typeof object[key] === 'object')
                    readObject(object[key]);
                else if (key === 'identifier') {
                    let index = parseInt(object[key].replace(object['modelName'], '').split('-')[0]);
                    if (this.lastIndex < index) this.lastIndex = index;
                }
            }
            
        }

        readObject(this.mainJson);
    }

    save(path) {
        let zip = new AdmZip();

        zip.addFile('main.json', Buffer.from(JSONbig.stringify(this.mainJson), "utf-8"));
        
        this.files.forEach(file => {
            zip.addFile(file.entryName, file.getData());
        });

        zip.writeZip(path);
    }

    getModelChildrenByModelName(modelName, array = this.mainJson['children']) {
        let children = array.filter(array => array.modelName === modelName)[0]['children'];
        return children === undefined ? [] : children;
    }

    /**
     * @param {String} modelName
     * @returns {Number}
     * @memberof arproj
     */
    getModelId(modelName) {
        let id;

        this.mainJson['children'].forEach((value, index) => {
            if (value.modelName === modelName) id = index;
        });

        return id;
    }

    getAssetList() {
        let models = ['textures', 'fonts', 'asset_collections_model', 'scripts_model', 'sounds', 'patch_assets_model', 'block_documents_model'];
        let assets = [];

        models.forEach(model => this.getModelChildrenByModelName(model).forEach(element => {
            if (element.name !== undefined && element.modelName !== undefined) {
                assets.push({
                    'id': assets.length,
                    'name': element.name,
                    'modelName': element.modelName,
                    'identifier': element.identifier
                })
            }
        }));

        return assets;
    }

    generateIdentifier(modelName) {
        this.lastIndex += 2;
        return modelName + ':' + this.lastIndex + '-' + this.uuid;
    }

    updateModelChildren(modelName, children) {
        this.mainJson['children'][this.getModelId(modelName)]['children'] = children.filter(value => value !== {});
    }

    getPatches() {
        let patches = [];
        let array = this.mainJson['children'];
        ['patch_graphs_model', 'patch_graph_model'].forEach(element => {
            array = Arproj.getModelByModelName(element, array).children
        })
    
        let readPatchModel = (patchModel) => {
            patches.push(patchModel)
            let children = Arproj.getModelByModelName('patches_model', patchModel.children).children
    
            if (children !== undefined)
                children.forEach(element => {
                    readPatchModel(element);
                });
        }
    
        readPatchModel(array[0]);
        return patches;
    }

    static encryptPatches(patches, password, hidden = true) {
        let multiplier = parseInt(password, 36);
        patches.forEach(patch => {
            let metadata = Arproj.getModelByModelName('patch_metadata_model', patch.children);

            metadata.hidden = hidden;
            metadata.position[0] = metadata.position[0] / multiplier
            metadata.position[1] = metadata.position[1] / multiplier

            patch.name = AES.encrypt(patch.name, password).toString();
        });
    }

    static decryptPatches(patches, password, hidden = false) {
        let multiplier = parseInt(password, 36);
        patches.forEach(patch => {
            let metadata = Arproj.getModelByModelName('patch_metadata_model', patch.children);

            metadata.hidden = hidden;
            metadata.position[0] = metadata.position[0] * multiplier
            metadata.position[1] = metadata.position[1] * multiplier

            patch.name = AES.decrypt(patch.name, password).toString(Utf8);
        });
    }

    static getModelByModelName(modelName, array) {
        return array.filter(array => array.modelName === modelName)[0];
    }
}

module.exports = { Arproj }
