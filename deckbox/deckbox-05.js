const { draw, drawRectangle, drawCircle, Drawing } = replicad;

const magnetTolerance = 0.2;
const nfcTolerance = 0.2;
const topTolerance = 0.2;

const defaultParams = {
  deckWidth: 70,
  // deckDepth: 32,    // 60 single sleeved
  deckDepth: 32.8,  //  two medium dice w/ 2mm wall
  // deckDepth: 42,    //  68 double sleeved
  // deckDepth: 37.2,  //  60 double sleeved, three small dice
  deckHeight: 98,
  cardBottom: 40,
  cardTop: 79,
  wallThickness: 2,
  dividerThickness: 0,
  magnetSize: 5 + magnetTolerance,
  magnetHeight: 3 + magnetTolerance,
  nfcSize: 25 + nfcTolerance,
  nfcHeight: 1 + nfcTolerance,
  diceSmall: 12.4,
  diceMedium: 16.4,
  diceLarge: 23.0,
};


function mirrorQuadrants( drawing ) {
  let res = drawing.clone();
  res = res.fuse( res.clone().mirror( [ 1, 0 ], undefined, "plane" ) );
  res = res.fuse( res.clone().mirror( [ 0, 1 ], undefined, "plane" ) );
  return res;
}


function createPockets( size, count, offset, params ) {
  
  if ( count === 0 ) {
    return;
  }

  const boxHeight = params.deckHeight + params.wallThickness;
  const boxDepth = params.deckDepth + 2 * params.wallThickness;
  const rimWidth = 2 * params.deckWidth + params.dividerThickness + 2 * params.wallThickness;
  const ledgeSize = params.wallThickness / 2;
  const pocketDepth = size + ledgeSize;

  let drawing = drawRectangle( size, pocketDepth )
    .translate( 0, - pocketDepth / 2 + boxDepth / 2 );
  let walls = drawRectangle( ledgeSize, ledgeSize )
    .translate( -size / 2 + ledgeSize / 2, boxDepth / 2 - ledgeSize / 2 );

  drawing = drawing
    .cut( walls.clone() )
    .cut( walls.mirror( [ 0, 1 ], [ 0, 0 ], "plane" ) );

  drawing = drawing
    .fuse( drawing.mirror( [ 1, 0 ], [ 0, 0 ], "plane" ) );

  let x0 = rimWidth / 2 - size / 2 - params.wallThickness;
  let currOffset = offset;
  let group = drawing.clone().translate( x0 + currOffset, 0 );

  for ( let i = 0; i < count - 1; i++ ) {
    currOffset -= ( size + params.wallThickness );
    group = group.fuse( drawing
      .clone()
      .translate( x0 + currOffset, 0 ) 
    );
  }

  currOffset -= ( size + params.wallThickness );

  const bottom = params.deckHeight - Math.floor( params.deckHeight / size ) * size;

  const solid = group
    .sketchOnPlane( "XY", bottom )
    .extrude( boxHeight - params.wallThickness );

  return { solid, offset: currOffset };

}


