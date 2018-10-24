let _ = require('lodash');
let request = require('supertest');
var chai = require('chai');
const schema = require('./schema.json');

//chai.use(require('chai-things'));
chai.use(require('chai-ajv-json-schema'));

var expect = chai.expect;

const BASE_URL = 'http://localhost/v1'
const URI = '/restaurants/r1528125059703/branches/s1528125119706/menus/m1528153754828';

let serv = request(BASE_URL);

describe('menu test', () => {
  it('get branch menu', (done) => {
    serv.get(URI)
      .expect(200)
      .then(res => {
        console.log(res.body);
        expect(res.body).to.be.validWithSchema(schema);

        expect(res.body.id).to.equal('r1528125059703s1528125119706m1528153754828');
        expect(res.body.branch_name).to.equal('Changchun branch');
        expect(res.body.restaurant_name).to.equal('Selena\'s Kitchen');
        expect(res.body.name).to.equal('main menu');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
  it('get branch menu with lang=en-US', (done) => {
    serv.get(URI+'?lang=en-US')
      .expect(200)
      .then(res => {
        console.log(res.body);
        expect(res.body.id).to.equal('r1528125059703s1528125119706m1528153754828');
        //expect(res.body.language).to.equal('en-US');
        expect(res.body.branch_name).to.equal('Changchun branch');
        expect(res.body.restaurant_name).to.equal('Selena\'s Kitchen');
        expect(res.body.name).to.equal('main menu');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});

describe('menus test', () => {
  it('get branch menus', (done) => {
    serv.get('/restaurants/r1528125059703/branches/s1528125119706/menus')
      .expect(200)
      .then(res => {
        console.log(res.body);
        expect(res.body).to.be.an('array');
        done();
      })
      .catch(err => {
        done(err);
      });
  });
});