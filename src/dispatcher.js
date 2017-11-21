import {action$} from './store'

/**
 * Dispatcher function, a high order function that dispatches actions to the
 * store.
 * @param {!Function} fn
 * @returns {function(...[*])}
 */
export default function dispatcher(fn) {
  return (...args) => {
    action$.next(fn(...args));
  };
}