# Axol[otl]

A simple canvas sketch pad.

[Project Url](https://theirondev.github.io/axol/)

## Motivation

The intent of this project is to play with the canvas api, as well as playing
with RxJs. There are many painting tools freely available, this does not aim
to compete with any of them, instead it acts as an educational primer.

## Development

Running `npm install` will install dependencies and pre-commit hooks. The
pre-commit hooks including linting with `eslint` and testing with `mocha`.

During the development process running `npm start` will continually watch
for changes on the `src` directory and build out the "compiled" version to
the `dest` directory.

## Architecture

This is a client-side only application. The project was built with `flux` in
mind.

A brief rundown of the files includes:

* `app.js` - Handles event listeners and ui updates from store changes
* `store.js` - Initializes "flux" flow using RxJs
* `dispatcher.js` - Invokes `$action.next()` to promote the next state.
* `reducer.js` - Handles updating store, invoked by dispatcher.
* `actions/actions.js` - Dispatcher methods to update store.

Most of this app's actions revolve around interacting with drawing on the
canvas.

"Drawing" involves:

1. `mousedown` / `touchstart` on the canvas
1. `mousemove` / `touchmove` on the canvas
1. `mouseup` / `touchend` on the document.

Depending on the state of the application / store, drawing will either create
a new shape (circle, rectangle, polygon), or mutate a selected shape
(move / rotate). Every `draw` action updates an array of CanvasItems that are
performed in order... making the presentation of the canvas predictable.

For example, lets say I:

1. Draw a blue rectangle across the entire canvas
1. Draw a green rectangle across the bottom of the canvas
1. Draw a yellow circle

My current canvasActionList would look something like this:

```
[
  {"fillColor":"#46ebff","id":1,"lineColor":"#000","lineWidth":1,"rotate":0,"startX":0,"startY":0,"height":500,"type":"re","width": 500},
  {"fillColor":"#00a900","id":2,"lineColor":"#000","lineWidth":1,"rotate":0,"startX":0,"startY":499,"height":-129,"type":"re","width": 500},
  {"fillColor":"#fffd00","id":3,"lineColor":"#000","lineWidth":1,"rotate":0,"startX":376,"startY":157,"radius": 50,"type":"c"}
]
```

Given this array, I can recreate the picture I drew in the future. This can be
user for saving history, or even collaborative drawing efforts with websockets.

## Other considerations

### Using protos

One change that can provide significant gains is converting the
CanvasActionItems from json format to protos.

For example, this:

```
[
  {"fillColor":"#46ebff","id":1,"lineColor":"#000","lineWidth":1,"rotate":0,"startX":0,"startY":0,"height":500,"type":"re","width": 500},
  {"fillColor":"#00a900","id":2,"lineColor":"#000","lineWidth":1,"rotate":0,"startX":0,"startY":499,"height":-129,"type":"re","width": 500},
  {"fillColor":"#fffd00","id":3,"lineColor":"#000","lineWidth":1,"rotate":0,"startX":376,"startY":157,"radius": 50,"type":"c"}
]
```

would change to this:


```
[
  [1,'re',"#46ebff","#000",1,0,0,0,500, 500,],
  [2,'re',"#00a900","#000",1,0,0,499,-129, 500,],
  [3,'c',"#fffd00","#000",1,0,376,157,,,50]
]
```

In this example, we reduced the character count from 409 to 144. I am not always
the biggest fan of using protos, since it adds extra overhead and data is a bit
harder to debug... but it can be extremely valuable when passing around larger
lists of CanvasItems.

# Development and forking

Contributions are always welcome, also feel free to fork this if you want to
do your own thing. :)

# License

MIT License

Copyright (c) 2017 Tyler Stark

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
