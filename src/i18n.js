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
    let outputLang = lang;
    if(typeof this.dbData.i18n !== 'object'){
      return this.dbData;
    }
    //get lang pack
    let langPack = this.dbData.i18n[lang];
    let defaultPack = this.dbData.i18n[this.dbData.i18n.default];
    if(typeof langPack !== 'object'){
      //use default
      outputLang = this.dbData.i18n.default;
      langPack = defaultPack;
      
      //for compitable
      if(langPack === undefined){
        //console.log('no default langPack, skip');
        return this.dbData;
      }
    }
    
    let translateElement = (element) => {
      let header = "i18n::";
      if((typeof element == 'string')&&(element.indexOf(header) == 0)){
        let key = element.substring(header.length);
        if(key.indexOf('res-i18n-') == 0){
          element = this.getStr(langPack, defaultPack, key);
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
    this.dbData.language = outputLang;
    return this.dbData;
  }

  getStr(langPack, defaultPack, key){
    let i18nStr = langPack[key];

    if(typeof i18nStr === 'string'){
      return i18nStr;
    }
    else {
      i18nStr = defaultPack[key];
      if(typeof i18nStr === 'string'){
        return i18nStr;
      }
      return "";
    }
  }

  makei18n(i18nSchema, inputData, lang) {
    let seq = -1;

    if(typeof this.dbData.i18n !== 'object'){
      this.dbData.i18n = {};
    }
    if(typeof this.dbData.i18n[lang] !== 'object'){
      this.dbData.i18n[lang] = {};
    }
    if(typeof this.dbData.i18n.default !== 'string'){
      this.dbData.i18n.default = lang;
    }
    inputData.i18n = this.dbData.i18n;
    let i18nPack = inputData.i18n[lang];
    
    let makei18nElement = (schemaData, element, dbDataElement) => {
      seq++;
      if((typeof element === typeof schemaData)&&(_.isEmpty(element) === false)){
        if(typeof element === 'string'){
          let key = null;
          let header = 'i18n::';
          let i18nExisted = false;

          //check string existed
          if((typeof dbDataElement === 'string')&&(dbDataElement.indexOf(header) === 0)){
            key = dbDataElement.substring(header.length);

            let defaultLang = inputData.i18n.default;
            if(typeof this.dbData.i18n[defaultLang][key] === 'string'){
              i18nExisted = true;
            }
          }

          if(i18nExisted){
            i18nPack[key] = element;
            element = dbDataElement;
          }
          else {
            key = this.getNewResourceID("i18n", seq);
            i18nPack[key] = element;
            element = header+key;
          }
          
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
    
      };
      return element;
    };
    
    if((typeof this.dbData === 'object')&&(typeof inputData === 'object')) {
      for(let i in i18nSchema){  
        inputData[i] = makei18nElement(i18nSchema[i], inputData[i], this.dbData[i]);
      }
    }
    
    //default lang
    let inputDefaultLang = inputData.default_language;
    if((typeof inputDefaultLang === 'string') && (typeof inputData.i18n[inputDefaultLang] === 'object')){
      inputData.i18n.default = inputDefaultLang;
    }
    delete inputData.default_language;
    
    
    //console.log(inputData);
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

}

function selectDataByLang(sourceDataArray, lang) {
  let targetDataArray = [];
  if(typeof lang === 'string') {
    targetDataArray = sourceDataArray.filter(element => element.language.toLowerCase()===lang.toLowerCase());
  }

  if(targetDataArray.length === 0) {
    //get default
    let defaultLang = sourceDataArray[0].i18n.default.toLowerCase();
    
    //group by id
    let idGroup = {};
    sourceDataArray.forEach(element => {
      let id = element.id.substring(0, element.id.lastIndexOf('_'));
      let defaultLang = element.i18n.default.toLowerCase();

      if(idGroup[id] === undefined) {
        idGroup[id] = {
          'default': defaultLang,
          'data': []
        };
      }
      
      idGroup[id].data.push(element);
    });

    for(let i in idGroup) {
      let idData = idGroup[i];
      let target = idData.data.find(element => element.language.toLowerCase()===idData.default);

      targetDataArray.push(target);
    }
  
  }
  return targetDataArray;
}

exports.main = I18n;
exports.selectDataByLang = selectDataByLang;