//  [1] https://ultimateguard.com/de/Deck-Boxen/Boulder/UGD010894/
//  [2] https://www.printables.com/model/56553-mtg-commander-deck-box-with-parametrized-fusion360
//  [3] https://www.etsy.com/de/listing/1767419950/kommandant-flatpack-deluxe?click_key=9fa1ed814eaf7b66ed82b712d127ee7dc672575b%3A1767419950&click_sum=50a93f5e&ref=search2_top_narrowing_intent_modules_top_rated-6
//  [4] https://www.etsy.com/de/listing/1761111017/kommandant-flatpack-deckbox?click_key=a70059038aa4556eb5c435c119f80daa95ceb24c%3A1761111017&click_sum=f7a461b1&ref=shop_home_recs_1&crt=1
//  [5] https://www.etsy.com/de/listing/1746308860/kommandanten-nacht-doppel-deckbox?click_key=232d441fe11c51f6ddb5ba7f78e883d62b7f87e0%3A1746308860&click_sum=5148969e&ref=shop_home_active_3&crt=1

const jscad = require('@jscad/modeling');
const path2 = jscad.geometries.path2;
const colorize = jscad.colors.colorize;


const SIZE = {
  card: {
    width: 63,
    height: 88,
    border: 5,
    textBottom: 7,
    artBottom: 40,
    artTop: 10,
  },
  toploader: {
    width: 77,
    height: 102
  },
  deck: {
    width: 70,
    depth: 34,
    height: 93,
  },
  notch: {
    height: null,
    width: null,
  },
  pack: {
    width: null,
    depth: null,
    height: 80,
  },
  magnet: {
    large: {
      width: 6,
      height: 2,
    },
    small: {
      width: 5,
      height: 1,
    },
    tolerance: 0.04,
  },
  token: {
    width: 25,
    height: 3
  },
  wall: 2,
  pocket: null,
};


SIZE.pocket = SIZE.magnet.large.width + SIZE.wall + 2 * SIZE.magnet.tolerance;
SIZE.pack.width = 2 * SIZE.deck.width + 3 * SIZE.wall + 2 * SIZE.pocket;
SIZE.pack.depth = SIZE.deck.depth + 2 * SIZE.wall;
SIZE.notch.height = ( SIZE.deck.height - SIZE.pack.height ) * 0.8;
SIZE.notch.width = SIZE.deck.width * 0.4;

