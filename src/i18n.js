let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
let _ = require('lodash');

const I18N_TYPE_NAME = "i18n";

class I18n {
  constructor(dbData, idArray){
    this.dbData = dbData;
    this.idArray = idArray;

    if((typeof this.dbData == 'object')&&(typeof this.dbData.i18n == 'undefined')){
      this.dbData.i18n = {};
    }

    this.outputLang = "en-us";
  }

  translate(lang){
    let translateElement = (element) => {
      let header = "i18n::";
      if((typeof element == 'string')&&(element.indexOf(header) == 0)){
        let key = element.substring(header.length);
        if(key.indexOf('res-i18n-') == 0){
          element = this.getStr(lang, key);
        }
      }
      else if(typeof element == 'object'){
        for(let i in element){
          element[i] = translateElement(element[i]);
        }
      }
      return element;
    }

    for(let i in this.dbData){
      this.dbData[i] = translateElement(this.dbData[i]);
    }
    this.dbData.language = this.outputLang;
    return this.dbData;
  }

  getStr(lang, key){
    //console.log("getStr: lang="+lang);
    //console.log(key);

    if(_.isEmpty(this.dbData.i18n)){
      return "";
    }
    
    let i18nData = this.dbData.i18n[key];
    if(i18nData === undefined){
      return "";
    }
    if(lang === undefined){
      lang = i18nData.default;
    }

    if((typeof i18nData != 'object')||(typeof i18nData.data != 'object')){
      return "";
    }

    if(typeof i18nData.data[lang] == 'string'){
      this.outputLang = lang;
      return i18nData.data[lang];
    }
    else if(typeof i18nData.data[i18nData.default] == 'string') {
      this.outputLang = i18nData.default;
      return i18nData.data[i18nData.default];
    }
    else {
      return "";
    }
  }

  makei18n(i18nSchema, inputData, lang) {
    let seq = -1;
    let makei18nElement = (schemaData, element, dbDataElement) => {
      seq++;
      if((typeof element === typeof schemaData)&&(_.isEmpty(element) === false)){
        let translatable = false;
        if(typeof element === 'string'){
          translatable = true;
        }
        //else if((Array.isArray(element))&&(typeof element[0] === 'string')){
        //  translatable = true;
        //}

        if(translatable){
          let key = null;
          let header = 'i18n::';
          let i18nData = null;
          let i18nExisted = false;

          //check string existed
          if((typeof dbDataElement === 'string')&&(dbDataElement.indexOf(header) === 0)){
            key = dbDataElement.substring(header.length);
            i18nData = _.cloneDeep(this.dbData.i18n[key]);

            if(typeof i18nData === 'object'){
              i18nExisted = true;
            }
          }

          if(i18nExisted){
            i18nData.data[lang] = element;
            let result = this.updateI18n(key, i18nData);
          }
          else {
            i18nData = {
              "default": lang,
              "data": {}
            };
            //create new
            i18nData.data[lang] = element;
  
            let result = this.addI18n(i18nData, seq);
            key = result.data.id;
          }
          element = header+key;
        }
        else if(typeof element === 'object'){

          if(typeof dbDataElement === 'object'){
            if(Array.isArray(element)){

              for(let i in element){
                element[i] = makei18nElement(schemaData[0], element[i], dbDataElement[i]);
              }
            }
            else{
              for(let i in schemaData){
                element[i] = makei18nElement(schemaData[i], element[i], dbDataElement[i]);
              }
            }
          }
          else {
            if(Array.isArray(element)){
              for(let i in element){
                element[i] = makei18nElement(schemaData[0], element[i]);
              }
            }
            else{
              for(let i in schemaData){
                element[i] = makei18nElement(schemaData[i], element[i]);
              }
            }
          }
        }
      }

      return element;
    };

    if((typeof this.dbData === 'object')&&(typeof inputData === 'object')) {
      for(let i in i18nSchema){  
        inputData[i] = makei18nElement(i18nSchema[i], inputData[i], this.dbData[i]);
      }
    }
    return inputData;
  }

