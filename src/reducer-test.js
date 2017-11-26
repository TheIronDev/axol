import assert from 'assert';
import reducer from './reducer';

describe('reducer', () => {
  it('no matches should return state', () => {
    const initialState = {};
    const action = {type: '?', payload: '?'};
    assert.equal(reducer(initialState, action), initialState);
  });
});