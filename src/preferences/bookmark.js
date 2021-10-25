function bookMark() {
const Store = require('electron-store');

const store = new Store();

store.set('bookmark', 'set');
console.log(store.get('set'));
}