const main = () => {

  //  INLAY
  //  remove deck volumes and notches from box with added walls

  const deckBox = jscad.primitives.cuboid( { size: [
    2 * SIZE.deck.width + 3 * SIZE.wall,
    SIZE.deck.depth + 2 * SIZE.wall,
    SIZE.deck.height + SIZE.wall
  ]});
  const deck = jscad.primitives.cuboid( { size: [ SIZE.deck.width, SIZE.deck.depth, SIZE.deck.height ] });
  const deckLeft = jscad.transforms.translate( [ - ( SIZE.deck.width + SIZE.wall ) / 2, 0, SIZE.wall / 2 ], deck );
  const deckRight = jscad.transforms.translate( [ ( SIZE.deck.width + SIZE.wall ) / 2, 0, SIZE.wall / 2 ], deck );

  let inlay = jscad.booleans.subtract( deckBox, deckLeft, deckRight );
  inlay = jscad.transforms.translateZ( ( SIZE.deck.height + SIZE.wall ) / 2, inlay );

  //  notch

  const w_2 = SIZE.notch.width / 2;
  const h = SIZE.notch.height;

  let p5 = path2.create();
  p5 = path2.appendPoints( [ [ w_2, 0 ], [ -w_2, 0 ] ], p5 );

  p5 = path2.appendBezier({
    controlPoints: [
      [ -w_2, 0 ],
      [ - w_2 / 2, 0 ],
      [ - w_2, - h ],
      [ 0, - h ]
    ],
    segments: 64
  }, p5 );

  p5 = path2.appendBezier( {
    controlPoints: [
      [ 0, - h ],
      [ w_2, - h ],
      [ w_2 / 2, 0 ],
      [ w_2, 0 ],
    ],
    segments: 64
  }, p5 );

  let notch = jscad.extrusions.extrudeLinear( { height: SIZE.wall }, p5 );
  notch = jscad.transforms.rotateX( Math.PI / 2, notch );
  const notch1 = jscad.transforms.translate( [ - SIZE.deck.width / 2, - SIZE.deck.depth / 2, SIZE.deck.height + SIZE.wall ], notch );
  const notch2 = jscad.transforms.translateY( SIZE.deck.depth + SIZE.wall, notch1 );
  const notch3 = jscad.transforms.translateX( SIZE.deck.width + SIZE.wall, notch1 );
  const notch4 = jscad.transforms.translateX( SIZE.deck.width + SIZE.wall, notch2 );

  inlay = jscad.booleans.subtract( inlay, notch1, notch2, notch3, notch4 );

  //  PACK
  //  deckbox with extra walls and pockets for magnets and lid

  let packInner = jscad.primitives.cuboid( { size: [ SIZE.pack.width, SIZE.pack.depth, SIZE.deck.height ]});
  const packOuter = jscad.expansions.expand( { delta: SIZE.wall, corners: "round", segments: 32 }, packInner );
  let pack = jscad.booleans.subtract( packOuter, deckBox );
  pack = jscad.transforms.translateZ( SIZE.deck.height / 2 + SIZE.wall, pack );

  let bottomBox = jscad.primitives.cuboid( { size: [ 2 * SIZE.pack.width, 2 * SIZE.pack.depth, SIZE.pack.height ]});
  bottomBox = jscad.transforms.translateZ( SIZE.pack.height / 2, bottomBox );
  let packBottom = jscad.booleans.intersect( pack, bottomBox );
  
  let topBox = jscad.transforms.translateZ( SIZE.pack.height, bottomBox );
  let packTop = jscad.booleans.intersect( pack, topBox );
  
  //  lid magnets

  const mt = SIZE.magnet.tolerance;
  const mh = SIZE.magnet.large.height + mt;
  const mr = SIZE.magnet.large.width / 2 + mt;

  let lidMagnet = jscad.primitives.cylinder( { height: mh, radius: mr, segments: 32 } );
  lidMagnet = jscad.transforms.translate( [
    mr + SIZE.deck.width + 1.5 * SIZE.wall,
    0,
    SIZE.pack.height - mh / 2
  ], lidMagnet );

  const lidMagnet1 = jscad.transforms.translate( [ SIZE.wall, - SIZE.deck.depth / 2 + mr - SIZE.wall, 0 ], lidMagnet );
  const lidMagnet2 = jscad.transforms.translateY( SIZE.deck.depth - mr, lidMagnet1 );
  const lidMagnet3 = jscad.transforms.translateX( - SIZE.pack.width + 2 * mr, lidMagnet1 );
  const lidMagnet4 = jscad.transforms.translateX( - SIZE.pack.width + 2 * mr, lidMagnet2 );
  const lidMagnetsBottom = jscad.booleans.union( lidMagnet1, lidMagnet2, lidMagnet3, lidMagnet4 );
  const lidMagnetsTop = jscad.transforms.translateZ( mh, lidMagnetsBottom );

  packBottom = jscad.booleans.subtract( packBottom, lidMagnetsBottom );
  packTop = jscad.booleans.subtract( packTop, lidMagnetsTop );
  
  //  window

  const cb = SIZE.card.border;
  const cw = SIZE.card.width;
  const ctop = Math.min( SIZE.pack.height - SIZE.wall, 2 * SIZE.wall + SIZE.card.height - SIZE.card.artTop );
  const cbottom = SIZE.wall + SIZE.card.artBottom;
  const ch = ctop - cbottom;
  
  let window = jscad.primitives.rectangle( { size: [ cw - 2 * cb, ch - 2 * cb ] } );
  window = jscad.expansions.expand( { delta: cb, corners: "round", segments: 32 }, window );
  window = jscad.extrusions.extrudeLinear( { height: 2 * SIZE.wall }, window );
  window = jscad.transforms.translateY( ch / 2, window );
  window = jscad.transforms.rotateX( Math.PI / 2, window );
  window = jscad.transforms.translate( [ SIZE.deck.width / 2 + SIZE.wall / 2, -SIZE.deck.depth / 2, cbottom ], window );
  //return window;
  
  //  combine
  
  let full = jscad.booleans.union( packBottom, inlay );
  full = jscad.booleans.subtract( full, window );

  return [
    colorize( [0.8, 0.8, 0.8], full ),
    colorize( [0.2, 0.2, 0.2, 0.5], packTop )
  ];

}


module.exports = { main }