const main = ( _, params ) => {
  
  //  main block
  const pocketWidth = params.magnetSize + 2 * params.wallThickness;
  const boxWidth = 2 * params.deckWidth + params.dividerThickness + 2 * params.wallThickness + 2 * pocketWidth;
  const boxDepth = params.deckDepth + 4 * params.wallThickness;
  const rimHeight = params.wallThickness + params.cardTop;

  let box = drawRectangle( boxWidth, boxDepth )
    .sketchOnPlane()
    .extrude( rimHeight );

  //  top rim with slanted walls
  const rimWidth = 2 * params.deckWidth + params.dividerThickness + 2 * params.wallThickness;
  const rimDepth = params.deckDepth + 2 * params.wallThickness;
  const rimThickness = params.wallThickness / 2;
  const boxHeight = params.deckHeight + params.wallThickness;

  let rimBottom = drawRectangle( rimWidth, rimDepth )
    .sketchOnPlane( "XY", rimHeight );
  let rimTop = drawRectangle( rimWidth - rimThickness, rimDepth - rimThickness )
    .sketchOnPlane( "XY", boxHeight );

  let rimSolid = rimBottom.loftWith( rimTop );
  let rim = rimSolid.clone();

  //  rim fillets
  rim = rim.fillet( params.wallThickness, 
    e => e.not( e => e.either([
      e => e.inDirection( "X" ),
      e => e.inDirection( "Y" ),
    ]))
  );

  rim = rim.fillet( params.wallThickness, 
    e => e.inPlane( "XY", boxHeight )
  );

  box = box.fuse( rim );

  //  magnets
  let magnetDrawing = drawCircle( params.magnetSize / 2 )
    .translate( boxWidth / 2 - pocketWidth / 2, boxDepth / 2 - pocketWidth / 2 )
  magnetDrawing = mirrorQuadrants( magnetDrawing );

  const magnets = magnetDrawing
    .sketchOnPlane( "XY", rimHeight )
    .extrude( -params.magnetHeight );

  box = box.cut( magnets );

  //  box fillets
  box = box.fillet( params.wallThickness, e => e.either([
      e => e.ofLength( rimHeight ),
      e => e.inPlane( "XY" )
  ]) );


  //  lid

  const lidHeight = boxHeight - rimHeight + params.wallThickness;

  let lid = drawRectangle( boxWidth, boxDepth )
    .sketchOnPlane( "XY", rimHeight )
    .extrude( lidHeight );

  //  lid - outer fillet
  lid = lid.fillet( params.wallThickness, 
    e => e.not( e => e.inPlane( "XY", rimHeight ) )
  );

  let lidCutout = drawRectangle( rimWidth, rimDepth )
    .sketchOnPlane( "XY", rimHeight )
    .extrude( lidHeight - params.wallThickness );

  lid = lid.cut( lidCutout );

  //  lid - inner chamfer
  lid = lid.chamfer( params.wallThickness / 2, e => e.and([
    e => e.inPlane( "XY", rimHeight ),
    e => e.inBox( 
      [ -rimWidth / 2, -rimDepth / 2, 0 ], 
      [ rimWidth / 2, rimDepth / 2, rimHeight ] 
    )
  ]));
  
  //  lid - magnets
  let lidMagnets = magnetDrawing
    .sketchOnPlane( "XY", rimHeight )
    .extrude( params.magnetHeight );

  lid = lid.cut( lidMagnets );

  //  lid - nfc
  const nfc = drawCircle( params.nfcSize / 2 )
    .sketchOnPlane( "XY", boxHeight )
    .extrude( params.nfcHeight );

  lid = lid.cut( nfc );


  //  dice

  //  remove outer wall
  let outerWallDrawing = drawRectangle( rimWidth - params.wallThickness * 2, params.wallThickness )
    .translate( 0, rimDepth / 2 + params.wallThickness / 2 );
  outerWallDrawing = outerWallDrawing    
    .fuse( outerWallDrawing.clone().mirror( [ 1, 0 ], [ 0, 0 ], "plane" ) );

  const outerWall = outerWallDrawing
    .sketchOnPlane( "XY", params.wallThickness )
    .extrude( boxHeight );

  box = box.cut( outerWall );

  let smallRes = createPockets( params.diceSmall, 3, 0, params );
  box = box.cut( smallRes.solid );

  let medRes = createPockets( params.diceMedium, 2, smallRes.offset, params );
  box = box.cut( medRes.solid );

  const restWidth = rimWidth + medRes.offset - 2 * params.wallThickness;
  const restSolid = drawRectangle( restWidth, params.deckDepth )
    .translate( - restWidth / 2 + medRes.offset + rimWidth / 2 - params.wallThickness, 0 )
    .sketchOnPlane( "XY", params.wallThickness )
    .extrude( boxHeight );

    // return restSolid

  box = box.cut( restSolid );

  // //  content cutouts
  
  // const innerWidth = params.deckWidth;
  // const innerCutoutA = drawRectangle( innerWidth, params.deckDepth )
  //   .translate( innerWidth / 2 + params.dividerThickness / 2  )
  //   .sketchOnPlane( "XY", params.wallThickness )
  //   .extrude( boxHeight );
  // const innerCutoutB = innerCutoutA.clone().mirror( "ZY" );
  // box = box.cut( innerCutoutA );
  // box = box.cut( innerCutoutB );
  

  return [ box, lid ];
  
};
