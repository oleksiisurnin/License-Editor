window.$ = window.jQuery = require('jquery');
require('jquery-ui-dist/jquery-ui');
const { Arproj } = require('../Arproj.js');
const { ipcRenderer } = require('electron')

const querystring = require('querystring');
let query = querystring.parse(global.location.search);
let projPath = query['?path'];

let proj = new Arproj(projPath);
let licenses = proj.getModelChildrenByModelName('licenses_model');
let assets = proj.getAssetList();
let assetsAttr = proj.getModelChildrenByModelName('asset_attributions_model');

ipcRenderer.on('save', (event, path) => {
    save(path);
    alert('saved')
});

function save(path) {
    proj.updateModelChildren('licenses_model', licenses);
    proj.updateModelChildren('asset_attributions_model', assetsAttr);

    proj.save(path === undefined ? proj.path : path)
}

$(document).ready(function () {
    $(".new-item-licenses").on('click', function (e) {
        let i = licenses.length;

        licenses[i] = {
            modelName: 'license_model',
            identifier: proj.generateIdentifier('license_model')
        }

        
        drawLicenseItem(i);

        $('html, body').animate({
            scrollTop: $('#elem' + i).offset().top
        }, 1000);
    })

    $(".new-item-attr").on('click', function (e) {
        let i = assetsAttr.length;

        assetsAttr[i] = {
            modelName: 'asset_attribution_model',
            identifier: proj.generateIdentifier('asset_attribution_model')
        };

        drawAssetAttributionItem(i);


        $('html, body').animate({
            scrollTop: $('#elem' + i).offset().top
        }, 1000);
    })

    $(".sortable").sortable({
        stop: function (e, ui) {
            let count;
            let result = $(this).sortable('toArray');
            let data = $('.wrap').attr('data-file');
            switch (data) {
                case "licenses":
                    count = licenses.length;

                    result.forEach(k => {
                        let key = Number(k);
                        licenses.push(licenses[key])
                    });

                    licenses.splice(0, count);
                    break;
                case "assets-attr":
                    count = assetsAttr.length;

                    result.forEach(k => {
                        let key = Number(k);
                        assetsAttr.push(assetsAttr[key])
                    });

                    assetsAttr.splice(0, count);
                    break;

            }

            showContent(data);
            previewContent();
        }
    })

    $(".nav-item a").on('click', function (e) {
        e.preventDefault();
        $(".nav a").removeClass('active-nav');
        $(this).addClass('active-nav');

        let linkName = $(this).attr('name');
        let activeItem = $(".content");
        activeItem.attr("hidden", true);
        activeItem.filter('[name=' + linkName + ']').attr("hidden", false);

        showContent(linkName);
    });

    showContent("licenses");

    function showContent(type) {
        $('#listContent').empty();
        switch(type) {
            case "licenses":
                $( ".sortable" ).sortable( "enable" );
                for (let key in licenses) {
                    drawLicenseItem(key);
                }
                break;
            case "assets-attr":
                $( ".sortable" ).sortable( "enable" );
                for (let key in assetsAttr) {
                    drawAssetAttributionItem(key);
                }
                break;
            case "assets":
                $( ".sortable" ).sortable( "disable" );
                for (let key in assets) {
                    $('<div class="row mt-4 wrap" data-file="assets' + '" id="' + key + '">' +
                        '<div class="col-12 pb-4">' +
                        '<div id="' + 'elem' + key + '"></div>' + '</div>' + '</div>').appendTo($('#listContent'));
                    for (let k in assets[key]) {
                        if (k === "id" || k === "identifier") {
                            continue
                        }
                        $('<div class="border-bottom py-2"><input readonly type="text" name="' + k + '" value="' + assets[key][k] + '"></div>').appendTo($('#elem' + key))
                    }
                }
                break;
            
        }
        previewContent();
    }

    function drawLicenseItem(key) {
        $('<div class="row mt-4 wrap" data-file="licenses" id="' + key + '">' +
        '<div class="col-6">' +
        '<img alt="circle" src="../../assets/icons/icon-circle.svg" class="icon">' + '</div>' +
        '<div class="col-6 text-right del">' +
        '<img alt="delete" src="../../assets/icons/icon-delete.svg" class="icon">' + '</div>' +
        '<div class="col-12 pb-4">' +
        '<div id="' + 'elem' + key + '"></div>' + '</div>' + '</div>').appendTo($('#listContent'));

        let data = licenses[key];
        let inputs = {
            name: data.name,
            slug: data.slug,
            linkURLString: data.linkURLString
        };

        for (let k in inputs) {
            $('<div class="border-bottom py-2">' +
                '<input placeholder="' + k + '" class="lic" type="text" data-key="' + key + '" name="' + k + (data[k] !== undefined ? ('" value="'+ data[k]) : '') +'">' +
            '</div>').appendTo($('#elem' + key))
        }

        $(".lic").off("keydown keyup change click");
        $(".lic").on("keydown keyup change click", function () {
            licenses[$(this).attr('data-key')][$(this).attr('name')] = $(this).val();
            previewContent();
        });

        updateDeleteEvent();
    }

    function drawAssetAttributionItem(key) {
        $('<div class="row mt-4 wrap" data-file="assets-attr" id="' + key + '">' +
        '<div class="col-6">' +
        '<img src="../../assets/icons/icon-circle.svg" class="icon">' + '</div>' +
        '<div class="col-6 text-right del">' +
        '<img src="../../assets/icons/icon-delete.svg" class="icon">' + '</div>' +
        '<div class="col-12 pb-4">' +
        '<div id="' + 'elem' + key + '"></div>' + '</div>' + '</div>').appendTo($('#listContent'));

        let data = assetsAttr[key];
        let input = {
            assetAuthor: data.assetAuthor,
            assetTitle: data.assetTitle,
            assetURLString: data.assetURLString,
            licenseModelIdentifier: data.licenseModelIdentifier,
            assetModelIdentifier: data.assetModelIdentifier,
        };

        for (let k in input) {
            if (k === "licenseModelIdentifier" || k === "assetModelIdentifier") {
                $('<div class="border-bottom py-1">' +
                    '<select id="' + 'desc-' + k + key + '" class="a-attr" data-key="' + key + '" name="' + k + '">' +
                    '</select></div>').appendTo($('#elem' + key));
                if (k === "licenseModelIdentifier") {
                    $('<option selected disabled value="select license">select license</option>').appendTo($('#desc-' + k + key));
                    for (let i in licenses) {
                        if (licenses[i]["identifier"] === data[k]) {
                            $('<option selected value="' + licenses[i]["identifier"] + '">' + licenses[i]["name"] + '</option>').appendTo($('#desc-' + k + key));
                        } else {
                            $('<option  value="' + licenses[i]["identifier"] + '">' + licenses[i]["name"] + '</option>').appendTo($('#desc-' + k + key));
                        }
                    }
                } else if (k === "assetModelIdentifier") {
                    $('<option selected disabled value="select asset">select asset</option>').appendTo($('#desc-' + k + key));
                    for (let i in assets) {
                        if (assets[i]["identifier"] === data[k]) {
                            $('<option selected value="' + assets[i]["identifier"] + '">' + assets[i]["name"] + '</option>').appendTo($('#desc-' + k + key));
                        } else {
                            $('<option  value="' + assets[i]["identifier"] + '">' + assets[i]["name"] + '</option>').appendTo($('#desc-' + k + key));
                        }
                    }
                }
            } else {
                $('<div class="border-bottom py-1">' +
                    '<input placeholder="' + k + '" class="a-attr" type="text" data-key="' + key + '" name="' + k + (data[k] !== undefined ? ('" value="'+ data[k]) : '') + '">' + 
                '</div>').appendTo($('#elem' + key))
            }
        }

        $(".a-attr").off("keydown keyup change click");
        $(".a-attr").on("keydown keyup change click", function () {
            assetsAttr[$(this).attr('data-key')][$(this).attr('name')] = $(this).val();
            previewContent();
        });

        updateDeleteEvent();
    }

    function updateDeleteEvent() {
        $(".del").off("click");
        $(".del").on('click', function (e) {
            let data = $(this).parent().attr('data-file');
            let id = $(this).parent().attr('id');
            $(this).parent().remove();

            switch (data) {
                case "licenses":
                    delete licenses[id];
                    break;
                case "assets-attr":
                    delete assetsAttr[id];
                    break;
            }

            previewContent();
        });
    }

    function previewContent() {
        $('.preview-content').empty();
        $('<hr class="prev-hr" style="margin-top: 0;">').appendTo(".preview-content");

        for (let key in licenses) {
            if (licenses[key].name === undefined || licenses[key].name === '' || licenses[key].slug === undefined || licenses[key].slug === '') continue;
            $('<div id= "name-' + key + '" class="p-0 col-12 prev-title"><div class="mb-2"><strong>' + licenses[key].name + '</strong></div></div><hr class="prev-hr">').appendTo($(".preview-content"));

            for(let k in assetsAttr) {
                if (assetsAttr[k].licenseModelIdentifier === licenses[key].identifier && assetsAttr[k].assetModelIdentifier !== undefined && assetsAttr[k].assetModelIdentifier !== null) {
                    $('<div class="p-0 col-12"><span class="prev-title">' + (assetsAttr[k].assetTitle === undefined ? '' : assetsAttr[k].assetTitle) + '</span><span class="prev-autor">' + " by " + (assetsAttr[k].assetAuthor === undefined ? '' : assetsAttr[k].assetAuthor) + '</span></div>').appendTo($('#name-' + key));
                }
            }

        }
    }

    $('#open').on('click', function (){
        ipcRenderer.send('select-file');
    });

    $('#save').on('click', function (){
        save();
    });

    $('#saveAs').on('click', function (){
        ipcRenderer.send('save-as');
    });

});
