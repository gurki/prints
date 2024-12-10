const { draw, drawRectangle, drawCircle } = replicad;

const magnetTolerance = 0.2;
const nfcTolerance = 0.2;
const topTolerance = 0.2;

const defaultParams = {
  deckWidth: 70,
  // deckDepth: 32,    // 60 single sleeved
  // deckDepth: 34.8,  //  two medium dice with 2mm wall
  // deckDepth: 42,    //  68 double sleeved
  deckDepth: 37.2,  //  60 double sleeved, three small dice  
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

  
  const ledgeSize = rimThickness;

  //  remove outer wall
  let outerWallDrawing = drawRectangle( rimWidth - params.wallThickness * 2, params.wallThickness )
    .translate( 0, rimDepth / 2 + params.wallThickness / 2 );
  outerWallDrawing = outerWallDrawing    
    .fuse( outerWallDrawing.clone().mirror( [ 1, 0 ], [ 0, 0 ], "plane" ) );

  const outerWall = outerWallDrawing
    .sketchOnPlane( "XY", params.wallThickness )
    .extrude( boxHeight );

  box = box.cut( outerWall );

  //  small dice
  let diceSmallDrawing = drawRectangle( params.diceSmall, boxDepth )
    .translate( 0, - boxDepth / 2 );
  let walls = drawRectangle( ledgeSize, ledgeSize )
    .translate( -params.diceSmall / 2 + ledgeSize / 2, -params.diceSmall - ledgeSize / 2 );
  
  diceSmallDrawing = diceSmallDrawing
    .cut( walls.clone() )
    .cut( walls.mirror( [ 0, 1 ], [ 0, 0 ], "plane" ) )
    .translate( 0, - params.diceSmall / 2 - params.wallThickness / 2 );
  
  let diceSmallSolid = diceSmallDrawing
    .fuse( diceSmallDrawing.mirror( [ 1, 0 ], [ 0, 0 ], "plane" ) )
    .sketchOnPlane( "XY", params.wallThickness )
    .extrude( boxHeight - params.wallThickness );

  let currx = rimWidth / 2 - params.diceSmall / 2 - params.wallThickness;
  for ( let i = 0; i < 3; i++ ) {
    box = box.cut( diceSmallSolid
      .clone()
      .translateX( currx ) );
    currx -= ( params.diceSmall + params.wallThickness );
  }

  // //  content cutouts
  
  // const innerWidth = params.deckWidth;
  // const innerCutoutA = drawRectangle( innerWidth, params.deckDepth )
  //   .translate( innerWidth / 2 + params.dividerThickness / 2  )
  //   .sketchOnPlane( "XY", params.wallThickness )
  //   .extrude( boxHeight );
  // const innerCutoutB = innerCutoutA.clone().mirror( "ZY" );
  // box = box.cut( innerCutoutA );
  // box = box.cut( innerCutoutB );
  

  return box;
  
};
