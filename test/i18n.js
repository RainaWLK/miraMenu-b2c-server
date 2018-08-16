let _ = require('lodash');
var chai = require('chai');
let i18n = require('../src/i18n.js');
//chai.use(require('chai-things'));

var expect = chai.expect;

let sample = [
  {
    id: 'r20170001s01_en-US',
    language: 'en-US',
    name: 'jumi',
    i18n: {
      default: 'en-US',
      'en-US': {
        'res-i18n-xxxx': 'jumi'
      },
      'zh-TW': {
        'res-i18n-xxxx': '啾咪'
      }
    }
  },
  {
    id: 'r20170001s01_zh-TW',
    language: 'zh-TW',
    name: '啾咪',
    i18n: {
      default: 'en-US',
      'en-US': {
        'res-i18n-xxxx': 'jumi'
      },
      'zh-TW': {
        'res-i18n-xxxx': '啾咪'
      }
    }
  },
  {
    id: 'r20170001_jp',
    language: 'jp',
    name: 'orz',
    i18n: {
      default: 'jp',
      'jp': {
        'res-i18n-kkkk': 'orz'
      },
      'zh-TW': {
        'res-i18n-xxxx': '囧'
      }
    }
  },
  {
    id: 'r20170001_zh-TW',
    language: 'zh-TW',
    name: '囧',
    i18n: {
      default: 'jp',
      'jp': {
        'res-i18n-kkkk': 'orz'
      },
      'zh-TW': {
        'res-i18n-xxxx': '囧'
      }
    }
  }
]


describe('i18n test', () => {
  describe('select both lang:', () => {
    let source = _.cloneDeep(sample);
    let lang = 'zh-TW';
    let translatedArray = i18n.selectDataByLang(source, lang);
    console.log(translatedArray);

    it('should an array', () => {
      expect(translatedArray).to.be.an('array');
      expect(translatedArray).to.have.lengthOf(2);
    });

    it(`should be correct language: ${lang}`, () => {
      translatedArray.forEach(translatedData => {
        expect(translatedData).to.have.property('language', lang);
      });
    });
    //
  });

  describe('select lang which no one have', () => {
    let source = _.cloneDeep(sample);
    let lang = 'RU';
    let translatedArray = i18n.selectDataByLang(source, lang);
    console.log(translatedArray);

    it('should an array', () => {
      expect(translatedArray).to.be.an('array');
      expect(translatedArray).to.have.lengthOf(2);
    });
    it(`should be correct language: default`, () => {
      translatedArray.forEach(translatedData => {
        let defaultLang = translatedData.i18n.default;
        expect(translatedData).to.have.property('language', defaultLang);
      });
    });
  });

  describe('select lang which someone did not have', () => {
    let source = _.cloneDeep(sample);
    let lang = 'en-US';
    let translatedArray = i18n.selectDataByLang(source, lang);
    console.log(translatedArray);

    it('should an array', () => {
      expect(translatedArray).to.be.an('array');
      expect(translatedArray).to.have.lengthOf(2);
    });
    it(`should be selected language: ${translatedArray[0].id}`, () => {
      expect(translatedArray[0]).to.have.property('language', lang);
    });

    it(`should be default language: ${translatedArray[1].id}`, () => {
      let defaultTest = translatedArray[1];
      let defaultLang = defaultTest.i18n.default;
      expect(defaultTest).to.have.property('language', defaultLang);
    });
  });
});