  //================ CRUD ========================
  getNewResourceID(type, seq){
    const dateTime = Date.now();
    const timestamp = Math.floor(dateTime);

    let id = `res-${type}-${timestamp}`;
    if((typeof seq == 'string')||(typeof seq == 'number')){
      id += '-'+seq;
    }
    return id;
  }

  getI18n(fullID) {
    try{
      //output
      let dataArray = [];

      let makeI18nArray = function(source, dest){
          for(let i18n_id in source.i18n){
            let i18nData = source.i18n[i18n_id];
            i18nData.id = fullID+i18n_id;
            dest.push(i18nData);
          }
          return;
      }

      makeI18nArray(this.dbData, dataArray);

      //if empty
      if(dataArray.length == 0){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }

      return JSONAPI.makeJSONAPI(I18N_TYPE_NAME, dataArray);
    }catch(err) {
      throw err;
    }
  }

  getI18nByID(i18n_id) {
    try {
      let i18nData = this.dbData.i18n[i18n_id];
      let fullID = Utils.makeFullID(this.idArray);

      if(typeof i18nData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }

      //output
      i18nData.id = fullID+i18n_id;
    　let output = JSONAPI.makeJSONAPI(I18N_TYPE_NAME, i18nData);

      return output;
    }catch(err) {
      throw err;
    }
  }

//  ====addi18n======
//  [ { default: 'en-us',
//      data: { 'en-us': 'apple', 'zh-tw': '蘋果', jp: 'りんご', kr: '애플' } } ]
  addI18n(inputData, seq) {
    let output;
    console.log("====addi18n======");
    console.log(inputData);

    try {
      let oneDataProcess = (oneData, arraySeq) => {
        let inputSeq = oneData.seq;
        delete oneData.id;
        let i18n_id = this.getNewResourceID("i18n", arraySeq);
        //let path = Utils.makePath(this.idArray);
        let outputBuf;

        console.log(i18n_id);
        //console.log(path);

        console.log(oneData);
        this.dbData.i18n[i18n_id] = oneData;

        outputBuf = oneData;
        outputBuf.id = i18n_id;

        //check
        let defaultLang = oneData.default;
        if((typeof defaultLang != 'string')||(typeof oneData.data[defaultLang] == 'undefined')){
          for(let i in oneData.data){ //set the first lang to default
            oneData.default = i;
            break;
          }
        }

        return outputBuf;
      }

      let outputBuf;
      if(Array.isArray(inputData)){
        let outputBufArray = [];
        for(let i in inputData){
          outputBuf = oneDataProcess(inputData[i], i);
          outputBufArray.push(outputBuf);
        }
        console.log(outputBufArray);
        output = JSONAPI.makeJSONAPI(I18N_TYPE_NAME, outputBufArray);
      }
      else {
        outputBuf = oneDataProcess(inputData, seq);
        output = JSONAPI.makeJSONAPI(I18N_TYPE_NAME, outputBuf);
      }
      
      return output;
    }catch(err) {
      console.log(err);
      throw err;
    }
  }

  updateI18n(i18n_id, inputData) {
    let fullID = Utils.makeFullID(this.idArray);

    try {
      let i18nData = this.dbData.i18n[i18n_id];
      if(typeof i18nData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }

      //check
      let defaultLang = inputData.default;
      if((typeof defaultLang != 'string')||(typeof inputData.data[defaultLang] == 'undefined')){
        for(let i in inputData.data){ //set the first lang to default
          inputData.default = i;
          break;
        }
      }

      //update
      this.dbData.i18n[i18n_id] = inputData;

      //output
      let outputBuf = inputData;
      outputBuf.id = fullID+i18n_id;
      let output = JSONAPI.makeJSONAPI(I18N_TYPE_NAME, outputBuf);

      return output;
    }catch(err) {
        throw err;
    }
  }

  deleteI18n(i18n_id) {
    try {

      if(typeof this.dbData.i18n[i18n_id] == 'undefined'){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
      }

      //delete
      delete this.dbData.i18n[i18n_id];

      return this.dbData;
    }catch(err) {
        throw err;
    }
  }
}

exports.main = I18n;